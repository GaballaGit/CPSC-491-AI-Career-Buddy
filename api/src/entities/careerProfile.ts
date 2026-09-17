/**
 * Career Profile Entity and Data Transfer Objects (DTOs)
 * Defined for Member 1 Subsystem: Career Profile
 *
 * Fields intentionally mirror the onboarding questionnaire (KAN-2) inputs
 * so the API can persist exactly what the form collects. See
 * career-profile-schema.md for the full schema and cross-subsystem contract.
 */

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export type LearningPreference =
  | 'videos'
  | 'reading'
  | 'hands_on_projects'
  | 'mentorship'
  | 'structured_courses';

/**
 * Core Career Profile Domain Entity representing a user's target career,
 * experience level, skills, learning preferences, and weekly availability.
 * One-to-one with a user: each user has at most one Career Profile.
 */
export interface CareerProfile {
  id: string; // UUID v4 primary key
  user_id: string; // UUID v4 foreign key referencing the owner (unique — one profile per user)
  target_career: string; // e.g. "Frontend Engineer"
  experience_level: ExperienceLevel;
  skills: string[]; // Normalized skill tags (e.g. ["TypeScript", "SQL"])
  learning_preferences: LearningPreference[];
  weekly_availability_hours: number; // Hours per week the user can dedicate
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

/**
 * DTO for creating a new Career Profile
 */
export interface CreateCareerProfileDto {
  target_career: string;
  experience_level: ExperienceLevel;
  skills: string[];
  learning_preferences: LearningPreference[];
  weekly_availability_hours: number;
}

/**
 * DTO for updating an existing Career Profile
 */
export interface UpdateCareerProfileDto {
  target_career?: string;
  experience_level?: ExperienceLevel;
  skills?: string[];
  learning_preferences?: LearningPreference[];
  weekly_availability_hours?: number;
}
