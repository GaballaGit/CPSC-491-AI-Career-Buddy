# Demo jobs dataset

`supabase/seed.sql` contains nine curated roles compatible with the existing jobs Edge Function and UI. No schema or frontend changes are required. The Supabase configuration already points to this seed file.

## Contents and provenance

- Six fictional roles, visibly marked `[Demo]`: frontend, backend, full stack, data analysis, QA, and cloud infrastructure.
- Three real Figma internship snapshots, visibly marked `[Snapshot]`: data engineering, product design, and software engineering.
- Real postings were retrieved on 2026-11-20 from Figma's public Greenhouse feed: https://boards-api.greenhouse.io/v1/boards/figma/jobs?content=true . Individual source URLs appear in each description.
- Descriptions are short editorial summaries, not verbatim postings. Skill tags simplify employer criteria for this application's exact-name skill comparison. They are not authoritative eligibility requirements. In particular, alternative languages and design competencies must not be interpreted as universally mandatory.
- Snapshot availability is not checked at runtime. Check source pages before presenting them as currently open; this dataset does not claim employer affiliation.

## Load

Apply the repository's database migrations first. For an existing **demo** Supabase project, run `supabase/seed.sql` in the Supabase SQL Editor. This executes a transaction and upserts only nine reserved UUIDs; it does not remove other jobs or touch user data. Rerunning replaces the seeded roles' descriptions and skill tags without duplicating rows.

For a disposable local database, `supabase db reset` from the repository root applies migrations and seeds automatically. **Reset destroys local database data**; do not use reset on a database you need to preserve.

This is seed data, not a migration: `supabase db push` alone does not populate an existing hosted database. No hosted database is modified merely by adding these files.

After loading, open the job listings. Existing environments with many other jobs may paginate these roles out of the first page; use a dedicated demo database rather than deleting unrelated records.

## Suggested presentation

1. Browse signed out: show fictional labels and real-source snapshot descriptions.
2. Create a frontend-oriented profile with skills `React`, `TypeScript`, `CSS`, `Git`.
3. Junior Frontend Developer should show **80%**, with `accessibility` missing.
4. QA Automation Engineer should show **40%**, with `playwright`, `testing`, and `ci/cd` missing.
5. Add `Accessibility` to the profile and revisit the frontend role: **100%**.
6. For a second story, use `Python`, `SQL`: Junior Data Analyst and the Figma data internship both show **50%**, exposing different learning gaps.
7. Show the cloud role as a stretch opportunity, not a recommendation that the user is already qualified.

Scores are required-skill coverage, not hiring probabilities. Current matching uses profile skills only: target career, experience, learning preferences, and weekly availability do not affect ranking. Seniority in these descriptions is informational. Adding career/experience-aware ranking is separate work.

## Verification

The migrations CI workflow loads the seed twice and runs `supabase/tests/demo_jobs_seed_test.sql` after each load. Assertions cover the nine reserved roles, 44 skill relationships, visible demo/snapshot labels, source attribution, and the frontend skill-gap example.

Local verification passed using an isolated PGlite PostgreSQL runtime: both seed executions passed the SQL assertions and preserved an unrelated role and skill. The jobs migration was applied with only the `pgcrypto` extension declaration omitted because PGlite lacks that extension (its built-in `gen_random_uuid` is available). The three existing Deno job-matching tests also passed. Full Supabase migration execution is covered by CI, not this local substitute. Hosted loading and browser verification remain manual steps.

After loading in SQL Editor:

```sql
select j.title, count(s.skill) as skill_count
from public.jobs j
join public.job_required_skills s on s.job_id = j.id
where j.id between 'd3e00000-0000-4000-8000-000000000001'::uuid
               and 'd3e00000-0000-4000-8000-000000000009'::uuid
group by j.id, j.title
order by j.title;
```

Expect nine rows with 4–6 skills per role. Rerun the seed and query to confirm counts remain unchanged.
