import { deepStrictEqual, strictEqual } from "node:assert";

import type { AuthContext } from "../_shared/auth.ts";
import type {
  CareerProfile,
  CareerProfileStore,
} from "../_shared/profile/repository.ts";
import { createProfileHandler } from "./handler.ts";

const validProfile = {
  target_career: "  Frontend Engineer  ",
  experience_level: "intermediate",
  skills: ["js", "React", "react.js", "SQL"],
  learning_preferences: ["videos", "hands_on_projects", "videos"],
  weekly_availability_hours: 10,
};

// Fake Store - In-memory rows keyed by user_id, like the UNIQUE column
function setup() {
  const rows = new Map<string, CareerProfile>();
  let nextId = 1;

  const store: CareerProfileStore = {
    findByUser(userId) {
      return Promise.resolve(rows.get(userId) ?? null);
    },
    upsertForUser(userId, input) {
      const existing = rows.get(userId);
      const row: CareerProfile = {
        id: existing?.id ?? `profile-${nextId++}`,
        user_id: userId,
        ...input,
        created_at: existing?.created_at ?? "created",
        updated_at: "updated",
      };
      rows.set(userId, row);
      return Promise.resolve(row);
    },
  };

  // Token "user-a" signs in as user-a; no token or "bad" is unauthenticated
  const handler = createProfileHandler({
    authenticate(req) {
      const token = (req.headers.get("Authorization") ?? "").replace(
        "Bearer ",
        "",
      );
      if (!token || token === "bad") return Promise.resolve(null);
      return Promise.resolve(
        { userId: token, db: null } as unknown as AuthContext,
      );
    },
    store: () => store,
  });

  return { handler, rows };
}

function get(token?: string) {
  return new Request("http://localhost/profile", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

function post(body: unknown, token?: string) {
  return new Request("http://localhost/profile", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

Deno.test("GET returns 401 without a token", async () => {
  const { handler } = setup();
  const res = await handler(get());
  const body = await res.json();

  strictEqual(res.status, 401);
  strictEqual(body.success, false);
  strictEqual(body.error.code, "AUTHENTICATION_REQUIRED");
});

Deno.test("POST returns 401 with an invalid token and saves nothing", async () => {
  const { handler, rows } = setup();
  const res = await handler(post(validProfile, "bad"));
  await res.body?.cancel();

  strictEqual(res.status, 401);
  strictEqual(rows.size, 0);
});

Deno.test("GET returns data: null for a new user", async () => {
  const { handler } = setup();
  const res = await handler(get("user-a"));
  const body = await res.json();

  strictEqual(res.status, 200);
  strictEqual(body.success, true);
  strictEqual(body.data, null);
  strictEqual(typeof body.meta.timestamp, "string");
});

Deno.test("POST creates a normalized profile and returns 201", async () => {
  const { handler } = setup();
  const res = await handler(post(validProfile, "user-a"));
  const body = await res.json();

  strictEqual(res.status, 201);
  strictEqual(body.success, true);
  strictEqual(body.data.user_id, "user-a");
  strictEqual(body.data.target_career, "Frontend Engineer");
  deepStrictEqual(body.data.skills, ["JavaScript", "React", "SQL"]);
  deepStrictEqual(body.data.learning_preferences, [
    "videos",
    "hands_on_projects",
  ]);

  const saved = await (await handler(get("user-a"))).json();
  deepStrictEqual(saved.data, body.data);
});

Deno.test("POST again replaces the existing profile", async () => {
  const { handler, rows } = setup();
  const first = await (await handler(post(validProfile, "user-a"))).json();
  const second = await (
    await handler(
      post(
        { ...validProfile, target_career: "Data Analyst", skills: ["Python"] },
        "user-a",
      ),
    )
  ).json();

  strictEqual(rows.size, 1);
  strictEqual(second.data.id, first.data.id);
  strictEqual(second.data.target_career, "Data Analyst");
  deepStrictEqual(second.data.skills, ["Python"]);
});

Deno.test("POST returns 400 with per-field details", async () => {
  const { handler, rows } = setup();
  const res = await handler(
    post(
      {
        target_career: "",
        experience_level: "expert",
        skills: [],
        learning_preferences: ["podcasts"],
        weekly_availability_hours: 0,
      },
      "user-a",
    ),
  );
  const body = await res.json();

  strictEqual(res.status, 400);
  strictEqual(body.error.code, "VALIDATION_ERROR");
  strictEqual(body.error.message, "Invalid Career Profile.");
  deepStrictEqual(
    body.error.details.map((detail: { field: string }) => detail.field),
    [
      "target_career",
      "experience_level",
      "skills",
      "learning_preferences",
      "weekly_availability_hours",
    ],
  );
  strictEqual(rows.size, 0);
});

Deno.test("POST enforces length and count limits", async () => {
  const { handler } = setup();
  const tooLong = await (
    await handler(
      post(
        {
          ...validProfile,
          target_career: "x".repeat(101),
          skills: ["y".repeat(51)],
        },
        "user-a",
      ),
    )
  ).json();
  deepStrictEqual(
    tooLong.error.details.map((detail: { field: string }) => detail.field),
    ["target_career", "skills"],
  );

  const tooMany = await (
    await handler(
      post(
        {
          ...validProfile,
          skills: Array.from({ length: 31 }, (_, i) => `skill-${i}`),
        },
        "user-a",
      ),
    )
  ).json();
  strictEqual(
    tooMany.error.details[0].message,
    "skills can have at most 30 entries.",
  );
});

Deno.test("POST rejects a body that is not a JSON object", async () => {
  const { handler } = setup();
  for (const body of ["not json", "[]", "null"]) {
    const res = await handler(post(body, "user-a"));
    const payload = await res.json();
    strictEqual(res.status, 400);
    strictEqual(payload.error.message, "Request body must be a JSON object.");
  }
});

Deno.test("users only read and write their own profile", async () => {
  const { handler, rows } = setup();
  await (await handler(post(validProfile, "user-a"))).body?.cancel();

  // user_id in the body is ignored; the token decides the owner
  const res = await handler(
    post(
      { ...validProfile, user_id: "user-a", target_career: "Hijacked" },
      "user-b",
    ),
  );
  const body = await res.json();

  strictEqual(body.data.user_id, "user-b");
  strictEqual(rows.get("user-a")?.target_career, "Frontend Engineer");

  const otherUser = await (await handler(get("user-c"))).json();
  strictEqual(otherUser.data, null);
});

Deno.test("rejects other methods and sub-routes", async () => {
  const { handler } = setup();
  const put = await handler(
    new Request("http://localhost/profile", {
      method: "PUT",
      headers: { Authorization: "Bearer user-a" },
    }),
  );
  strictEqual(put.status, 405);
  await put.body?.cancel();

  const nested = await handler(
    new Request("http://localhost/profile/other", {
      headers: { Authorization: "Bearer user-a" },
    }),
  );
  strictEqual(nested.status, 404);
  await nested.body?.cancel();
});

Deno.test("OPTIONS returns CORS headers", async () => {
  const { handler } = setup();
  const res = await handler(
    new Request("http://localhost/profile", { method: "OPTIONS" }),
  );
  await res.body?.cancel();
  strictEqual(res.headers.get("Access-Control-Allow-Origin"), "*");
});
