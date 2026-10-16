import { assertEquals } from "jsr:@std/assert@1";

import type { Project } from "./types.ts";
import { getCompletedProjectSkills } from "./skillEvidence.ts";

const baseProject: Project = {
  id: "11111111-1111-1111-1111-111111111111",
  user_id: "22222222-2222-2222-2222-222222222222",
  title: "Test Project",
  description: "Test description",
  skills_demonstrated: [],
  project_urls: [],
  status: "completed",
  created_at: "2026-09-28T00:00:00.000Z",
  updated_at: "2026-09-28T00:00:00.000Z",
};

Deno.test("completed projects return normalized skill evidence", () => {
  const projects: Project[] = [
    {
      ...baseProject,
      skills_demonstrated: ["ts", "nodejs", "Postgres"],
    },
  ];

  assertEquals(getCompletedProjectSkills(projects), [
    { name: "TypeScript", key: "typescript" },
    { name: "Node.js", key: "node.js" },
    { name: "PostgreSQL", key: "postgresql" },
  ]);
});

Deno.test("in-progress project skills are ignored", () => {
  const projects: Project[] = [
    {
      ...baseProject,
      skills_demonstrated: ["TypeScript"],
    },
    {
      ...baseProject,
      id: "33333333-3333-3333-3333-333333333333",
      status: "in_progress",
      skills_demonstrated: ["Python"],
    },
  ];

  assertEquals(getCompletedProjectSkills(projects), [
    { name: "TypeScript", key: "typescript" },
  ]);
});

Deno.test("duplicate and aliased completed skills are removed", () => {
  const projects: Project[] = [
    {
      ...baseProject,
      skills_demonstrated: ["ts", "Node.js"],
    },
    {
      ...baseProject,
      id: "44444444-4444-4444-4444-444444444444",
      skills_demonstrated: ["TypeScript", "nodejs"],
    },
  ];

  assertEquals(getCompletedProjectSkills(projects), [
    { name: "TypeScript", key: "typescript" },
    { name: "Node.js", key: "node.js" },
  ]);
});

Deno.test("no completed projects produces no skill evidence", () => {
  const projects: Project[] = [
    {
      ...baseProject,
      status: "in_progress",
      skills_demonstrated: ["TypeScript"],
    },
  ];

  assertEquals(getCompletedProjectSkills(projects), []);
});
