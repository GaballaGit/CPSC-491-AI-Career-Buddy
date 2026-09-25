import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, beforeEach, describe, it, mock } from "node:test";

import { app } from "../app.js";
import { careerProfileRepository } from "../database/careerProfileRepository.js";
import type {
  CareerProfile,
  CreateCareerProfileDto,
} from "../entities/index.js";

// Auth is real (sign up + Auth.js credentials sign-in); only the database is
// replaced with an in-memory store so the tests don't need Supabase.
const store = new Map<string, CareerProfile>();

const upsertForUser = mock.method(
  careerProfileRepository,
  "upsertForUser",
  async (userId: string, dto: CreateCareerProfileDto) => {
    const existing = store.get(userId);
    const now = new Date().toISOString();
    const profile: CareerProfile = {
      id: existing?.id ?? randomUUID(),
      user_id: userId,
      ...dto,
      created_at: existing?.created_at ?? now,
      updated_at: now,
    };
    store.set(userId, profile);
    return profile;
  },
);

const findByUser = mock.method(
  careerProfileRepository,
  "findByUser",
  async (userId: string) => store.get(userId) ?? null,
);

const PASSWORD = "password123";
const JSON_HEADERS = { "content-type": "application/json" };

const validProfile = {
  target_career: "  Frontend Engineer  ",
  experience_level: "intermediate",
  skills: [" TypeScript", "React "],
  learning_preferences: ["hands_on_projects", "reading"],
  weekly_availability_hours: 10,
};

interface TestUser {
  id: string;
  cookie: string;
}

let server: Server;
let baseUrl: string;
let alice: TestUser;
let bob: TestUser;

function sessionCookies(response: Response): string[] {
  return response.headers.getSetCookie().map((cookie) => cookie.split(";")[0]);
}

async function signUpAndSignIn(email: string): Promise<TestUser> {
  const signUp = await fetch(`${baseUrl}/api/auth/signup`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  assert.equal(signUp.status, 201, "sign-up should succeed");

  const csrf = await fetch(`${baseUrl}/api/auth/csrf`);
  const { csrfToken } = (await csrf.json()) as { csrfToken: string };

  const signIn = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie: sessionCookies(csrf).join("; "),
    },
    body: new URLSearchParams({ email, password: PASSWORD, csrfToken }),
  });
  const cookie = sessionCookies(signIn).find((c) =>
    c.startsWith("authjs.session-token="),
  );
  assert.ok(cookie, "sign-in should set a session cookie");

  const me = await fetch(`${baseUrl}/api/auth/me`, { headers: { cookie } });
  const body = (await me.json()) as { data: { user: { id: string } } };
  return { id: body.data.user.id, cookie };
}

function postProfile(body: unknown, user?: TestUser) {
  return fetch(`${baseUrl}/api/career-profile`, {
    method: "POST",
    headers: user ? { ...JSON_HEADERS, cookie: user.cookie } : JSON_HEADERS,
    body: JSON.stringify(body),
  });
}

function getProfile(user?: TestUser) {
  return fetch(`${baseUrl}/api/career-profile`, {
    headers: user ? { cookie: user.cookie } : {},
  });
}

before(async () => {
  server = app.listen(0);
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  alice = await signUpAndSignIn("alice@careerprofile.test");
  bob = await signUpAndSignIn("bob@careerprofile.test");
});

beforeEach(() => {
  store.clear();
  upsertForUser.mock.resetCalls();
  findByUser.mock.resetCalls();
});

after(() => {
  mock.restoreAll();
  server.close();
});

