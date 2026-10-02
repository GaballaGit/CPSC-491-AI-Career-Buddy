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
import { compareSkills, mergeSkillSources } from "../utils/skillGap.js";
import { normalizeSkill, normalizeSkills } from "../utils/skills.js";

// Auth and the database are replaced with in-memory fakes so the tests don't
// need Supabase.
const store = new Map<string, CareerProfile>();
const tokenToUser = new Map<string, { id: string; email: string }>();

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
  token: string;
}

let server: Server;
let baseUrl: string;
let alice: TestUser;
let bob: TestUser;

async function signUpAndSignIn(email: string): Promise<TestUser> {
  const id = randomUUID();
  const token = `${email}-token`;
  tokenToUser.set(token, { id, email });
  process.env.SUPABASE_AUTH_TEST_USERS = JSON.stringify(
    Object.fromEntries(tokenToUser),
  );

  const me = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(me.status, 200, "mock token should authenticate");

  return { id, token };
}

function postProfile(body: unknown, user?: TestUser) {
  return fetch(`${baseUrl}/api/career-profile`, {
    method: "POST",
    headers: user
      ? { ...JSON_HEADERS, authorization: `Bearer ${user.token}` }
      : JSON_HEADERS,
    body: JSON.stringify(body),
  });
}

function getProfile(user?: TestUser) {
  return fetch(`${baseUrl}/api/career-profile`, {
    headers: user ? { authorization: `Bearer ${user.token}` } : {},
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
  delete process.env.SUPABASE_AUTH_TEST_USERS;
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
      headers: { ...JSON_HEADERS, authorization: `Bearer ${alice.token}` },
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

// Updating a profile is the same POST upsert as onboarding (see
// career-profile-schema.md §3.1), so these tests post over a saved profile.
describe("updating a saved profile", () => {
  const updated = {
    target_career: "Data Analyst",
    experience_level: "advanced",
    skills: ["SQL", "Python"],
    learning_preferences: ["videos"],
    weekly_availability_hours: 20,
  };

  async function saved(user: TestUser): Promise<CareerProfile> {
    const profile = store.get(user.id);
    assert.ok(profile, "expected a saved profile");
    return structuredClone(profile);
  }

  it("replaces every field and keeps the same row", async () => {
    await postProfile(validProfile, alice);
    const before = await saved(alice);

    const response = await postProfile(updated, alice);
    const body = (await response.json()) as { data: CareerProfile };

    assert.equal(response.status, 201);
    assert.equal(body.data.id, before.id);
    assert.equal(body.data.user_id, alice.id);
    assert.equal(body.data.created_at, before.created_at);
    assert.ok(body.data.updated_at >= before.updated_at);
    assert.equal(body.data.target_career, "Data Analyst");
    assert.equal(body.data.experience_level, "advanced");
    assert.deepEqual(body.data.skills, ["SQL", "Python"]);
    assert.deepEqual(body.data.learning_preferences, ["videos"]);
    assert.equal(body.data.weekly_availability_hours, 20);
    assert.equal(store.size, 1);
  });

  it("returns the updated profile on the next read", async () => {
    await postProfile(validProfile, alice);
    await postProfile(updated, alice);

    const body = (await (await getProfile(alice)).json()) as {
      data: CareerProfile;
    };

    assert.equal(body.data.target_career, "Data Analyst");
    assert.deepEqual(body.data.skills, ["SQL", "Python"]);
  });

  it("drops skills that were removed in the update", async () => {
    await postProfile(validProfile, alice);
    await postProfile({ ...validProfile, skills: ["React"] }, alice);

    assert.deepEqual((await saved(alice)).skills, ["React"]);
  });

  it("never changes another user's profile", async () => {
    await postProfile(validProfile, alice);
    const aliceBefore = await saved(alice);

    const response = await postProfile(updated, bob);

    assert.equal(response.status, 201);
    assert.deepEqual(await saved(alice), aliceBefore);
    assert.equal((await saved(bob)).target_career, "Data Analyst");
    assert.equal(store.size, 2);
    assert.equal(upsertForUser.mock.calls.at(-1)?.arguments[0], bob.id);
  });

  it("ignores a user_id or id sent in the request body", async () => {
    await postProfile(validProfile, alice);
    const aliceBefore = await saved(alice);

    const response = await postProfile(
      { ...updated, user_id: alice.id, id: aliceBefore.id },
      bob,
    );
    const body = (await response.json()) as { data: CareerProfile };

    assert.equal(response.status, 201);
    assert.equal(body.data.user_id, bob.id);
    assert.notEqual(body.data.id, aliceBefore.id);
    assert.deepEqual(await saved(alice), aliceBefore);

    const [userId, dto] = upsertForUser.mock.calls.at(-1)?.arguments ?? [];
    assert.equal(userId, bob.id);
    assert.equal("user_id" in (dto as object), false);
    assert.equal("id" in (dto as object), false);
  });

  it("rejects an update without a signed-in session and changes nothing", async () => {
    await postProfile(validProfile, alice);
    const before = await saved(alice);
    upsertForUser.mock.resetCalls();

    const response = await postProfile(updated);
    const body = (await response.json()) as { error: { code: string } };

    assert.equal(response.status, 401);
    assert.equal(body.error.code, "AUTHENTICATION_REQUIRED");
    assert.equal(upsertForUser.mock.callCount(), 0);
    assert.deepEqual(await saved(alice), before);
  });

  it("rejects invalid update data with field details and writes nothing", async () => {
    await postProfile(validProfile, alice);
    const before = await saved(alice);
    upsertForUser.mock.resetCalls();

    const response = await postProfile(
      { ...updated, experience_level: "expert", weekly_availability_hours: 0 },
      alice,
    );
    const body = (await response.json()) as {
      error: { code: string; details: { field: string; message: string }[] };
    };

    assert.equal(response.status, 400);
    assert.equal(body.error.code, "VALIDATION_ERROR");
    assert.deepEqual(body.error.details.map((d) => d.field).sort(), [
      "experience_level",
      "weekly_availability_hours",
    ]);
    assert.ok(body.error.details.every((d) => d.message.length > 0));
    assert.equal(upsertForUser.mock.callCount(), 0);
    assert.deepEqual(await saved(alice), before);
  });

  it("rejects a partial update because updates replace the whole profile", async () => {
    await postProfile(validProfile, alice);
    const before = await saved(alice);
    upsertForUser.mock.resetCalls();

    const response = await postProfile(
      { target_career: "Data Analyst" },
      alice,
    );
    const body = (await response.json()) as {
      error: { details: { field: string }[] };
    };

    assert.equal(response.status, 400);
    assert.deepEqual(body.error.details.map((d) => d.field).sort(), [
      "experience_level",
      "learning_preferences",
      "skills",
      "weekly_availability_hours",
    ]);
    assert.equal(upsertForUser.mock.callCount(), 0);
    assert.deepEqual(await saved(alice), before);
  });

  it("keeps the saved profile when an update fails in the database", async () => {
    await postProfile(validProfile, alice);
    const before = await saved(alice);
    upsertForUser.mock.mockImplementationOnce(async () => {
      throw new Error("Could not save career profile: connection refused");
    });

    const response = await postProfile(updated, alice);

    assert.equal(response.status, 500);
    assert.deepEqual(await saved(alice), before);
  });

  it("normalizes case variants and aliases on update", async () => {
    await postProfile(validProfile, alice);

    const response = await postProfile(
      {
        ...validProfile,
        skills: ["react", " REACT ", "js", "JavaScript", "nodejs", "postgres"],
      },
      alice,
    );
    const body = (await response.json()) as { data: CareerProfile };

    assert.equal(response.status, 201);
    assert.deepEqual(body.data.skills, [
      "React",
      "JavaScript",
      "Node.js",
      "PostgreSQL",
    ]);
    assert.deepEqual((await saved(alice)).skills, body.data.skills);
  });

  it("saves the same skills for the same input on create and on update", async () => {
    const input = { ...validProfile, skills: ["ts", "TypeScript", "k8s"] };

    const created = (await (await postProfile(input, alice)).json()) as {
      data: CareerProfile;
    };
    const again = (await (await postProfile(input, alice)).json()) as {
      data: CareerProfile;
    };

    assert.deepEqual(created.data.skills, again.data.skills);
    assert.equal(new Set(again.data.skills).size, again.data.skills.length);
  });

  it("rejects an update that exceeds the skill limits and keeps the old skills", async () => {
    await postProfile(validProfile, alice);
    const before = await saved(alice);
    const tooMany = Array.from({ length: 31 }, (_, i) => `skill-${i}`);

    const response = await postProfile(
      { ...validProfile, skills: tooMany },
      alice,
    );

    assert.equal(response.status, 400);
    assert.deepEqual((await saved(alice)).skills, before.skills);
  });
});

// Skill names are stored as plain strings on the profile; the skill-gap code
// compares normalized Skill objects. These tests check the two stay in step.
describe("profile skills and skill gap", () => {
  const required = ["JavaScript", "PostgreSQL", "Docker"].map((name) =>
    normalizeSkill(name)!,
  );

  async function savedSkillKeys(user: TestUser) {
    const body = (await (await getProfile(user)).json()) as {
      data: CareerProfile;
    };
    return normalizeSkills(body.data.skills);
  }

  it("matches a job's required skills against a profile saved with aliases", async () => {
    await postProfile({ ...validProfile, skills: ["js", "postgres"] }, alice);

    const gap = compareSkills(await savedSkillKeys(alice), required);

    assert.deepEqual(
      gap.matched.map((s) => s.name),
      ["JavaScript", "PostgreSQL"],
    );
    assert.deepEqual(
      gap.missing.map((s) => s.name),
      ["Docker"],
    );
  });

  it("changes the gap when the profile is updated", async () => {
    await postProfile({ ...validProfile, skills: ["js", "postgres"] }, alice);
    await postProfile({ ...validProfile, skills: ["Docker"] }, alice);

    const gap = compareSkills(await savedSkillKeys(alice), required);

    assert.deepEqual(
      gap.matched.map((s) => s.name),
      ["Docker"],
    );
    assert.deepEqual(
      gap.missing.map((s) => s.name),
      ["JavaScript", "PostgreSQL"],
    );
  });

  it("treats every required skill as missing for a different user's empty profile", async () => {
    await postProfile({ ...validProfile, skills: ["js", "postgres"] }, alice);

    const body = (await (await getProfile(bob)).json()) as {
      data: CareerProfile | null;
    };
    const bobSkills = normalizeSkills(body.data?.skills ?? []);
    const gap = compareSkills(bobSkills, required);

    assert.deepEqual(gap.matched, []);
    assert.equal(gap.missing.length, required.length);
  });

  it("merges profile skills with resume and project skills without duplicates", async () => {
    await postProfile({ ...validProfile, skills: ["js", "react"] }, alice);

    const merged = mergeSkillSources([
      { source: "profile", skills: await savedSkillKeys(alice) },
      { source: "resume", skills: normalizeSkills(["JavaScript", "Docker"]) },
      { source: "project", skills: normalizeSkills(["postgres", "React"]) },
    ]);

    assert.deepEqual(
      merged.map((s) => [s.name, s.source]),
      [
        ["JavaScript", "profile"],
        ["React", "profile"],
        ["Docker", "resume"],
        ["PostgreSQL", "project"],
      ],
    );
    assert.deepEqual(
      compareSkills(merged, required).missing.map((s) => s.name),
      [],
    );
  });
});
