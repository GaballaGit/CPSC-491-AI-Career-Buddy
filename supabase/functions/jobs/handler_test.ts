import { deepStrictEqual, strictEqual } from "node:assert";
import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import type { AuthContext } from "../_shared/auth.ts";
import type { CareerProfileStore } from "../_shared/jobs/profile.ts";
import type { Job, JobStore } from "../_shared/jobs/repository.ts";
import { createJobsHandler } from "./handler.ts";

const jobs: Job[] = [
  {
    id: "frontend",
    title: "Frontend Engineer",
    description: "Build accessible web experiences.",
    category: "Engineering",
    required_skills: [{ name: "react" }, { name: "typescript" }],
    created_at: "now",
    updated_at: "now",
  },
  {
    id: "analyst",
    title: "Data Analyst",
    description: "Turn data into recommendations.",
    category: "Data",
    required_skills: [{ name: "sql" }, { name: "python" }],
    created_at: "now",
    updated_at: "now",
  },
];

function fakeDeps(profileSkills: string[] | null | undefined) {
  const jobStore: JobStore = {
    list(category) {
      const filtered = category
        ? jobs.filter(
          (job) => job.category.toLowerCase() === category.toLowerCase(),
        )
        : jobs;
      return Promise.resolve(
        [...filtered].sort((a, b) => a.title.localeCompare(b.title)),
      );
    },
    findById(id) {
      return Promise.resolve(jobs.find((job) => job.id === id) ?? null);
    },
  };
  const profileStore: CareerProfileStore = {
    findByUser() {
      return Promise.resolve(profileSkills ? { skills: profileSkills } : null);
    },
  };

  return createJobsHandler({
    authenticate: () =>
      Promise.resolve(
        profileSkills === undefined
          ? null
          : ({ userId: "user-a", db: null } as unknown as AuthContext),
      ),
    publicDb: () => null as unknown as SupabaseClient,
    jobs: () => jobStore,
    profiles: () => profileStore,
  });
}

Deno.test("lists jobs while signed out without match data", async () => {
  const handler = fakeDeps(undefined);
  const res = await handler(new Request("http://localhost/jobs"));
  const body = await res.json();

  strictEqual(res.status, 200);
  strictEqual(body.success, true);
  strictEqual(body.meta.matching.status, "signed_out");
  strictEqual(body.data.length, 2);
  strictEqual(body.data[0].match, undefined);
});

Deno.test("filters jobs by category", async () => {
  const handler = fakeDeps(undefined);
  const body = await (
    await handler(new Request("http://localhost/jobs?category=Engineering"))
  ).json();

  strictEqual(body.data.length, 1);
  strictEqual(body.data[0].id, "frontend");
});

Deno.test("adds match data for a signed-in user with a profile", async () => {
  const handler = fakeDeps(["React"]);
  const body = await (
    await handler(new Request("http://localhost/jobs/frontend"))
  ).json();

  strictEqual(body.meta.matching.status, "available");
  strictEqual(body.data.match.score, 50);
  deepStrictEqual(
    body.data.match.matched.map((skill: { name: string }) => skill.name),
    ["React"],
  );
  deepStrictEqual(
    body.data.match.missing.map((skill: { name: string }) => skill.name),
    ["TypeScript"],
  );
});

Deno.test(
  "reports profile_missing for signed-in users without onboarding",
  async () => {
    const handler = fakeDeps(null);
    const body = await (
      await handler(new Request("http://localhost/jobs"))
    ).json();

    strictEqual(body.meta.matching.status, "profile_missing");
    strictEqual(body.data[0].match, undefined);
  },
);

Deno.test("returns 404 for an unknown job", async () => {
  const handler = fakeDeps(["React"]);
  const res = await handler(new Request("http://localhost/jobs/missing"));
  const body = await res.json();

  strictEqual(res.status, 404);
  strictEqual(body.error.code, "RESOURCE_NOT_FOUND");
});

Deno.test("validates pagination params", async () => {
  const handler = fakeDeps(["React"]);
  const res = await handler(new Request("http://localhost/jobs?page=one"));
  const body = await res.json();

  strictEqual(res.status, 400);
  strictEqual(body.error.code, "VALIDATION_ERROR");
});

Deno.test("OPTIONS returns CORS headers", async () => {
  const handler = fakeDeps(undefined);
  const res = await handler(
    new Request("http://localhost/jobs", { method: "OPTIONS" }),
  );
  await res.body?.cancel();
  strictEqual(res.headers.get("Access-Control-Allow-Origin"), "*");
});
