# Career Profile Schema & Integration Specification

**Subsystem:** Member 1 — Career Profile
**Author:** Jim Alvarez
**Sprint:** Sprint 1
**Entity:** `CareerProfile` (`career_profiles` table)
**Status:** Active

---

## 1. Overview & Purpose

The `CareerProfile` model captures a user's target career, experience level, skills, learning preferences, and weekly availability — collected once during onboarding (KAN-2) and persisted so other subsystems can read it without re-asking the user:

- **Resume Intelligence** — compares extracted resume skills against `skills` and `target_career` to surface gaps.
- **Job Intelligence** — matches job listings against `target_career` and `skills`.
- **Portfolio & Career Readiness** — combines `skills` with `projects.skills_demonstrated` to compute skill-gap coverage in the Career Readiness Score.
- **Roadmap** — uses `experience_level`, `learning_preferences`, and `weekly_availability_hours` to pace generated learning plans.

Each user has **at most one** Career Profile (one-to-one), unlike `projects`, which is one-to-many.

---

## 2. Database Schema (PostgreSQL / Supabase)

### 2.1 Table Definition: `career_profiles`

| Column | Data Type | Constraints / Default | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique career profile identifier |
| `user_id` | `UUID` | `NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE` | Foreign key referencing the authenticated Supabase user; `UNIQUE` enforces one profile per user |
| `target_career` | `VARCHAR(100)` | `NOT NULL CHECK (char_length(target_career) BETWEEN 1 AND 100)` | Career the user is targeting (e.g. "Frontend Engineer") |
| `experience_level` | `VARCHAR(20)` | `NOT NULL CHECK (experience_level IN ('beginner', 'intermediate', 'advanced'))` | Self-reported current experience level |
| `skills` | `TEXT[]` | `NOT NULL DEFAULT '{}'` | Normalized skill tags the user already has (e.g. `['TypeScript', 'SQL']`) |
| `learning_preferences` | `TEXT[]` | `NOT NULL DEFAULT '{}'` | One or more of `videos`, `reading`, `hands_on_projects`, `mentorship`, `structured_courses` |
| `weekly_availability_hours` | `SMALLINT` | `NOT NULL CHECK (weekly_availability_hours BETWEEN 1 AND 168)` | Hours per week the user can dedicate to upskilling |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Record last update timestamp |

### 2.2 Performance Indexes
* `idx_career_profiles_user_id`: optimizes lookups for `WHERE user_id = $1`, and joins from other subsystems (Resume, Job, Portfolio) keying off the same `user_id`.

### 2.3 Multi-Tenant Isolation & Row Level Security (RLS)
* Supabase RLS is enabled on `career_profiles`.
* All operations (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) enforce `auth.uid() = user_id`.
* The Express application layer reinforces this constraint by binding `req.user.id` to every database query (see `careerProfileRepository` in KAN-4/KAN-5).

---

## 3. Relationship to the Onboarding Questionnaire (KAN-2)

Every field on this entity maps 1:1 to `OnboardingFormData`
(`site/career-buddy-site/app/onboarding/types.ts`):

| Onboarding form field | `career_profiles` column |
| :--- | :--- |
| `targetCareer` | `target_career` |
| `experienceLevel` | `experience_level` |
| `skills` | `skills` |
| `learningPreferences` | `learning_preferences` |
| `weeklyAvailabilityHours` | `weekly_availability_hours` |

The API uses the snake_case column names (matching `CreateCareerProfileDto` and the projects API), so the frontend maps its camelCase form fields to them when submitting.

### 3.1 `POST /api/career-profile` (KAN-4)

Requires an authenticated session. Creates the current user's Career Profile, or replaces it if one already exists (one profile per user).

Request body:

```json
{
  "target_career": "Frontend Engineer",
  "experience_level": "intermediate",
  "skills": ["TypeScript", "React"],
  "learning_preferences": ["hands_on_projects", "reading"],
  "weekly_availability_hours": 10
}
```

| Status | When | Body |
| :--- | :--- | :--- |
| `201` | Saved | `{ success: true, data: CareerProfile, meta: { timestamp } }` |
| `400` | Invalid payload | `{ success: false, error: { code: "VALIDATION_ERROR", message, details: [{ field, message }] } }` — one `details` entry per invalid field |
| `401` | Not signed in | `{ success: false, error: { code: "AUTHENTICATION_REQUIRED", message } }` |

Validation mirrors the table constraints: `target_career` 1–100 characters, `experience_level` and each `learning_preferences` item from the allowed values, `skills` and `learning_preferences` non-empty, `weekly_availability_hours` a whole number from 1 to 168.

---

## 4. TypeScript Contracts

```typescript
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export type LearningPreference =
  | 'videos'
  | 'reading'
  | 'hands_on_projects'
  | 'mentorship'
  | 'structured_courses';

// Core Entity
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

// Creation DTO
export interface CreateCareerProfileDto {
  target_career: string;
  experience_level: ExperienceLevel;
  skills: string[];
  learning_preferences: LearningPreference[];
  weekly_availability_hours: number;
}

// Update DTO
export interface UpdateCareerProfileDto {
  target_career?: string;
  experience_level?: ExperienceLevel;
  skills?: string[];
  learning_preferences?: LearningPreference[];
  weekly_availability_hours?: number;
}
```
