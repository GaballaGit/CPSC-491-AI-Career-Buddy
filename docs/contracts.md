# Cross-Subsystem Data Contracts

The types and shapes every subsystem agrees on. Each section names the owning subsystem and links to the code that's the source of truth — this doc describes it, it doesn't redefine it. Update this doc when a contract changes; it should always match what's actually implemented by the end of the sprint.

## Authenticated user identity

**Owner:** Platform / Shared (Supabase Auth migration, C40CS-16).

The frontend signs in via Supabase Auth (`site/career-buddy-site/lib/supabase.ts`) and attaches the session's access token as a Bearer header on every API call:

```ts
// site/career-buddy-site/lib/auth.ts
async function authHeaders(): Promise<Record<string, string>> {
  return { Authorization: `Bearer ${await getAccessToken()}` };
}
```

Both backends turn that token into the current user the same way — verify it against Supabase Auth, 401 if it's missing or invalid:

- **Express** (`api/src/middleware/authentication.ts`): `requireAuthentication` reads the header, calls `getUserFromAccessToken` (`api/src/auth/supabase.ts`), and sets `req.user: { id, email, name? }`. Tests set `process.env.SUPABASE_AUTH_TEST_USERS` instead of hitting real Supabase.
- **Edge Functions** (`supabase/functions/_shared/auth.ts`): `authenticate(req)` returns `{ userId, db } | null`, where `db` is a Supabase client scoped to that user's JWT so Postgres Row Level Security applies automatically.

Every skill-bearing table (`career_profiles`, `resume_skills`, `projects`) is scoped by `user_id UUID REFERENCES auth.users(id)`, with RLS policies keyed on `auth.uid() = user_id`.

## Skill representation

**Owner:** Jim Alvarez (shared skill contract, C40CS-6; skill-gap comparison, C40CS-7).

Every subsystem represents and compares skills the same way. Full contract: `api/src/entities/skill-contract.md`. Summary:

```ts
// api/src/utils/skills.ts
interface Skill {
  name: string; // display name, e.g. "JavaScript"
  key: string; // comparison key, e.g. "javascript" — compare by this, never by name
}

function normalizeSkill(input: string): Skill | null;
function normalizeSkills(inputs: readonly string[]): Skill[]; // dedupes by key
```

```ts
// api/src/utils/skillGap.ts (C40CS-7, PR #52)
type SkillSource = "profile" | "resume" | "project";
interface SourcedSkill extends Skill {
  source: SkillSource;
}
interface SkillGap<T extends Skill = Skill> {
  matched: Skill[]; // required skills the user has
  missing: Skill[]; // required skills the user lacks
  known: T[]; // the user's own skills, deduped
}

function compareSkills<T extends Skill>(
  userSkills: readonly T[],
  requiredSkills: readonly Skill[],
): SkillGap<T>;
function mergeSkillSources(
  sources: readonly { source: SkillSource; skills: readonly Skill[] }[],
): SourcedSkill[];
```

`compareSkills` is meant to be the single comparison used everywhere a "known vs. required" skill gap is needed (Job Matching now; the roadmap later) — subsystems should not reimplement matched/missing logic themselves.

**Known gap:** `api/src/services/jobMatching.ts` (`computeJobSkillMatch`, C40CS-17) currently computes matched/missing/score with its own inline logic, predating `compareSkills`. It's functionally equivalent but is a duplicate implementation. Worth switching over to `compareSkills` once C40CS-7 merges — flagged here, not changed by this doc (Job Matching is Mark's subsystem).

## Career Profile skill data

**Owner:** Jim Alvarez.

Stored as plain display-name strings, normalized with `normalizeSkills` on save (`POST /api/career-profile`):

```ts
// career_profiles.skills: text[]
interface CareerProfile {
  skills: string[]; // e.g. ["TypeScript", "SQL"]
  // ...target_career, experience_level, learning_preferences, weekly_availability_hours
}
```

Source: `api/src/entities/careerProfile.ts`, `api/src/entities/career-profile-schema.md`.

## Resume-derived skills

**Owner:** William Wang (C40CS-11, C40CS-12).

One row per user; each new resume upload replaces the previous row. Skills are extracted from the resume text (`supabase/functions/_shared/resume/skills.ts`) and normalized through the shared contract before being stored:

```sql
-- resume_skills (api/src/database/migrations/004_create_resume_skills.sql)
user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
filename   VARCHAR(255) NOT NULL,
skills     TEXT[] NOT NULL DEFAULT '{}',  -- display names, same shape as career_profiles.skills
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

Exposed via the `resume` Edge Function: `POST /resume` (upload) and `GET /resume/skills` (saved skills), both requiring auth.

## Job required skills and the match response

**Owner:** Mark Gaballa (C40CS-17, C40CS-18).

```ts
// api/src/entities/job.ts
interface RequiredSkill {
  name: string;
}
interface Job {
  id: string;
  title: string;
  description: string;
  category: string;
  required_skills: RequiredSkill[];
  created_at: string;
  updated_at: string;
}
```

```ts
// api/src/services/jobMatching.ts
interface JobSkillMatch {
  matched: Skill[];
  missing: Skill[];
  score: number; // percentage of required skills matched; 100 if a job has none
}

function computeJobSkillMatch(input: {
  requiredSkills: readonly RequiredSkill[];
  profileSkills?: readonly string[];
  resumeSkills?: readonly string[];
}): JobSkillMatch;
```

**Status:** `computeJobSkillMatch` exists and is unit-tested but isn't wired into a route yet — no endpoint currently returns a match response (that's C40CS-18, "Display match info").

## Portfolio skill evidence

**Owner:** Daniel Lee (C40CS-23, PR #49 as of writing — not yet merged).

```ts
// projects.skills_demonstrated: text[], normalized with normalizeSkills on create/update
interface Project {
  skills_demonstrated: string[]; // e.g. ["TypeScript", "Next.js", "PostgreSQL"]
  status: "in_progress" | "completed";
  // ...
}
```

```ts
// api/src/services/projectSkillEvidence.ts
function getCompletedProjectSkills(projects: readonly Project[]): Skill[];
```

Only `completed` projects count as skill evidence. When merged with profile/resume skills via `mergeSkillSources`, these use `source: "project"`.

## Common API/function response and error envelope

**Owner:** Platform / Shared. Identical shape on both backends — Express (`api/src/types/response.ts`, `error.ts`) and Edge Functions (`supabase/functions/_shared/http.ts`).

```ts
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta: { timestamp: string; pagination?: PaginationMeta };
}

interface ApiErrorResponse {
  success: false;
  error: {
    code: ApiErrorCode; // e.g. "VALIDATION_ERROR", "AUTHENTICATION_REQUIRED", "RESOURCE_NOT_FOUND"
    message: string;
    details?: { field: string; message: string }[];
  };
}
```

Edge Functions build these with the `ok(data)` / `fail(error)` helpers in `supabase/functions/_shared/http.ts`; Express controllers build them directly against `api/src/types/response.ts` and `error.ts`.
