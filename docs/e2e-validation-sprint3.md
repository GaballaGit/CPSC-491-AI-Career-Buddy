# Sprint 3 End-to-End Validation (C40CS-33)

Live walkthrough of the integrated flow from the Sprint 2 checklist
(`docs/e2e-validation-sprint2.md`), which was recorded but never run live. This
is a verification record: each failure has its own Bug linked to C40CS-33.

## Environment and method

|             |                                                                                                                                              |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Date        | 2026-10-15                                                                                                                                   |
| Commit      | `main` @ `6cf490d` (includes #70 to #77)                                                                                                     |
| Environment | **Local** Next.js dev server (`localhost:3000`) against the shared Supabase project and its deployed Edge Functions. No Express API running. |
| Why local   | Frontend CD still fails (C40CS-37), so there is no deployed site. The ticket allows a local run.                                            |
| Browser     | Chrome, desktop width                                                                                                                        |
| Account     | A team mock account. **Not fresh:** it had already completed onboarding and uploaded a resume, so step 2 tests editing rather than creation. |
| Test data   | Synthetic only: `supabase/functions/_shared/resume/fixtures/` (`sample_resume.pdf`, `no_skills_resume.docx`) and one test project.         |

## Checklist

| #   | Step                                  | Result   | Notes                                                                                                                                                                                                                         |
| --- | ------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Sign up / sign in with Supabase Auth  | **Pass** | Signed in with the mock account; nav switches to "Sign out" and the dashboard loads. Sign-up was not repeated (existing account). Sign-out from `/signout` works.                                                             |
| 2   | Create and edit Career Profile        | **Pass** | Profile exists from earlier onboarding. Edited skills on `/profile/edit`, saved, redirected to `/profile` with the new values. Dashboard counts update (6 → 8 skills).                                                       |
| 3   | Upload resume                         | **Pass** | `sample_resume.pdf` uploaded: 754 characters, 110 words extracted, text preview shown.                                                                                                                                       |
| 4   | Resume skills normalized              | **Pass** | 12 skills detected with canonical names, e.g. `Node.js`, `REST API`, `PostgreSQL`.                                                                                                                                            |
| 5   | Profile can use resume skills         | **Pass** | "From your resume" lists only skills not already on the profile (Python, TypeScript, React were left out). Added SQL and Docker, saved, both shown on `/profile`.                                                            |
| 6   | Jobs compare against the profile      | **Fail** | No jobs exist: the page shows "No roles found in this category." and `GET /jobs` returns `total: 0`. The `jobs` table is created by a migration but never seeded. **C40CS-65.**                                              |
| 7   | Matched and missing skills visible    | **Fail** | Cannot be exercised without jobs. Blocked by **C40CS-65**.                                                                                                                                                                    |
| 8   | Navigation connects major sections    | **Pass** | Dashboard, Profile, Resume, Jobs, Portfolio and Roadmap nav links each reach their page. (Was blocked in Sprint 2; fixed by C40CS-27.)                                                                                       |
| 9   | Portfolio uses the same user identity | **Pass** | Created "E2E test project (C40CS-33)" signed in; it appears on `/projects` and the dashboard count goes 0 → 1. Portfolio now uses the `projects` Edge Function with the Supabase session (Sprint 2 finding 2 is resolved). |
| 10  | Portfolio uses the same skill shape   | **Pass** | Entered `js, react.js, PostgreSQL`; stored and shown as `JavaScript, React, PostgreSQL`, the same normalization as resume and profile. Still stored as names (`string[]`), as noted in Sprint 2.                            |

## Negative and edge checks

| Check                                 | Result      | Notes                                                                                                                                                                                                                                            |
| ------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Signed-out access to protected pages  | **Fail**    | `/dashboard`, `/projects`, `/projects/new` redirect to `/signin?callbackUrl=…`. `/profile`, `/profile/edit`, `/onboarding` and `/roadmap` do not: Profile shows an error with no sign-in link, Onboarding shows the whole form. **C40CS-67.** |
| Signed-out API access                 | **Pass**    | Without a user token: `profile`, `projects`, `resume/skills` and `POST resume` return `401 AUTHENTICATION_REQUIRED`. `jobs` lists publicly with `matching.status: signed_out`, as designed. No data is exposed.                           |
| Resume page signed out                | **Pass**    | Shows "Sign in to upload your resume" with a sign-in button.                                                                                                                                                                                     |
| Resume with no recognizable skills    | **Pass**    | `no_skills_resume.docx`: "No skills found in no_skills_resume.docx. Make sure your resume lists tools and languages by name…"                                                                                                                    |
| Unknown job id                        | **Fail**    | `/jobs/does-not-exist` returns `500` (page: "Unable to load job."). A well-formed missing UUID correctly returns `404`. **C40CS-66.**                                                                                                          |
| Profile with no resume                | Not run     | The mock account already had a resume, and uploads replace it rather than delete it. Needs a fresh account.                                                                                                                                      |
| Job with no profile                   | Not run     | No jobs exist (C40CS-65), and the account has a profile.                                                                                                                                                                                         |

## Bugs filed

| Bug       | Summary                                                                               | Priority |
| --------- | ------------------------------------------------------------------------------------- | -------- |
| C40CS-65  | Jobs table is empty, so no jobs can be browsed or matched (blocks steps 6–7)          | High     |
| C40CS-66  | `GET /jobs/:id` returns 500 for a non-UUID id instead of 404                          | Low      |
| C40CS-67  | Profile, profile edit, onboarding and roadmap pages don't redirect signed-out users   | Medium   |

## Sprint 2 findings, revisited

1. **Navigation missing (step 8):** resolved by C40CS-27.
2. **Portfolio not on the deployed backend:** resolved. Portfolio uses the `projects` Edge Function (C40CS-39, #71, #76); nothing in this run used Express.
3. **Project skill shape:** unchanged. Names are normalized identically but stored as `string[]`, not `Skill {name, key}`.
4. **Frontend CD failing:** still failing; tracked in C40CS-37.

## Still to do

- Re-run steps 6–7 and the "job with no profile" check after C40CS-65 seeds jobs.
- Run the "profile with no resume" check and a full sign-up with a fresh account.
- Repeat the walkthrough on the deployed site once C40CS-37 is fixed.
