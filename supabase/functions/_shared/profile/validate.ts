/** Career Profile request validation (C40CS-32). Port of
 * validateCreateCareerProfile in api/src/utils/validation.ts; the Express copy
 * goes away with the Express API, so keep the two in sync until then.
 */
import { normalizeSkills } from "../../../../api/src/utils/skills.ts";
import { type FieldError, HttpError } from "../http.ts";

export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

export type LearningPreference =
  | "videos"
  | "reading"
  | "hands_on_projects"
  | "mentorship"
  | "structured_courses";

export interface CareerProfileInput {
  target_career: string;
  experience_level: ExperienceLevel;
  skills: string[];
  learning_preferences: LearningPreference[];
  weekly_availability_hours: number;
}

const EXPERIENCE_LEVELS: readonly ExperienceLevel[] = [
  "beginner",
  "intermediate",
  "advanced",
];

const LEARNING_PREFERENCES: readonly LearningPreference[] = [
  "videos",
  "reading",
  "hands_on_projects",
  "mentorship",
  "structured_courses",
];

// Limits - Same as the CHECK constraints in 003_create_career_profiles.sql and
// site/career-buddy-site/lib/careerProfileForm.ts
const TARGET_CAREER_MAX_LENGTH = 100;
const SKILL_MAX_LENGTH = 50;
const MAX_SKILLS = 30;
const MIN_WEEKLY_HOURS = 1;
const MAX_WEEKLY_HOURS = 168;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validationError(message: string, details?: FieldError[]) {
  return new HttpError(400, "VALIDATION_ERROR", message, details);
}

// Validate - Per-field errors in one 400, normalized profile on success
export function validateCareerProfile(body: unknown): CareerProfileInput {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw validationError("Request body must be a JSON object.");
  }

  const input = body as Record<string, unknown>;
  const errors: FieldError[] = [];

  const targetCareer = input.target_career;
  if (!isNonEmptyString(targetCareer)) {
    errors.push({
      field: "target_career",
      message: "target_career is required.",
    });
  } else if (targetCareer.trim().length > TARGET_CAREER_MAX_LENGTH) {
    errors.push({
      field: "target_career",
      message:
        `target_career must be ${TARGET_CAREER_MAX_LENGTH} characters or fewer.`,
    });
  }

  const experienceLevel = input.experience_level;
  if (!EXPERIENCE_LEVELS.includes(experienceLevel as ExperienceLevel)) {
    errors.push({
      field: "experience_level",
      message: `experience_level must be one of: ${
        EXPERIENCE_LEVELS.join(", ")
      }.`,
    });
  }

  let skills: string[] = [];
  if (
    !Array.isArray(input.skills) ||
    input.skills.length === 0 ||
    !input.skills.every(isNonEmptyString)
  ) {
    errors.push({
      field: "skills",
      message: "skills must be a non-empty array of non-empty strings.",
    });
  } else {
    skills = normalizeSkills(input.skills).map((skill) => skill.name);
    if (skills.some((skill) => skill.length > SKILL_MAX_LENGTH)) {
      errors.push({
        field: "skills",
        message: `Each skill must be ${SKILL_MAX_LENGTH} characters or fewer.`,
      });
    } else if (skills.length > MAX_SKILLS) {
      errors.push({
        field: "skills",
        message: `skills can have at most ${MAX_SKILLS} entries.`,
      });
    }
  }

  const learningPreferences = input.learning_preferences;
  if (
    !Array.isArray(learningPreferences) ||
    learningPreferences.length === 0 ||
    !learningPreferences.every((pref) =>
      LEARNING_PREFERENCES.includes(pref as LearningPreference)
    )
  ) {
    errors.push({
      field: "learning_preferences",
      message: `learning_preferences must be a non-empty array of: ${
        LEARNING_PREFERENCES.join(", ")
      }.`,
    });
  }

  const hours = input.weekly_availability_hours;
  if (
    typeof hours !== "number" ||
    !Number.isInteger(hours) ||
    hours < MIN_WEEKLY_HOURS ||
    hours > MAX_WEEKLY_HOURS
  ) {
    errors.push({
      field: "weekly_availability_hours",
      message:
        `weekly_availability_hours must be a whole number from ${MIN_WEEKLY_HOURS} to ${MAX_WEEKLY_HOURS}.`,
    });
  }

  if (errors.length > 0) {
    throw validationError("Invalid Career Profile.", errors);
  }

  return {
    target_career: (targetCareer as string).trim(),
    experience_level: experienceLevel as ExperienceLevel,
    skills,
    learning_preferences: [
      ...new Set(learningPreferences as LearningPreference[]),
    ],
    weekly_availability_hours: hours as number,
  };
}
