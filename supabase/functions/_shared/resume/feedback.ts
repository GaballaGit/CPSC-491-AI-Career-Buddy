/** AI resume feedback through an OpenAI-compatible chat API (C40CS-14). */
import { HttpError } from "../http.ts";

export interface ResumeFeedback {
  strengths: string[];
  weaknesses: string[];
  missing_skills: string[];
  suggestions: string[];
}

export interface LlmConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
}

const FIELDS = [
  "strengths",
  "weaknesses",
  "missing_skills",
  "suggestions",
] as const;

const MAX_RESUME_CHARS = 12_000;

// Config - Null when the AI provider is not set up
export function llmConfigFromEnv(): LlmConfig | null {
  const apiKey = Deno.env.get("LLM_API_KEY");
  const baseUrl = Deno.env.get("LLM_BASE_URL");
  const model = Deno.env.get("LLM_MODEL");
  if (!apiKey || !baseUrl || !model) return null;
  return {
    apiKey,
    baseUrl: baseUrl.replace(/\/+$/, ""),
    model,
    timeoutMs: 45_000,
  };
}

// Prompt - Ask for one JSON object with four string arrays
function buildMessages(text: string, targetRole: string | null) {
  const role = targetRole
    ? `The candidate is targeting this role: ${targetRole}.`
    : "No target role was given; review for a general software role.";
  return [
    {
      role: "system",
      content:
        "You review resumes. Reply with only one JSON object, no markdown, " +
        'with exactly these keys: "strengths", "weaknesses", ' +
        '"missing_skills", "suggestions". Each value is an array of 2 to 5 ' +
        "short, specific strings. missing_skills lists skills relevant to " +
        "the target role that the resume does not show.",
    },
    {
      role: "user",
      content: `${role}\n\nResume:\n${text.slice(0, MAX_RESUME_CHARS)}`,
    },
  ];
}

// Parse - Accept code fences or a reasoning block around the JSON
export function parseFeedback(raw: string): ResumeFeedback {
  const cleaned = raw.replace(/<think>[\s\S]*?<\/think>/g, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const invalid = new HttpError(
    502,
    "AI_INVALID_RESPONSE",
    "The AI returned an unexpected response. Please try again.",
  );
  if (start === -1 || end <= start) throw invalid;

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    throw invalid;
  }
  if (typeof parsed !== "object" || parsed === null) throw invalid;

  const result = {} as ResumeFeedback;
  for (const field of FIELDS) {
    const value = (parsed as Record<string, unknown>)[field];
    if (!Array.isArray(value)) throw invalid;
    result[field] = value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return result;
}

// Main Entry - Call the provider and validate the reply
export async function generateFeedback(
  text: string,
  targetRole: string | null,
  config: LlmConfig | null,
  fetchFn: typeof fetch = fetch,
): Promise<ResumeFeedback> {
  if (!config) {
    throw new HttpError(
      503,
      "AI_NOT_CONFIGURED",
      "AI feedback is not available right now.",
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);

  let response: Response;
  try {
    response = await fetchFn(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        messages: buildMessages(text, targetRole),
        temperature: 0.2,
      }),
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new HttpError(
        504,
        "AI_TIMEOUT",
        "AI feedback took too long. Please try again.",
      );
    }
    console.error("AI provider request failed:", (error as Error).name);
    throw new HttpError(
      502,
      "AI_UNAVAILABLE",
      "AI feedback is not available right now. Please try again later.",
    );
  } finally {
    clearTimeout(timer);
  }

  // Provider Error - Log the status only, never the body or key
  if (!response.ok) {
    await response.body?.cancel();
    console.error("AI provider returned status", response.status);
    throw new HttpError(
      502,
      "AI_UNAVAILABLE",
      "AI feedback is not available right now. Please try again later.",
    );
  }

  const body = await response.json().catch(() => null) as {
    choices?: Array<{ message?: { content?: string } }>;
  } | null;
  const content = body?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new HttpError(
      502,
      "AI_INVALID_RESPONSE",
      "The AI returned an unexpected response. Please try again.",
    );
  }
  return parseFeedback(content);
}
