# Job schema

## `jobs`

Stores the searchable fields for a job posting:

- `id`: UUID primary key
- `title`: job title
- `description`: full job description
- `category`: normalized job category used for filtering
- `created_at`, `updated_at`: audit timestamps

## `job_required_skills`

Stores one required skill per row and links it to `jobs.id`:

- `job_id`: owning job
- `skill`: canonical skill name, stored trimmed and lowercase

The composite primary key prevents duplicate skills for a job. The skill index supports queries such as “find all jobs requiring TypeScript” and leaves matching logic free to compare these values with Career Profile skills.
