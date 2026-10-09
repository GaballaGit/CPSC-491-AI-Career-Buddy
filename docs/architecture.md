# CareerLM Architecture

CareerLM has a Next.js frontend and two backend runtimes. See
[contracts.md](contracts.md) for data shapes, [database.md](database.md) for
Supabase setup, and [deployment.md](deployment.md) for deployment.

## Runtime boundaries

| Layer | Location | Responsibility |
| --- | --- | --- |
| Frontend | `site/career-buddy-site/` | Next.js App Router pages, local form state, UI components, and backend clients in `lib/` |
| Express API | `api/` | Career Profile and portfolio endpoints, auth endpoints, and legacy jobs/resume endpoints |
| Edge Functions | `supabase/functions/` | Jobs, resume extraction and skills, AI feedback, and resume health endpoint |
| Persistence | `api/src/database/`, Edge `_shared/*/repository.ts` | Supabase queries; Express jobs are an in-memory seeded fallback |
| Infrastructure | `infra/` | Terraform provider configuration for Cloudflare and Supabase; no application resources currently defined |

Frontend deployment uses OpenNext on Cloudflare Workers. Edge Functions deploy
separately to Supabase. The repository does not deploy an Express server in
these workflows; profile and portfolio features still require one.

## Request flow

- `api/src/index.ts` seeds the in-memory job repository and starts `app.ts`.
  `app.ts` registers `/`, `/health`, the `/api` router, and error middleware.
- Express routes authenticate before controllers validate input and call
  repositories or services. Project controllers preserve their own response
  shapes; not every route uses the common success envelope.
- Edge `index.ts` files start Deno servers. Each `handler.ts` composes injected
  authentication/store dependencies so tests can call handlers with plain
  requests. `_shared/http.ts` owns CORS and response envelopes.
- Resume upload validates a file, extracts text and normalized skills, and
  replaces the user's saved resume skills. AI feedback calls an
  OpenAI-compatible provider with runtime-only credentials.

Keep HTTP handling, domain operations, persistence, and runtime integrations
separate. Small pure skill operations are shared between Node and Deno via
`api/src/utils/skills.ts`; runtime-specific clients and errors are not shared.

## Identity and persistence

The browser signs in with Supabase Auth. Express verifies bearer tokens and
uses a lazy service-role database client, so repositories must explicitly
scope user-owned queries by `user_id`. Edge authentication creates a client
scoped to the user's JWT so RLS applies. Do not merge these client lifetimes or
security boundaries merely because they query the same tables.

Career Profiles and resume skills each have one row per user. Profile saves
replace the submitted profile fields; resume uploads replace saved skills.
Projects are user-owned, with only completed projects counted as skill
evidence. Skills are stored as display-name strings and normalized for
comparison; job required skills have their own lowercase persistence format.

SQL migrations live in `api/src/database/migrations/` and are applied manually.
`runMigrations()` currently lists migration names; it does not execute SQL.
Do not infer that starting the API applies migrations.

## Frontend backend selection

- Career Profile calls use `/api/career-profile`, forwarded by `next.config.ts`
  to `API_URL` (default `http://localhost:8000`).
- Portfolio calls use `NEXT_PUBLIC_API_URL` plus `/api/projects`.
- Jobs call the Supabase jobs function directly; resume calls use
  `supabase.functions.invoke()`.

Shared form types, options, and validation live in
`site/career-buddy-site/lib/careerProfileForm.ts`, not in an onboarding route.
The resume client in `lib/resume.ts` owns its response types and both strict
saved-skills access and best-effort profile import. Pages retain their UI state
and orchestration.

These clients currently have different error and authentication behavior.
They are not interchangeable generic transports. Frontend CD provides
`NEXT_PUBLIC_API_URL`, but not `API_URL`; proxy configuration for deployed
Career Profile calls remains an integration concern.

## Verification and known gaps

API tests use Vitest and node:test. Edge tests use Deno with fake auth/stores
and real extraction fixtures. Tests do not prove deployed RLS or service
availability; live Supabase tests are opt-in. Frontend CI runs pure form tests with node:test, lint, and build.
See the root README for commands and the historical
[e2e validation record](e2e-validation-sprint2.md) for pending live checks.

Known contract mismatch: project controllers return `{ data }` on successful
create/read/update, but the frontend project client requires `success: true`.
This is an existing integration issue, not a reason to change response formats
as part of a structural refactor.