describe("POST /api/career-profile", () => {
  it("saves the signed-in user's profile", async () => {
    const response = await postProfile(validProfile, alice);
    const body = (await response.json()) as {
      success: boolean;
      data: CareerProfile;
      meta: { timestamp: string };
    };

    assert.equal(response.status, 201);
    assert.equal(body.success, true);
    assert.ok(body.meta.timestamp);
    assert.equal(body.data.user_id, alice.id);
    assert.equal(body.data.target_career, "Frontend Engineer");
    assert.deepEqual(body.data.skills, ["TypeScript", "React"]);
    assert.deepEqual(body.data.learning_preferences, [
      "hands_on_projects",
      "reading",
    ]);
    assert.equal(body.data.weekly_availability_hours, 10);

    assert.equal(upsertForUser.mock.callCount(), 1);
    assert.equal(upsertForUser.mock.calls[0].arguments[0], alice.id);
  });

  it("replaces the profile when onboarding is submitted again", async () => {
    const first = (await (await postProfile(validProfile, alice)).json()) as {
      data: CareerProfile;
    };
    const second = await postProfile(
      { ...validProfile, target_career: "Data Analyst" },
      alice,
    );
    const body = (await second.json()) as { data: CareerProfile };

    assert.equal(second.status, 201);
    assert.equal(body.data.id, first.data.id);
    assert.equal(body.data.target_career, "Data Analyst");
    assert.equal(store.size, 1);
  });

  it("rejects requests without a signed-in session", async () => {
    const response = await postProfile(validProfile);
    const body = (await response.json()) as { error: { code: string } };

    assert.equal(response.status, 401);
    assert.equal(body.error.code, "AUTHENTICATION_REQUIRED");
    assert.equal(upsertForUser.mock.callCount(), 0);
  });

  it("rejects an empty payload and reports every missing field", async () => {
    const response = await postProfile({}, alice);
    const body = (await response.json()) as {
      error: { code: string; details: { field: string }[] };
    };

    assert.equal(response.status, 400);
    assert.equal(body.error.code, "VALIDATION_ERROR");
    assert.deepEqual(body.error.details.map((d) => d.field).sort(), [
      "experience_level",
      "learning_preferences",
      "skills",
      "target_career",
      "weekly_availability_hours",
    ]);
    assert.equal(upsertForUser.mock.callCount(), 0);
  });

  it("rejects invalid values and wrong types", async () => {
    const response = await postProfile(
      {
        ...validProfile,
        target_career: "   ",
        experience_level: "expert",
        skills: "React",
        learning_preferences: ["dancing"],
        weekly_availability_hours: "10",
      },
      alice,
    );
    const body = (await response.json()) as {
      error: { details: { field: string }[] };
    };

    assert.equal(response.status, 400);
    assert.equal(body.error.details.length, 5);
    assert.equal(upsertForUser.mock.callCount(), 0);
  });

  it("rejects a body that isn't valid JSON", async () => {
    const response = await fetch(`${baseUrl}/api/career-profile`, {
      method: "POST",
      headers: { ...JSON_HEADERS, cookie: alice.cookie },
      body: "{not json",
    });
    const body = (await response.json()) as {
      error: { code: string; message: string };
    };

    assert.equal(response.status, 400);
    assert.equal(body.error.code, "INVALID_REQUEST");
    assert.equal(body.error.message, "Request body must be valid JSON.");
    assert.equal(upsertForUser.mock.callCount(), 0);
  });

  it("removes duplicate skills and learning preferences", async () => {
    const response = await postProfile(
      {
        ...validProfile,
        skills: ["React", "react", " REACT ", "SQL"],
        learning_preferences: ["reading", "videos", "reading"],
      },
      alice,
    );
    const body = (await response.json()) as { data: CareerProfile };

    assert.equal(response.status, 201);
    assert.deepEqual(body.data.skills, ["React", "SQL"]);
    assert.deepEqual(body.data.learning_preferences, ["reading", "videos"]);
  });

  it("saves skill aliases under their canonical name", async () => {
    const response = await postProfile(
      { ...validProfile, skills: ["js", "JavaScript", "nodejs", "postgres"] },
      alice,
    );
    const body = (await response.json()) as { data: CareerProfile };

    assert.equal(response.status, 201);
    assert.deepEqual(body.data.skills, ["JavaScript", "Node.js", "PostgreSQL"]);
  });

  it("enforces the skill length and count limits", async () => {
    const skills = (count: number) =>
      Array.from({ length: count }, (_, i) => `skill-${i}`);
    const cases: [string, string[], number][] = [
      ["50-character skill", ["x".repeat(50)], 201],
      ["51-character skill", ["x".repeat(51)], 400],
      ["30 skills", skills(30), 201],
      ["31 skills", skills(31), 400],
    ];

    for (const [name, value, expected] of cases) {
      const response = await postProfile(
        { ...validProfile, skills: value },
        alice,
      );
      assert.equal(response.status, expected, name);
    }
  });

  it("rejects out-of-range weekly hours", async () => {
    for (const hours of [0, 169, 10.5]) {
      const response = await postProfile(
        { ...validProfile, weekly_availability_hours: hours },
        alice,
      );
      const body = (await response.json()) as {
        error: { details: { field: string }[] };
      };

      assert.equal(response.status, 400, `hours ${hours} should be rejected`);
      assert.deepEqual(
        body.error.details.map((d) => d.field),
        ["weekly_availability_hours"],
      );
    }
  });
});

describe("GET /api/career-profile", () => {
  it("returns the signed-in user's saved profile", async () => {
    await postProfile(validProfile, alice);

    const response = await getProfile(alice);
    const body = (await response.json()) as {
      success: boolean;
      data: CareerProfile;
    };

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.user_id, alice.id);
    assert.equal(body.data.target_career, "Frontend Engineer");
    assert.equal(findByUser.mock.calls[0].arguments[0], alice.id);
  });

  it("returns data: null when the user hasn't onboarded yet", async () => {
    const response = await getProfile(bob);
    const body = (await response.json()) as {
      success: boolean;
      data: CareerProfile | null;
    };

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data, null);
  });

  it("never returns another user's profile", async () => {
    await postProfile(validProfile, alice);

    const response = await getProfile(bob);
    const body = (await response.json()) as { data: CareerProfile | null };

    assert.equal(body.data, null);
    assert.equal(findByUser.mock.calls[0].arguments[0], bob.id);
  });

  it("rejects requests without a signed-in session", async () => {
    const response = await getProfile();
    const body = (await response.json()) as { error: { code: string } };

    assert.equal(response.status, 401);
    assert.equal(body.error.code, "AUTHENTICATION_REQUIRED");
    assert.equal(findByUser.mock.callCount(), 0);
  });

  it("returns a 500 error when the database fails", async () => {
    findByUser.mock.mockImplementationOnce(async () => {
      throw new Error("Could not read career profile: connection refused");
    });

    const response = await getProfile(alice);
    const body = (await response.json()) as {
      success: boolean;
      error: { code: string };
    };

    assert.equal(response.status, 500);
    assert.equal(body.success, false);
    assert.equal(body.error.code, "INTERNAL_SERVER_ERROR");
  });
});
