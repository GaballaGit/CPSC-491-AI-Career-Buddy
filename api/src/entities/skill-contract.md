# Shared Skill Contract

Every subsystem (Career Profile, Resume, Jobs, Portfolio) represents and compares skills the same way. Code: `api/src/utils/skills.ts`.

## The shape

```ts
interface Skill {
  name: string; // display name, e.g. "JavaScript"
  key: string; // comparison key, e.g. "javascript"
}
```

**Compare skills by `key`, never by `name`.** Two skills are the same skill if and only if their keys are equal.

## Normalization rules

`normalizeSkill(input)` and `normalizeSkills(inputs)`:

1. Trim, and collapse runs of whitespace to one space.
2. Empty or whitespace-only input returns `null` (`normalizeSkills` drops it).
3. If the lowercase input is a known alias, use the canonical display name (`js` → `JavaScript`, `nodejs` → `Node.js`, `postgres` → `PostgreSQL`). The alias table is `CANONICAL_SKILLS` in `skills.ts`; add entries there.
4. Otherwise keep the caller's spelling as the display name.
5. `key` is `name.toLowerCase()`. Punctuation is kept (`c++`, `c#`, `node.js`).
6. `normalizeSkills` removes duplicates by key, keeping the first-seen spelling and order.
7. Normalizing is idempotent: normalizing already-normalized names changes nothing.

**Length limits are not part of normalization.** Each caller validates its own limit before or after normalizing (Career Profile: 50 characters, 30 skills; the `job_required_skills` column: 100 characters).

## How each subsystem stores and consumes skills

Storage formats do not change. Skills are stored as plain strings and turned into `Skill` objects at the point of use.

| Subsystem      | Stored as                                        | Normalize with                                          |
| -------------- | ------------------------------------------------ | ------------------------------------------------------- |
| Career Profile | `career_profiles.skills` (text[], display names) | `normalizeSkills` on save (done in C40CS-6)             |
| Resume         | resume-derived skills (C40CS-12)                 | `normalizeSkills` on extracted candidates               |
| Jobs           | `job_required_skills.skill` (lowercase)          | `normalizeSkill(name)` then compare by `key` (C40CS-17) |
| Portfolio      | `projects.skills_demonstrated` (text[])          | `normalizeSkills` on create/update (C40CS-23)           |

Jobs already store the lowercase form. A job skill stored as `nodejs` is compared through `normalizeSkill`, so its key becomes `node.js` and it matches a user's `Node.js`.

## Using it from Supabase Edge Functions

`skills.ts` has no imports, so it runs unchanged under Deno. Edge Functions import it by relative path with the `.ts` extension. The Deno import path and CI check are set up in C40CS-10 and C40CS-11.

## Not covered here

`SkillGap` (matched / missing / known) and `compareSkills` are defined in C40CS-7 and build on this contract.
