# CareerLM (Career Buddy)

AI-powered career assistant. This repo holds the frontend, backend, and infrastructure code shared by all subsystem owners.

## Repo structure

```
api/                    Backend API (Express + TypeScript)
site/career-buddy-site/ Frontend (Next.js + TypeScript)
infra/                  Infrastructure as code (Terraform, AWS)
```

## Prerequisites

- Node.js 22+ (CI runs on Node 24)
- npm 10.x

## Backend (`api/`)

```bash
cd api
npm install
npm run dev
```

Runs an Express server on `http://localhost:8000` (override with a `PORT` env var). Health check: `GET /health`. Use `npm run build && npm start` to run the compiled production build, and `npm run lint` before committing.

## Frontend (`site/career-buddy-site/`)

```bash
cd site/career-buddy-site
npm install
npm run dev
```

Runs the Next.js dev server on `http://localhost:3000`. Run `npm run lint` and `npm run build` before committing.

## Infrastructure (`infra/`)

Terraform config targeting AWS (`us-west-2` by default). Requires Terraform >= 1.5.0 and AWS credentials configured locally.

```bash
cd infra
terraform init
terraform plan
```

## Environment variables

None required yet. As subsystems add config (API keys, DB URLs, etc.), document them here and add a `.env.example` in the relevant folder.

## CI

GitHub Actions runs checks on pull requests to `main` (see `.github/workflows/`). A failing step fails the PR check.

| Workflow    | Runs when you change      | Checks                                                             |
| ----------- | ------------------------- | ------------------------------------------------------------------ |
| API CI      | `api/`, `supabase/`       | Prettier, ESLint, `tsc` build, all tests (`npm test`), Deno checks |
| Frontend CI | `site/career-buddy-site/` | ESLint, build                                                      |
| Infra CI    | `infra/`                  | `terraform fmt`, `validate`                                        |

Run the API checks locally from `api/` before pushing: `npm run format:check && npm run lint && npm run build && npm test`. `npm run format` fixes formatting.

**Adding a backend test**

- Vitest: name it `*.test.ts` and it runs automatically.
- `node:test`: add the file to `test:node` **and** `--exclude` it in `test:vitest` in `api/package.json`, or Vitest will try to run it too.
- Tests must not need secrets. The one exception is `src/database/__tests__/resumeRepository.test.ts`, which needs a live Supabase `.env` and is excluded from CI; run it with `npm run test:integration`.

**Edge Functions:** when `supabase/functions/<name>/index.ts` exists, CI also runs `deno fmt --check`, `deno lint`, and `deno check` on it. API modules that functions import (currently `api/src/utils/skills.ts`) are always type-checked under Deno; add new shared modules to the `edge-functions` job.
