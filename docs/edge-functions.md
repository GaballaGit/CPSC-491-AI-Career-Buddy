# Edge Functions: Migration Pattern

How we move an Express route to a Supabase Edge Function. The resume upload (C40CS-11) is the first one; other subsystems follow the same layout.

## Folder layout

```
supabase/
  config.toml                  one [functions.<name>] block per function
  functions/
    _shared/                   code shared by functions (not deployed on its own)
      http.ts                  response envelope, HttpError, CORS headers
      auth.ts                  current user from the JWT + user-scoped client
      resume/
        extract.ts             PDF/DOCX -> text
        skills.ts              text -> skills (shared skill contract)
        repository.ts          resume_skills table
        validate.ts            upload checks (type, size)
        fixtures/              sample files used by tests
    resume/
      index.ts                 entry point: Deno.serve(handler)
      handler.ts               request handling, testable without a server
      handler_test.ts          deno test
      deno.json                per-function import map
```

Folders that start with `_` are never deployed as functions.

## Rules

- **Keep `index.ts` to one line.** Put logic in `handler.ts` so tests can call it with a plain `Request`.
- **Business logic lives in `_shared/<subsystem>/`.** No Express or Node-only APIs there.
- **Same envelope as Express.** Use `ok()` and `fail()` from `_shared/http.ts`. Throw `HttpError(status, code, message, details)` for expected failures; anything else becomes a generic 500.
- **npm packages use `npm:` specifiers** with a version range, e.g. `npm:unpdf@^1.8.1`.
- **Secrets never go in code.** Runtime secrets are set with `supabase secrets set`; see C40CS-15 for deploy credentials.

## Auth

`verify_jwt = true` in `config.toml`: the Supabase gateway rejects requests without a valid JWT (anon key or a signed-in user's token) before the function runs. Call functions from the frontend with `supabase.functions.invoke()`, which sends the token for you.

The anon key alone is not a user. Use `authenticate(req)` from `_shared/auth.ts`: it returns `{ userId, db }` for a signed-in user or `null` (return 401). `db` sends the user's token, so Row Level Security limits every query to that user's rows. Handlers take `authenticate` and the store as dependencies so tests can pass fakes.

## Runtime notes

- `unpdf` works in Deno as-is.
- `mammoth` does **not** accept `{ arrayBuffer }` in Deno ("Could not find file in options"). Pass `{ buffer: Buffer.from(bytes) }` with `Buffer` from `node:buffer`.
- `mammoth` 1.13.0 fails in Deno (`ExternalPromise.resolve is not a function`). It is pinned to exactly `1.12.3`; upgrade only for a security fix, and run the tests first.
- `api/src/utils/skills.ts` has no imports, so functions import it by relative path.

## Run locally

Install [Deno](https://deno.com), then from the repo root:

```
deno test --allow-read --allow-env --allow-net supabase/functions
deno fmt --check supabase/functions
deno lint supabase/functions
```

`supabase functions serve` also works but needs Docker.

## Migration status

| Route | Function | Status |
|---|---|---|
| `POST /api/resumes` | `POST /resume` | Migrated. Express route deprecated; frontend switches after C40CS-15 deploys the function. |
| — | `GET /resume/skills` | New in C40CS-12: current user's saved resume skills. |
| — | `POST /resume/feedback` | New in C40CS-14: structured AI feedback for `{ text, targetRole? }`. |
