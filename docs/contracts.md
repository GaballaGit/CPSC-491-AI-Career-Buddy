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

Both backends verify user tokens against Supabase Auth. Private operations require a valid user; jobs permit anonymous access without personal match data:

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
// api/src/utils/skills.ts
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

Both `api/src/services/jobMatching.ts` and the Edge jobs matcher normalize their
inputs and use `compareSkills` for matched/missing results. Scoring remains in
the matchers: a rounded percentage, or 100 when there are no required skills.

## Career Profile skill data

**Owner:** Jim Alvarez.

Stored as plain display-name strings, normalized with `normalizeSkills` on save (`POST /profile` Edge Function since C40CS-32; the legacy `POST /api/career-profile` Express route behaves the same):

```ts
// career_profiles.skills: text[]
interface CareerProfile {
  skills: string[]; // e.g. ["TypeScript", "SQL"]
  // ...target_career, experience_level, learning_preferences, weekly_availability_hours
}
```

Source: `supabase/functions/_shared/profile/` (validation and repository), `api/src/entities/careerProfile.ts`, `api/src/entities/career-profile-schema.md`.

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

**Status:** Both the Express jobs routes and the jobs Edge Function return match data for signed-in users with a Career Profile. Route matching currently uses profile skills only; the Express matching service also supports optional resume skills for direct callers.

## Portfolio skill evidence

**Owner:** Daniel Lee (C40CS-23, implemented).

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

Project create/read/update routes currently return `{ data }`, not the common
success envelope below; deletes return an empty 204. Project not-found errors
use `PROJECT_NOT_FOUND`. The frontend project client requires `success: true`,
an existing integration mismatch that must be addressed separately from a
behavior-preserving refactor.

## Common API/function response and error envelope

**Owner:** Platform / Shared. Common shape used by Edge Functions (`supabase/functions/_shared/http.ts`) and described by Express types (`api/src/types/response.ts`, `error.ts`). Some Express routes, including projects as noted above, do not use this success envelope.

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
