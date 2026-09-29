# Deploying Edge Functions

Every merge to `main` that touches `supabase/**` deploys all Edge Functions to Supabase through `.github/workflows/deploy-functions.yml` (C40CS-15). It can also be run by hand from the **Actions** tab with **Run workflow**.

## What the workflow does

1. Installs the Supabase CLI (pinned to 2.117.0).
2. Fails right away if a deploy secret is missing.
3. Runs `supabase functions deploy --use-api`, which bundles every function under `supabase/functions/` (folders starting with `_` are not deployed on their own) without Docker.
4. Lists the deployed functions.
5. Writes the build version to the run summary: `build-<run number>-<short commit>`, e.g. `build-12-a81fc20`.

A failed deploy fails the workflow run.

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
- Nothing secret goes in the repo, `.env.example` files, or workflow logs.

## Database migrations

Not automated yet. Migrations live in `api/src/database/migrations/`. After a PR that adds one merges, run the new `.sql` file once in the Supabase dashboard (**SQL Editor**). Moving them to `supabase/migrations/` so the workflow can run `supabase db push` is follow-up work.

## Deploying by hand

From the repo root, with a token in the environment:

```
$env:SUPABASE_ACCESS_TOKEN = "<token>"   # PowerShell
npx supabase functions deploy --project-ref <ref> --use-api
```
