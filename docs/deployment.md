# Deploying Edge Functions

Every merge to `main` that touches `supabase/**` deploys all Edge Functions to Supabase through `.github/workflows/deploy-functions.yml` (C40CS-15). It can also be run by hand from the **Actions** tab with **Run workflow**.

## What the workflow does

1. Installs the Supabase CLI (pinned to 2.117.0).
2. Fails right away if a deploy secret is missing.
3. Runs `supabase functions deploy --use-api`, which bundles every function under `supabase/functions/` (folders starting with `_` are not deployed on their own) without Docker.
4. Runs a post-deployment health check against the deployed Resume Edge Function.
5. Lists the deployed functions.
6. Writes the build version and health-check result to the run summary: `build-<run number>-<short commit>`, e.g. `build-12-a81fc20`.

A failed deploy or failed post-deployment health check fails the workflow run.

## Post-deployment health verification

C40CS-26 adds an automated smoke check after the Supabase Edge Functions deployment completes.

The Resume Edge Function exposes:

```
GET /resume/health
```

The deployed endpoint follows this form:

```
https://<project-ref>.supabase.co/functions/v1/resume/health
```

A successful response contains only public health information:

```json
{
  "data": {
    "status": "ok",
    "service": "resume"
  }
}
```

The health endpoint does not require user authentication and does not expose credentials, environment variables, access tokens, or internal configuration.

### Retry behavior

The deployment workflow attempts the health request up to five times.

Each request:

- must return a successful HTTP response,
- has a 15-second timeout,
- must contain `"status":"ok"`,
- must contain `"service":"resume"`.

If a request fails, the workflow waits five seconds before trying again.

If all attempts fail, the workflow exits with an error and the GitHub Actions deployment run fails.

## One-time setup

GitHub → **Settings → Secrets and variables → Actions → New repository secret**. Add two secrets:

| Secret                  | Value                                                                                                                         |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `SUPABASE_ACCESS_TOKEN` | A Supabase access token with **Edge Functions: Read-write** and **Project Settings: Read**, scoped to the `career lm` project |
| `SUPABASE_PROJECT_REF`  | The project ref, the subdomain in the project URL (`<ref>.supabase.co`)                                                       |

Access tokens expire. When the deploy fails with an auth error, generate a new token and replace the secret.

## Secrets rules

- Deploy credentials live only in GitHub repository secrets. Moving them to a protected `production` environment needs a repo admin and is follow-up work.
- Runtime secrets for functions (e.g. an AI API key) are set in Supabase, not GitHub: `supabase secrets set NAME=value --project-ref <ref>`.
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` are provided to functions by Supabase automatically.
- Nothing secret goes in the repo, `.env.example` files, workflow logs, or health endpoint responses.

## Database migrations

Not automated yet. Migrations live in `api/src/database/migrations/`. After a PR that adds one merges, run the new `.sql` file once in the Supabase dashboard (**SQL Editor**). Moving them to `supabase/migrations/` so the workflow can run `supabase db push` is follow-up work.

## Frontend deployment verification

C40CS-26 also requires post-deployment verification of the Cloudflare-hosted frontend.

The repository currently does not contain a Cloudflare frontend deployment workflow or configured deployed frontend URL.

The frontend smoke check will be added when that deployment is available. It should verify that the deployed frontend responds successfully and fail the deployment workflow if the site is unavailable.

The Supabase Resume health verification can operate independently of that future frontend check.

## Deploying by hand

From the repo root, with a token in the environment:

```powershell
$env:SUPABASE_ACCESS_TOKEN = "<token>"
npx supabase functions deploy --project-ref <ref> --use-api
```
