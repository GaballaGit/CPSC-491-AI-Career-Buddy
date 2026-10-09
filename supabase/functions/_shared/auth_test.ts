import { strictEqual } from "node:assert";
import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";
import { createAuthenticator } from "./auth.ts";

function setup(
  result: { data: { user: { id: string } | null }; error: unknown },
) {
  const calls: unknown[][] = [];
  const db = {
    auth: {
      getUser: (token: string) => {
        calls.push(["getUser", token]);
        return Promise.resolve(result);
      },
    },
  } as unknown as SupabaseClient;
  const authenticate = createAuthenticator({
    getEnv: (name) => name === "SUPABASE_URL" ? "https://example.test" : "anon",
    createClient: ((...args: unknown[]) => {
      calls.push(args);
      return db;
    }) as never,
  });
  return { authenticate, calls, db };
}

Deno.test("authenticate returns null without an Authorization header", async () => {
  const { authenticate, calls } = setup({ data: { user: null }, error: null });
  strictEqual(await authenticate(new Request("https://example.test")), null);
  strictEqual(calls.length, 0);
});

Deno.test("authenticate rejects malformed and empty bearer headers", async () => {
  const { authenticate, calls } = setup({ data: { user: null }, error: null });
  for (const value of ["Basic token", "Bearer", "Bearer "]) {
    strictEqual(
      await authenticate(
        new Request("https://example.test", {
          headers: { Authorization: value },
        }),
      ),
      null,
    );
  }
  strictEqual(calls.length, 0);
});

Deno.test("authenticate returns user-scoped client for a valid token", async () => {
  const { authenticate, calls, db } = setup({
    data: { user: { id: "user-a" } },
    error: null,
  });
  const result = await authenticate(
    new Request("https://example.test", {
      headers: { Authorization: "Bearer valid-token" },
    }),
  );
  strictEqual(result?.userId, "user-a");
  strictEqual(result?.db, db);
  strictEqual(calls[0][0], "https://example.test");
  strictEqual(calls[1][0], "getUser");
  strictEqual(calls[1][1], "valid-token");
});

Deno.test("authenticate returns null for invalid/expired tokens or missing user", async () => {
  for (
    const result of [
      { data: { user: null }, error: new Error("expired") },
      { data: { user: null }, error: null },
    ]
  ) {
    const { authenticate } = setup(result);
    strictEqual(
      await authenticate(
        new Request("https://example.test", {
          headers: { Authorization: "Bearer bad-token" },
        }),
      ),
      null,
    );
  }
});

Deno.test("authenticate requires Supabase environment for bearer requests", async () => {
  const authenticate = createAuthenticator({
    getEnv: () => undefined,
    createClient: (() => {
      throw new Error("must not create client");
    }) as never,
  });
  let error: unknown;
  try {
    await authenticate(
      new Request("https://example.test", {
        headers: { Authorization: "Bearer token" },
      }),
    );
  } catch (caught) {
    error = caught;
  }
  strictEqual((error as Error)?.message, "Supabase env vars are not set.");
});
