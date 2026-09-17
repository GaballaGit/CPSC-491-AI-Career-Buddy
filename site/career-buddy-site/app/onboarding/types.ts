export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

export type LearningPreference =
  | "videos"
  | "reading"
  | "hands_on_projects"
  | "mentorship"
  | "structured_courses";

/**
 * Local to the onboarding feature only. This is not the Career Profile API
 * contract (that's KAN-3/KAN-4's job) — just what this form needs to
 * validate and hand off to storage.ts.
 */
export interface OnboardingFormData {
  targetCareer: string;
  experienceLevel: ExperienceLevel | "";
  skills: string[];
  learningPreferences: LearningPreference[];
  weeklyAvailabilityHours: number | "";
}

export const initialOnboardingFormData: OnboardingFormData = {
  targetCareer: "",
  experienceLevel: "",
  skills: [],
  learningPreferences: [],
  weeklyAvailabilityHours: "",
};
