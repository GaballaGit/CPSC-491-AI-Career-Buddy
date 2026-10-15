# Testing Strategy (C40CS-34)

How CareerLM is tested for the rest of the semester: which tools we use, where
tests live, who owns what, and what "done" means for a testing story. Testing
stories live under the epic **C40CS-30, Semester Testing & QA**.

## Test levels and tools

| Level                   | Tool                                    | Where                                         | Runs in CI      | Status                    |
| ----------------------- | --------------------------------------- | --------------------------------------------- | --------------- | ------------------------- |
| API unit and controller | Vitest                                  | `api/src/**/*.test.ts`                        | API CI          | In use                    |
| API unit and controller | `node:test` (via `tsx --test`)          | `api/src/**/*.test.ts`, listed in `test:node` | API CI          | In use                    |
| API integration (live)  | Vitest against a real Supabase project  | `api/src/database/__tests__/`                 | No (needs .env) | In use, manual            |
| Edge Function           | `deno test`                             | `supabase/functions/**/*_test.ts`             | API CI          | In use                    |
| Frontend logic          | `node:test` (`node --test`)             | `site/career-buddy-site/tests/*.test.mjs`     | Frontend CI     | In use                    |
| React components        | Chosen in C40CS-56                      | `site/career-buddy-site/`                     | Frontend CI     | Planned (Sprint 3)        |
| Browser E2E             | Playwright                              | Decided in C40CS-42                           | New workflow    | Planned (wk 9-10)         |
| Live end-to-end         | Manual walkthrough, recorded in `docs/` | `docs/e2e-validation-*.md`                    | No              | Each sprint (C40CS-29/33) |
| Exploratory             | Manual, time-boxed                      | Findings filed as Jira Bugs                   | No              | Final weeks (wk 14-16)    |

## Baseline

Fresh run on `main` @ `0dceffa` (2026-10-14). All passing.

| Suite          | Command (from)                                                      | Tests   | Files                                                                                                                             |
| -------------- | ------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------- |
| API Vitest     | `npm run test:vitest` (`api/`)                                      | 62      | `projects` 38, `projectValidation` 18, `projectSkillEvidence` 4, `resume` service 2                                               |
| API node:test  | `npm run test:node` (`api/`)                                        | 65      | `careerProfile` 31, `skills` 11, `skillGap` 11, `jobMatching` 7, `jobs` 3, `resumes` 2                                            |
| Edge Functions | `deno test --allow-read --allow-env --allow-net supabase/functions` | 64      | `resume` handler 19, `profile` handler 11, `resume/feedback` 11, `resume/skills` 8, `jobs` handler 7, `auth` 5, `jobs/matching` 3 |
| Frontend       | `npm test` (`site/career-buddy-site/`)                              | 15      | `careerProfileForm` 15                                                                                                            |
| **Total**      |                                                                     | **206** |                                                                                                                                   |

