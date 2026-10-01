import { FunctionsHttpError } from "@supabase/supabase-js";

import type {
  ApiErrorPayload,
  ResumeUploadData,
  SavedResumeSkills,
} from "../app/resume/types";
import { getSupabaseClient } from "./supabase";

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
