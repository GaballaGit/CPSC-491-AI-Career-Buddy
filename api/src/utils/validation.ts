/** Request validation helpers shared by controllers. */
import {
  RESUME_ALLOWED_EXTENSIONS,
  RESUME_MAX_BYTES,
} from "../constants/index.js";
import type {
  CreateCareerProfileDto,
  ExperienceLevel,
  LearningPreference,
} from "../entities/index.js";
import { ValidationError } from "../errors/index.js";
import { normalizeSkills } from "./skills.js";

type FieldError = { field: string; message: string };

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

// Keep in sync with site/career-buddy-site/app/onboarding/validation.ts.
const TARGET_CAREER_MAX_LENGTH = 100;
const SKILL_MAX_LENGTH = 50;
const MAX_SKILLS = 30;
const MIN_WEEKLY_HOURS = 1;
const MAX_WEEKLY_HOURS = 168;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

// Resume Upload - Reject bad files before extraction runs
export function validateResumeFile(
  file?: Express.Multer.File,
): Express.Multer.File {
  if (!file) {
    throw new ValidationError("No file was uploaded.", [
      { field: "file", message: "A resume file is required." },
    ]);
  }

  const ext = file.originalname.toLowerCase().split(".").pop() ?? "";

  if (!RESUME_ALLOWED_EXTENSIONS.includes(ext)) {
    throw new ValidationError("Unsupported file type.", [
      {
        field: "file",
        message: `Only ${RESUME_ALLOWED_EXTENSIONS.join(" and ")} files are accepted.`,
      },
    ]);
  }

  if (file.size > RESUME_MAX_BYTES) {
    throw new ValidationError("File is too large.", [
      {
        field: "file",
        message: `Maximum size is ${RESUME_MAX_BYTES / 1024 / 1024} MB.`,
      },
    ]);
  }

  return file;
}

// Limits mirror the CHECK constraints in 003_create_career_profiles.sql so bad
// input gets a 400 here instead of a database error.
export function validateCreateCareerProfile(
  body: unknown,
): CreateCareerProfileDto {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ValidationError("Request body must be a JSON object.");
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
      message: `target_career must be ${TARGET_CAREER_MAX_LENGTH} characters or fewer.`,
    });
  }

  const experienceLevel = input.experience_level;
  if (!EXPERIENCE_LEVELS.includes(experienceLevel as ExperienceLevel)) {
    errors.push({
      field: "experience_level",
      message: `experience_level must be one of: ${EXPERIENCE_LEVELS.join(", ")}.`,
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
      LEARNING_PREFERENCES.includes(pref as LearningPreference),
    )
  ) {
    errors.push({
      field: "learning_preferences",
      message: `learning_preferences must be a non-empty array of: ${LEARNING_PREFERENCES.join(", ")}.`,
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
      message: `weekly_availability_hours must be a whole number from ${MIN_WEEKLY_HOURS} to ${MAX_WEEKLY_HOURS}.`,
    });
  }

  if (errors.length > 0) {
    throw new ValidationError("Invalid Career Profile.", errors);
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
