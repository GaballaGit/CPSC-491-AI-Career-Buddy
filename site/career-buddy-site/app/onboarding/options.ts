import type { ExperienceLevel, LearningPreference } from "./types";

export const EXPERIENCE_LEVELS: { value: ExperienceLevel; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export const LEARNING_PREFERENCES: {
  value: LearningPreference;
  label: string;
}[] = [
  { value: "videos", label: "Video courses" },
  { value: "reading", label: "Articles & docs" },
  { value: "hands_on_projects", label: "Hands-on projects" },
  { value: "mentorship", label: "Mentorship" },
  { value: "structured_courses", label: "Structured courses" },
];
