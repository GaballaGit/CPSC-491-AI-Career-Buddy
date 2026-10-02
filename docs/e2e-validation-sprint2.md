# Sprint 2 End-to-End Validation (C40CS-29)

Results of validating the integrated Sprint 2 flow. This is a verification record, not a bug list: failures get their own Bug tickets linked to C40CS-29.

## Environment and method

|                        |                                                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Date                   | 2026-10-01                                                                                                                                 |
| Commit                 | `main` @ `f0a6a52` (includes #50 to #63)                                                                                                   |
| Environment            | **Local checkout, static review plus automated tests.** No live walkthrough yet.                                                           |
| Automated              | API: Prettier clean, `tsc` build clean, vitest 22/22, node:test 64/64.                                                                     |
| Not yet done           | Live walkthrough against the shared Supabase project (tables, auth settings, deployed functions). The "Live run" column below is for that. |
| Open at time of review | #64 (C40CS-27, app shell and nav) has a merge conflict with `main`.                                                                        |

**Reading the table:** "Code" means the implementation and its tests exist on `main` for that step. It does not mean the step was exercised end to end. A step is only fully passed once "Live run" says Pass.

## Checklist

| #   | Step                                  | Code                 | Live run | Notes                                                                                                                                                                                                                   |
| --- | ------------------------------------- | -------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Sign up / sign in with Supabase Auth  | Present              | Pending  | Auth is on Supabase in both Express (`requireAuthentication`) and the Edge Functions. Needs the email-confirmation setting checked.                                                                                     |
| 2   | Create and edit Career Profile        | Present              | Pending  | Onboarding, `/profile/edit`, and API tests are merged. Needs migration `003_create_career_profiles.sql` applied on the shared DB.                                                                                       |
| 3   | Upload resume                         | Present              | Pending  | Resume page calls the `resume` Edge Function. Needs migration `004_create_resume_skills.sql` applied. The Edge Function deploy workflow succeeded on the latest main push.                                              |
| 4   | Resume skills normalized              | Present              | Pending  | Normalization covered by unit tests (`skills.test.ts`).                                                                                                                                                                 |
| 5   | Profile can use resume skills         | Present              | Pending  | `/profile/edit` has a "From your resume" import section. It fails silently when there is no resume, so check it deliberately.                                                                                           |
| 6   | Jobs compare against the profile      | Present              | Pending  | The `jobs` Edge Function calls `computeJobSkillMatch` with `profile.skills`.                                                                                                                                            |
| 7   | Matched and missing skills visible    | Present              | Pending  | `job-detail.tsx` renders both lists. Signed-out or no-profile users see a prompt instead.                                                                                                                               |
| 8   | Navigation connects major sections    | **Blocked**          | Pending  | Not on `main`: `app/layout.tsx` has no nav and the home page has no links. Delivered by #64 (C40CS-27), which must be merged first.                                                                                     |
| 9   | Portfolio uses the same user identity | Present              | Pending  | `lib/projects.ts` sends the Supabase session token (`authHeaders()`), and the Express `/projects` routes use `requireAuthentication` and scope by `user.id`. `/dashboard` and `/projects` are behind `ProtectedRoute`.  |
| 10  | Portfolio uses the same skill shape   | Present, with a note | Pending  | Projects run `normalizeSkills` (same contract) but persist `skills_demonstrated` as display names (`string[]`), not `Skill {name, key}`. The key is derivable, so comparison works, but it is a different stored shape. |

## Findings

None of these is a confirmed runtime failure. They are the items most likely to become Bugs after the live run.

1. **Navigation missing on `main` (step 8).** Blocked on #64. Re-run step 8 after it merges. File a Bug only if it still fails.
2. **Portfolio is not on the deployed backend.** Projects still go through the Express API (`/api/projects`, proxied by `next.config.ts` to `API_URL`, default `http://localhost:8000`). Only the `resume` and `jobs` functions exist under `supabase/functions/`, and Frontend CD deploys the site to Cloudflare without Express. On the deployed site the portfolio will not work. It works on a local stack that runs the Express API.
3. **Skill shape differs for projects (step 10).** Stored as names, not `Skill` objects. Either document this in `docs/contracts.md` as the intended persistence format or migrate it. It is not a contract violation at the normalization level.
4. **Frontend CD failed** on the last push to `main` (GitHub Actions, Frontend CD). Cause not investigated here. A deployed-environment walkthrough depends on it.
5. **Stale docs:** `docs/contracts.md` still has "PR #52" and "#49 not yet merged" wording.

## Still to do

- Run steps 1 to 7, 9 and 10 against the local integrated stack (Express API plus Next.js plus the shared Supabase project), then fill in the "Live run" column with Pass or Fail and the date.
- Re-run step 8 after #64 merges.
- File a Bug for each live failure and for finding 2 if the team treats it as a bug. Link each to C40CS-29.