Not in the baseline: `resumeRepository.test.ts` (live Supabase,
`npm run test:integration`) and the `projects` Edge Function, which has no
tests on `main` yet (#71). Open PRs #71, #73 and #74 add tests; refresh this
table when they merge.

**What CI runs.** API CI (changes under `api/` or `supabase/`): Prettier,
ESLint, `tsc`, `npm test` (Vitest then node:test), and for Edge Functions
`deno fmt --check`, `deno lint`, `deno check` and `deno test`. Frontend CI
(changes under `site/career-buddy-site/`): ESLint, `npm test`, `next build`.
Infra CI runs Terraform checks only. Nothing runs on push to `main` except the
deploy workflows.

## Conventions

**Where tests live.** Next to the code they test.

- API: `foo.ts` → `foo.test.ts` in the same folder, or `__tests__/` for
  services and repositories.
- Edge Functions: `handler.ts` → `handler_test.ts`; shared code in `_shared/`
  gets its own `*_test.ts`.
- Frontend: `site/career-buddy-site/tests/<module>.test.mjs`.

**Naming.** Test names say the behavior, not the function:
`"POST returns 400 with per-field details"`, not `"validate test 3"`.

**Registering a new test file.**

- Vitest: name it `*.test.ts` and it runs automatically.
- `node:test` in `api/`: add the file to `test:node` **and** `--exclude` it in
  `test:vitest` in `api/package.json`, or Vitest will try to run it too.
- Deno: name it `*_test.ts` under `supabase/functions/`. CI picks it up.
- Frontend: name it `tests/*.test.mjs`.

**Mocks vs live Supabase.** CI tests never need secrets or a network.

- Edge Function handlers take their dependencies (`authenticate`, store,
  `fetch`) as arguments, for example `createProfileHandler(deps)`. Tests pass
  in-memory fakes. Follow this pattern for new functions.
- API controller tests mock the database module (`vi.mock` / `node:test`
  mocks).
- Anything that needs a real Supabase project goes in a separate command that
  CI does not run (like `test:integration`), and its file says so at the top.
- Never put real keys, tokens or user data in tests or fixtures.

**Fixtures.** Shared sample files live in a `fixtures/` folder next to the code
that uses them (for example `supabase/functions/_shared/resume/fixtures/`).
Keep them small and synthetic.

**Live runs.** End-to-end validation is recorded in
`docs/e2e-validation-<sprint>.md` with the commit, environment, and a
Pass/Fail per step. See `docs/e2e-validation-sprint2.md`.

## Per-member test matrix

Every testing story in C40CS-30, by owner. Phase comes from the `phase-*`
label. Method: **Unit** = mocked automated tests, **Int** = across subsystems or
against live Supabase, **E2E** = browser or full-stack, **Manual** = recorded
walkthrough or exploratory.

| Owner   | Ticket   | Area                              | Method                     | Phase    | Status (2026-10-14) |
| ------- | -------- | --------------------------------- | -------------------------- | -------- | ------------------- |
| Jim     | C40CS-33 | Integrated flow                   | Manual (live E2E)          | Sprint 3 | To Do               |
| Jim     | C40CS-34 | Test strategy (this doc)          | Docs                       | Sprint 3 | In progress         |
| Jim     | C40CS-48 | Resume import, profile, jobs      | Int                        | wk 9-10  | To Do               |
| Jim     | C40CS-49 | Roadmap logic and milestones      | Unit, Manual review        | wk 11-13 | To Do               |
| Jim     | C40CS-50 | Career Profile security           | Unit, Int (negative paths) | wk 11-13 | To Do               |
| Jim     | C40CS-51 | Profile and Roadmap final         | Unit, Manual (deployed)    | wk 14-16 | To Do               |
| William | C40CS-36 | Resume Edge Function errors       | Unit, fixtures             | Sprint 3 | In Review (#73)     |
| William | C40CS-53 | AI resume feedback                | Unit                       | Sprint 3 | In Review (#74)     |
| William | C40CS-52 | Migrations, fresh-DB replay       | Int (CI)                   | wk 9-10  | In Progress         |
| William | C40CS-54 | Resume parsing, storage isolation | Unit, Int                  | wk 11-13 | To Do               |
| William | C40CS-55 | Resume final                      | Unit, Manual (deployed)    | wk 14-16 | To Do               |
| Mark    | C40CS-38 | Auth on Edge Functions            | Unit                       | Sprint 3 | Done                |
| Mark    | C40CS-56 | React components                  | Unit (components)          | Sprint 3 | To Do               |
| Mark    | C40CS-57 | Cloudflare deploy check           | Int (CD smoke)             | wk 9-10  | To Do               |
| Mark    | C40CS-58 | Job matching and filtering        | Unit                       | wk 11-13 | To Do               |
| Mark    | C40CS-59 | Jobs and Auth final               | Unit, Manual (exploratory) | wk 14-16 | To Do               |
| Daniel  | C40CS-42 | Playwright framework (stretch)    | E2E                        | wk 9-10  | To Do               |
| Daniel  | C40CS-60 | Portfolio on the Edge Function    | Unit                       | wk 9-10  | To Do (#71 open)    |
| Daniel  | C40CS-61 | Career Readiness                  | Int                        | wk 11-13 | To Do               |
| Daniel  | C40CS-62 | Navigation, a11y, responsive      | Manual, E2E                | wk 11-13 | To Do               |
| Daniel  | C40CS-63 | Infra smoke and final E2E         | E2E, Manual                | wk 14-16 | To Do               |

Earlier testing stories, under their feature epics and all Done in Sprint 2:
C40CS-9 (Jim, Career Profile), C40CS-19 (Mark, job matching), C40CS-24
(Daniel, portfolio), C40CS-29 (Jim, Sprint 2 E2E).

## Definition of done for testing stories

A testing story moves to Done when:

1. The tests are merged to `main` and pass in CI. Manual-only stories instead
   have a merged record in `docs/`.
2. The PR or Jira ticket states the test count before and after, and which
   command runs them.
3. Each acceptance criterion maps to at least one named test or recorded step.
4. Failures found along the way are filed as Bugs linked to the story, not
   fixed silently inside the testing PR.
5. Live or deployed checks have evidence on the ticket: the commit, the
   environment, and screenshots or the recorded result.
6. If the story adds a new test file or tool, this doc and the README CI
   section are updated in the same PR.
