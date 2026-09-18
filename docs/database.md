# Database Setup

CareerLM uses **Supabase** (hosted Postgres). One shared project for the whole team.

## Local setup

1. Copy `api/.env.example` to `api/.env`.
2. Fill in `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from Supabase → Project Settings → API Keys.
3. Install dependencies: `npm install` inside `api`.
4. Verify the connection:

```bash
npm run db:check
```

Expected output:

```
OK  Connected to Supabase.
```

If it prints `FAIL`, the message says what is wrong — usually a missing or wrong environment variable.

## Rules

- `.env` is gitignored. Never commit it.
- The `service_role` key bypasses row-level security. Keep it server-side only, never in frontend code.
- Ask in the team chat for the credentials rather than sharing them in a public channel.

## Notes

- Project region is West US (North California).
- The health check queries a table that does not exist on purpose. Postgres replying "table not found" still proves we reached the database.
