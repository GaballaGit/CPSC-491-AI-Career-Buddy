import type {
  ExperienceLevel,
  LearningPreference,
  OnboardingFormData,
} from "./careerProfileForm";
import { authHeaders } from "./auth";

export interface CareerProfile {
  id: string;
  user_id: string;
  target_career: string;
  experience_level: ExperienceLevel;
  skills: string[];
  learning_preferences: LearningPreference[];
  weekly_availability_hours: number;
  created_at: string;
  updated_at: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details: { field: string; message: string }[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Career Profile Edge Function (C40CS-32), called directly like jobs.
function profileFunctionUrl(): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new ApiError(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL.",
      0,
    );
  }
  return `${supabaseUrl}/functions/v1/profile`;
}

async function request<T>(init?: RequestInit): Promise<T> {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) {
    throw new ApiError(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      0,
    );
  }

  const headers = new Headers(init?.headers);
  headers.set("apikey", anonKey);
  for (const [key, value] of Object.entries(await authHeaders())) {
    headers.set(key, value);
  }

  let response: Response;
  try {
    response = await fetch(profileFunctionUrl(), {
      cache: "no-store",
      ...init,
      headers,
    });
  } catch {
    throw new ApiError("Could not reach the server.", 0);
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) {
    throw new ApiError(
      payload?.error?.message ?? `Request failed (${response.status}).`,
      response.status,
      payload?.error?.details ?? [],
    );
  }
  return payload.data as T;
}

/** Returns the signed-in user's profile, or null if they haven't onboarded. */
export function getCareerProfile(): Promise<CareerProfile | null> {
  return request<CareerProfile | null>();
}

export function saveCareerProfile(
  form: OnboardingFormData,
): Promise<CareerProfile> {
  return request<CareerProfile>({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      target_career: form.targetCareer,
      experience_level: form.experienceLevel,
      skills: form.skills,
      learning_preferences: form.learningPreferences,
      weekly_availability_hours: form.weeklyAvailabilityHours,
    }),
  });
}

export const SIGN_IN_URL = "/signin";
