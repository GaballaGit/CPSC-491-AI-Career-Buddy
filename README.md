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

GitHub Actions runs lint + build checks on pull requests that touch `api/`, `site/career-buddy-site/`, or `infra/` (see `.github/workflows/`).
