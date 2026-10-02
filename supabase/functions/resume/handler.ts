/** Resume function: upload (POST /resume), saved skills (GET /resume/skills),
 * AI feedback (POST /resume/feedback), and deployment health verification
 * (GET /resume/health).
 */

import { type AuthContext, authenticate } from "../_shared/auth.ts";
import { corsHeaders, fail, HttpError, ok } from "../_shared/http.ts";
import { extractResumeText } from "../_shared/resume/extract.ts";
import {
  generateFeedback,
  llmConfigFromEnv,
  type ResumeFeedback,
} from "../_shared/resume/feedback.ts";
import {
  type ResumeSkillStore,
  supabaseResumeSkillStore,
} from "../_shared/resume/repository.ts";
import { extractSkills } from "../_shared/resume/skills.ts";
import { validateResumeFile } from "../_shared/resume/validate.ts";

export interface ResumeDeps {
  authenticate(req: Request): Promise<AuthContext | null>;
  store(auth: AuthContext): ResumeSkillStore;
  feedback?(text: string, targetRole: string | null): Promise<ResumeFeedback>;
  targetRole?(auth: AuthContext): Promise<string | null>;
}

// Target Role - From the user's Career Profile, null when there is none
async function careerProfileTargetRole(
  auth: AuthContext,
): Promise<string | null> {
  const { data } = await auth.db
    .from("career_profiles")
    .select("target_career")
    .eq("user_id", auth.userId)
    .maybeSingle();
  return data?.target_career ?? null;
}

const defaultDeps: ResumeDeps = {
  authenticate,
  store: (auth) => supabaseResumeSkillStore(auth.db),
  feedback: (text, targetRole) =>
    generateFeedback(text, targetRole, llmConfigFromEnv()),
  targetRole: careerProfileTargetRole,
};

const MAX_FEEDBACK_TEXT = 50_000;

// Public health response used by post-deployment smoke checks.
// Keep this intentionally small and free of secrets or environment details.
function health(): Response {
  return ok({
    status: "ok",
    service: "resume",
  });
}

// Sign-in Check - 401 when there is no real user
async function requireUser(req: Request, deps: ResumeDeps) {
  const auth = await deps.authenticate(req);

  if (!auth) {
    throw new HttpError(
      401,
      "AUTHENTICATION_REQUIRED",
      "Sign in to use resume features.",
    );
  }

  return {
    userId: auth.userId,
    store: deps.store(auth),
  };
}

// Upload - Validate, extract text and skills, save for this user
async function upload(
  req: Request,
  deps: ResumeDeps,
): Promise<Response> {
  const { userId, store } = await requireUser(req, deps);

  let form: FormData;

  try {
    form = await req.formData();
  } catch {
    throw new HttpError(
      400,
      "INVALID_REQUEST",
      "Request must be multipart/form-data with a file field.",
    );
  }

  const file = validateResumeFile(form.get("file"));
  const bytes = new Uint8Array(await file.arrayBuffer());
  const text = await extractResumeText(bytes, file.name);
  const skills = extractSkills(text);

  await store.save(userId, file.name, skills);

  return ok({
    filename: file.name,
    sizeBytes: file.size,
    characters: text.length,
    text,
    skills,
  });
}

// Saved Skills - Current user's latest resume skills
async function savedSkills(
  req: Request,
  deps: ResumeDeps,
): Promise<Response> {
  const { userId, store } = await requireUser(req, deps);

  const saved = await store.load(userId);

  return ok(
    saved ?? {
      filename: null,
      skills: [],
      updatedAt: null,
    },
  );
}

// Feedback - Resume text (+ optional target role) to structured AI feedback
async function feedback(req: Request, deps: ResumeDeps): Promise<Response> {
  const auth = await deps.authenticate(req);
  if (!auth) {
    throw new HttpError(
      401,
      "AUTHENTICATION_REQUIRED",
      "Sign in to use resume features.",
    );
  }

  const body = await req.json().catch(() => null) as {
    text?: unknown;
    targetRole?: unknown;
  } | null;
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text || text.length > MAX_FEEDBACK_TEXT) {
    throw new HttpError(400, "VALIDATION_ERROR", "Resume text is required.", [
      { field: "text", message: "Upload a resume before asking for feedback." },
    ]);
  }

  const givenRole = typeof body?.targetRole === "string"
    ? body.targetRole.trim()
    : "";
  const targetRole = givenRole ||
    (await deps.targetRole?.(auth).catch(() => null)) || null;

  const generate = deps.feedback ?? defaultDeps.feedback!;
  const result = await generate(text, targetRole);
  return ok({ ...result, targetRole });
}

export function createResumeHandler(
  deps: ResumeDeps = defaultDeps,
) {
  return async (req: Request): Promise<Response> => {
    // Preflight - CORS
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        headers: corsHeaders,
      });
    }

    try {
      const path = new URL(req.url).pathname;

      // Public deployment health endpoint.
      // This intentionally requires no authentication.
      if (
        req.method === "GET" &&
        path.endsWith("/health")
      ) {
        return health();
      }

      if (req.method === "POST" && path.endsWith("/feedback")) {
        return await feedback(req, deps);
      }

      if (
        req.method === "POST" &&
        !path.endsWith("/skills")
      ) {
        return await upload(req, deps);
      }

      if (
        req.method === "GET" &&
        path.endsWith("/skills")
      ) {
        return await savedSkills(req, deps);
      }

      throw new HttpError(
        405,
        "INVALID_REQUEST",
        "Use POST /resume to upload, GET /resume/skills to read skills, POST /resume/feedback for AI feedback, or GET /resume/health for health verification.",
      );
    } catch (error) {
      return fail(error);
    }
  };
}

export const handleResumeRequest = createResumeHandler();
