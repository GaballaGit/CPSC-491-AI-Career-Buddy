# Deploying to Supabase

Every merge to `main` that touches `supabase/**` applies new database
migrations and then deploys all Edge Functions to Supabase through
`.github/workflows/deploy-functions.yml` (C40CS-15, C40CS-35). It can also be
run by hand from the **Actions** tab with **Run workflow**.

## What the workflow does

1. Installs the Supabase CLI (pinned to 2.117.0).
2. Fails right away if a deploy secret is missing.
3. Links the project and applies database migrations (see
   [Database migrations](#database-migrations)): a `--dry-run` preview first,
   then `supabase db push`, then `supabase migration list` for the log.
4. Runs `supabase functions deploy --use-api`, which bundles every function
   under `supabase/functions/` (folders starting with `_` are not deployed on
   their own) without Docker.
5. Runs post-deployment health checks against the deployed Resume, Jobs, Profile, and Projects Edge Functions.
6. Lists the deployed functions.
7. Writes the build version and Edge Function health-check results to the run summary:
   `build-<run number>-<short commit>`, e.g. `build-12-a81fc20`.

Migrations run before functions are deployed, so a function never goes live
before the tables it uses. A failed migration, deploy, or post-deployment
health check fails the workflow run, and nothing after the failed step runs.

## Post-deployment health verification

After all Supabase Edge Functions are deployed, the workflow performs read-only
smoke checks against every deployed application function.

The following public health endpoints are checked:

| Function | Endpoint | Verification |
| -------- | -------- | ------------ |
| Resume | `GET /resume/health` | Confirms the deployed Resume function is reachable and identifies itself as `resume`. |
| Jobs | `GET /jobs/health` | Confirms the deployed Jobs function is reachable and identifies itself as `jobs`. |
| Profile | `GET /profile/health` | Confirms the deployed Profile function is reachable and identifies itself as `profile`. |
| Projects | `GET /projects/health` | Confirms the deployed Projects function is reachable and identifies itself as `projects`. |

The deployed endpoints follow this form:

```text
https://<project-ref>.supabase.co/functions/v1/<function>/health
```

Each successful endpoint returns only public health information:

```json
{
  "data": {
    "status": "ok",
    "service": "<function-name>"
  }
}
```

The health endpoints do not require user authentication and do not expose
credentials, environment variables, access tokens, user information, or
internal configuration.

### What each check verifies

Each smoke check verifies that:

- the deployed Edge Function is reachable over HTTPS;
- the request returns a successful HTTP response;
- the response contains `"status":"ok"`;
- the response contains the expected function name in `"service"`;
- no authenticated user credentials are required.

These checks are intentionally read-only. They verify deployment availability
without creating, updating, or deleting application data.

### Retry behavior

Each Edge Function health request is attempted up to five times.

Each request:

- has a 15-second timeout;
- must return a successful HTTP response;
- must contain `"status":"ok"`;
- must contain the expected `"service"` value.

If a request fails, the workflow waits five seconds before trying that function
again.

The workflow continues checking the remaining functions so that all failures
can be identified in the same run.

If any function fails all retry attempts:

- the workflow logs a GitHub Actions error naming that function;
- the failed function is listed in the workflow summary;
- the deployment workflow exits with a failure status.

## One-time setup

GitHub → **Settings → Secrets and variables → Actions → New repository secret**.
Add three secrets:

| Secret                  | Value                                                                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `SUPABASE_ACCESS_TOKEN` | A Supabase access token with **Edge Functions: Read-write**, **Project Settings: Read**, and **API Keys: Read** (needed by `supabase link`), scoped to the `career lm` project |
| `SUPABASE_PROJECT_REF`  | The project ref, the subdomain in the project URL (`<ref>.supabase.co`)                                                                                                        |
| `SUPABASE_DB_PASSWORD`  | The database password, from Supabase → **Database → Settings**. It can only be reset, not viewed, so reset it if nobody has it                                                 |

Access tokens expire. When the deploy fails with an auth error, generate a new
token and replace the secret.

## Secrets rules

- Deploy credentials live only in GitHub repository secrets. Moving them to a protected `production` environment needs a repo admin and is follow-up work.
- Runtime secrets for functions (e.g. an AI API key) are set in Supabase, not GitHub: `supabase secrets set NAME=value --project-ref <ref>`.
- AI feedback (C40CS-14) reads `LLM_API_KEY`, `LLM_BASE_URL`, and `LLM_MODEL` from Supabase secrets. Any OpenAI-compatible provider works; we use NRP Managed LLMs (`https://ellm.nrp-nautilus.io/v1`, model `gpt-oss`). Without them, `POST /resume/feedback` returns `503 AI_NOT_CONFIGURED`.
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` are provided to functions by Supabase automatically.
- Nothing secret goes in the repo, `.env.example` files, workflow logs, or health endpoint responses.

## Database migrations

Automated since C40CS-35. Migrations live in `supabase/migrations/` and are
applied by the deploy workflow with `supabase db push`. Do not create or change
tables by hand in the dashboard SQL Editor; add a migration instead.

### Adding a migration

1. Create a file named `<timestamp>_<description>.sql`, for example
   `20261020120000_add_resume_feedback.sql`. Running
   `npx supabase migration new add_resume_feedback` creates one with the right
   timestamp.
2. Write SQL that is safe to run more than once where possible
   (`CREATE TABLE IF NOT EXISTS`, `DROP POLICY IF EXISTS` before
   `CREATE POLICY`), and enable row level security on every new table.
3. Open a PR. `.github/workflows/migrations-check.yml` applies every migration
   to a fresh database, and the PR check fails if any migration has an error.
4. After it merges, the deploy workflow applies only migrations the shared
   database has not seen yet. Supabase records applied versions in
   `supabase_migrations.schema_migrations`.

### Testing locally

With Docker running, from the repo root:

```bash
npx supabase db start
npx supabase db reset --local --no-seed
```

This is the same check the PR runs.

### If a migration fails

- **On the PR:** the check is red and nothing reaches the shared database. Fix
  the file and push again.
- **On merge:** the deploy workflow stops at **Apply migrations**, so Edge
  Functions are not deployed. Fix it in a new PR.
- **To undo a migration that already ran:** add a new migration that reverses
  it (for example, drop the column it added). There are no automatic down
  migrations.

### Baseline

The four starting migrations (`20261012000001` to `20261012000004`) are exact
copies of `api/src/database/migrations/001` to `004`, which were applied by
hand before automation. They only use `IF NOT EXISTS` / `DROP ... IF EXISTS`
statements, so the first automated run re-applies them without changing
existing tables or data and records them as applied.

The copies in `api/src/database/migrations/` are deprecated. They stay only for
the Express API and its tests until Express is retired.
`supabase/migrations/` is the source of truth for the shared database.

### Never edit an applied migration

Once a migration has run, change the schema with a new migration. Editing an
old file does nothing on the shared database, because its version is already
recorded as applied.

## Frontend deployment verification

C40CS-26 also requires post-deployment verification of the Cloudflare-hosted frontend.

The repository deploys the frontend through `.github/workflows/frontend-cd.yml`,
but that workflow does not yet perform a post-deployment smoke check. A future
check should verify the deployed frontend URL and fail the deployment workflow
if the site is unavailable.

The Supabase Resume health verification can operate independently of that future frontend check.

## Deploying by hand

From the repo root, with a token in the environment:

```powershell
$env:SUPABASE_ACCESS_TOKEN = "<token>"
npx supabase functions deploy --project-ref <ref> --use-api
```

## Frontend (Cloudflare Workers)

The Next.js frontend is deployed with OpenNext for Cloudflare Workers. Pull
requests run lint and build through `.github/workflows/frontend-ci.yml`; merges
to `main` deploy through `.github/workflows/frontend-cd.yml` when frontend files
change.

### One-time setup

Create a GitHub `production` environment with these secrets:

| Secret                  | Value                                                  |
| ----------------------- | ------------------------------------------------------ |
| `CLOUDFLARE_API_TOKEN`  | Cloudflare API token with permission to deploy Workers |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID                                  |

Add these environment variables to `production`:

| Variable                        | Value                    |
| ------------------------------- | ------------------------ |
| `NEXT_PUBLIC_API_URL`           | Deployed API base URL    |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |

The frontend worker URL is
`https://career-buddy-site.<account-subdomain>.workers.dev` unless a custom
domain is configured in Cloudflare. No service-role, AI, or other private keys
belong in frontend variables.
