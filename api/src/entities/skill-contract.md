# Shared Skill Contract

Every subsystem (Career Profile, Resume, Jobs, Portfolio) represents and
compares skills the same way. Code: `api/src/utils/skills.ts`.

## The shape

```ts
interface Skill {
  name: string; // display name, e.g. "JavaScript"
  key: string; // comparison key, e.g. "javascript"
}
```

**Compare skills by `key`, never by `name`.** Two skills are the same skill if
and only if their keys are equal.

## Normalization rules

`normalizeSkill(input)` and `normalizeSkills(inputs)`:

1. Trim, and collapse runs of whitespace to one space.
2. Empty or whitespace-only input returns `null` (`normalizeSkills` drops it).
3. If the lowercase input is a known alias, use the canonical display name (`js`
   → `JavaScript`, `nodejs` → `Node.js`, `postgres` → `PostgreSQL`). The alias
   table is `CANONICAL_SKILLS` in `skills.ts`; add entries there.
4. Otherwise keep the caller's spelling as the display name.
5. `key` is `name.toLowerCase()`. Punctuation is kept (`c++`, `c#`, `node.js`).
6. `normalizeSkills` removes duplicates by key, keeping the first-seen spelling
   and order.
7. Normalizing is idempotent: normalizing already-normalized names changes
   nothing.

**Length limits are not part of normalization.** Each caller validates its own
limit before or after normalizing (Career Profile: 50 characters, 30 skills; the
`job_required_skills` column: 100 characters).

## How each subsystem stores and consumes skills

Storage formats do not change. Skills are stored as plain strings and turned
into `Skill` objects at the point of use.

| Subsystem      | Stored as                                        | Normalize with                                          |
| -------------- | ------------------------------------------------ | ------------------------------------------------------- |
| Career Profile | `career_profiles.skills` (text[], display names) | `normalizeSkills` on save (done in C40CS-6)             |
| Resume         | `resume_skills.skills` (text[], display names)   | `normalizeSkills` on extracted candidates (C40CS-12)    |
| Jobs           | `job_required_skills.skill` (lowercase)          | `normalizeSkill(name)` then compare by `key` (C40CS-17) |
| Portfolio      | `projects.skills_demonstrated` (text[])          | `normalizeSkills` on create/update (C40CS-23)           |

Jobs already store the lowercase form. A job skill stored as `nodejs` is
compared through `normalizeSkill`, so its key becomes `node.js` and it matches a
user's `Node.js`.

## Using it from Supabase Edge Functions

`skills.ts` has no imports, so it runs unchanged under Deno. Edge Functions
import it by relative path with the `.ts` extension. The Deno import path and CI
check are set up in C40CS-10 and C40CS-11.

## Skill gaps and comparison (C40CS-7)

Code: `api/src/utils/skills.ts`. This is the single comparison used across
subsystems (Job Matching, and later the roadmap) — do not re-implement it.

```ts
type SkillSource = "profile" | "resume" | "project";

interface SourcedSkill extends Skill {
  source: SkillSource;
}

interface SkillGap<T extends Skill = Skill> {
  matched: Skill[]; // required skills the user has, in requiredSkills order
  missing: Skill[]; // required skills the user lacks, in requiredSkills order
  known: T[]; // the user's own skills, deduped by key
}
```

`compareSkills(userSkills, requiredSkills)`:

- Both arguments must already be normalized `Skill`s (via
  `normalizeSkill`/`normalizeSkills`) — it compares by `key`, it does not
  normalize strings itself.
- Pure and deterministic: the same input always returns the same output and
  order. `matched`/`missing` follow `requiredSkills`' order; `known` follows
  `userSkills`' order.
- Empty `userSkills` → everything in `requiredSkills` is `missing`. Empty
  `requiredSkills` → nothing is `missing`. Neither case errors.

`mergeSkillSources(sources)` merges a user's skills from profile/resume/project
into one deduped `SourcedSkill[]`, keeping each skill's `source` (first source
it's seen from wins on a duplicate key). Feed the result straight into
`compareSkills` as `userSkills`.

**Not in scope:** AI roadmap generation.
