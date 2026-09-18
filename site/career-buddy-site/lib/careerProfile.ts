import type {
  ExperienceLevel,
  LearningPreference,
  OnboardingFormData,
} from "../app/onboarding/types";

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

// Same-origin path: next.config.ts proxies /api to the Express server, and the
// browser sends the Auth.js session cookie with it.
const ENDPOINT = "/api/career-profile";

async function request<T>(init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(ENDPOINT, { cache: "no-store", ...init });
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

export const SIGN_IN_URL = "/api/auth/signin";
