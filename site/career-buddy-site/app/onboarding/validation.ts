import type { OnboardingFormData } from "./types";

// Keep in sync with api/src/utils/validation.ts so the form never lets through
// something the server will reject.
export const LIMITS = {
  targetCareerMaxLength: 100,
  skillMaxLength: 50,
  maxSkills: 30,
  minWeeklyHours: 1,
  maxWeeklyHours: 168,
} as const;

/** Returns an error message for the given step, or null if it's valid. */
export function validateStep(
  step: number,
  data: OnboardingFormData,
): string | null {
  switch (step) {
    case 0: {
      const career = data.targetCareer.trim();
      if (!career) return "Enter the career you're targeting.";
      if (career.length > LIMITS.targetCareerMaxLength) {
        return `Keep it to ${LIMITS.targetCareerMaxLength} characters or fewer.`;
      }
      return null;
    }
    case 1:
      return data.experienceLevel ? null : "Choose your experience level.";
    case 2:
      if (data.skills.length === 0) return "Add at least one skill.";
      if (data.skills.length > LIMITS.maxSkills) {
        return `You can add up to ${LIMITS.maxSkills} skills.`;
      }
      return null;
    case 3:
      return data.learningPreferences.length > 0
        ? null
        : "Choose at least one way you like to learn.";
    case 4: {
      const hours = data.weeklyAvailabilityHours;
      if (hours === "")
        return "Enter how many hours per week you can dedicate.";
      if (
        !Number.isInteger(hours) ||
        hours < LIMITS.minWeeklyHours ||
        hours > LIMITS.maxWeeklyHours
      ) {
        return `Enter a whole number of hours from ${LIMITS.minWeeklyHours} to ${LIMITS.maxWeeklyHours}.`;
      }
      return null;
    }
    default:
      return null;
  }
}

/** Returns an error for a skill about to be added, or null if it can be added. */
export function validateNewSkill(
  skill: string,
  existing: string[],
): string | null {
  const trimmed = skill.trim();
  if (!trimmed) return "Type a skill before adding it.";
  if (trimmed.length > LIMITS.skillMaxLength) {
    return `Each skill must be ${LIMITS.skillMaxLength} characters or fewer.`;
  }
  if (existing.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
    return `"${trimmed}" is already added.`;
  }
  if (existing.length >= LIMITS.maxSkills) {
    return `You can add up to ${LIMITS.maxSkills} skills.`;
  }
  return null;
}
