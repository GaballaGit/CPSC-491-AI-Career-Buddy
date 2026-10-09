import { FunctionsHttpError } from "@supabase/supabase-js";

import { getSupabaseClient } from "./supabase";

// Skill - Shared skill contract shape (api/src/utils/skills.ts)
export interface Skill {
  name: string;
  key: string;
}

// Upload Result - What the resume function returns on success
export interface ResumeUploadData {
  filename: string;
  sizeBytes: number;
  characters: number;
  text: string;
  skills: Skill[];
}

// Saved Skills - GET /resume/skills; filename is null before the first upload
export interface SavedResumeSkills {
  filename: string | null;
  skills: Skill[];
  updatedAt: string | null;
}

// AI Feedback - POST /resume/feedback; targetRole is null without a profile
export interface ResumeFeedback {
  strengths: string[];
  weaknesses: string[];
  missing_skills: string[];
  suggestions: string[];
  targetRole: string | null;
}

// Error Payload - Shared API error shape
export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: { field: string; message: string }[];
}

export type ResumeUploadResponse =
  | { success: true; data: ResumeUploadData; meta?: { timestamp: string } }
  | { success: false; error: ApiErrorPayload };

// Typed Failure - Message is always safe to show the user
export class ResumeRequestError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "ResumeRequestError";
  }
}

// Friendly Messages - Codes the user can act on; everything else is generic
const FRIENDLY_CODES = new Set([
  "VALIDATION_ERROR",
  "UNSUPPORTED_FILE_TYPE",
  "NO_TEXT_FOUND",
  "AI_NOT_CONFIGURED",
  "AI_UNAVAILABLE",
  "AI_TIMEOUT",
  "AI_INVALID_RESPONSE",
]);

async function toRequestError(error: unknown): Promise<ResumeRequestError> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = (await error.context.json()) as {
        error?: ApiErrorPayload;
      };
      const apiError = body.error;
      if (apiError?.code === "AUTHENTICATION_REQUIRED") {
        return new ResumeRequestError(
          "Sign in to use resume features.",
          apiError.code,
        );
      }
      if (apiError && FRIENDLY_CODES.has(apiError.code)) {
        return new ResumeRequestError(
          apiError.details?.[0]?.message ?? apiError.message,
          apiError.code,
        );
      }
    } catch {
      // Unreadable body - fall through to the generic message
    }
  }
  return new ResumeRequestError(
    "Something went wrong. Please try again.",
    "UNKNOWN",
  );
}

// Session Check - True when a user is signed in
export async function isSignedIn(): Promise<boolean> {
  const { data } = await getSupabaseClient().auth.getSession();
  return Boolean(data.session);
}

// Upload - POST /resume (Edge Function)
export async function uploadResume(file: File): Promise<ResumeUploadData> {
  const form = new FormData();
  form.append("file", file);

  const { data, error } = await getSupabaseClient().functions.invoke("resume", {
    body: form,
  });
  if (error) throw await toRequestError(error);
  return (data as { data: ResumeUploadData }).data;
}

// Saved Skills - GET /resume/skills (Edge Function)
export async function getSavedResumeSkills(): Promise<SavedResumeSkills> {
  const { data, error } = await getSupabaseClient().functions.invoke(
    "resume/skills",
    { method: "GET" },
  );
  if (error) throw await toRequestError(error);
  return (data as { data: SavedResumeSkills }).data;
}

/**
 * Best-effort fetch of the signed-in user's resume-derived skills, for the
 * profile edit flow's "import from resume" step (C40CS-8). Returns an empty
 * list rather than throwing on any failure — no resume uploaded yet, not
 * signed in, or the resume Edge Function isn't deployed (C40CS-15) are all
 * just "nothing to offer", not errors this page should surface.
 */
export async function getResumeSkills(): Promise<string[]> {
  try {
    const { data, error } = await getSupabaseClient().functions.invoke(
      "resume/skills",
      { method: "GET" },
    );
    if (error) return [];

    const skills = (data as { data?: { skills?: unknown } } | null)?.data
      ?.skills;
    if (!Array.isArray(skills)) return [];

    return skills
      .map((skill) =>
        typeof skill === "object" && skill !== null && "name" in skill
          ? String((skill as { name: unknown }).name)
          : null
      )
      .filter((name): name is string => name !== null);
  } catch {
    return [];
  }
}

// AI Feedback - POST /resume/feedback (Edge Function)
export async function getResumeFeedback(text: string): Promise<ResumeFeedback> {
  const { data, error } = await getSupabaseClient().functions.invoke(
    "resume/feedback",
    { body: { text } },
  );
  if (error) throw await toRequestError(error);
  return (data as { data: ResumeFeedback }).data;
}
