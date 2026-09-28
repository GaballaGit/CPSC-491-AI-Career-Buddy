import { describe, expect, it } from "vitest";

import type { Project } from "../../entities/project.js";
import { getCompletedProjectSkills } from "../projectSkillEvidence.js";

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

describe("getCompletedProjectSkills", () => {
  it("returns normalized skills from completed projects", () => {
    const projects: Project[] = [
      {
        ...baseProject,
        skills_demonstrated: ["ts", "nodejs", "Postgres"],
      },
    ];

    expect(getCompletedProjectSkills(projects)).toEqual([
      {
        name: "TypeScript",
        key: "typescript",
      },
      {
        name: "Node.js",
        key: "node.js",
      },
      {
        name: "PostgreSQL",
        key: "postgresql",
      },
    ]);
  });

  it("ignores skills from in-progress projects", () => {
    const projects: Project[] = [
      {
        ...baseProject,
        status: "completed",
        skills_demonstrated: ["TypeScript"],
      },
      {
        ...baseProject,
        id: "33333333-3333-3333-3333-333333333333",
        status: "in_progress",
        skills_demonstrated: ["Python"],
      },
    ];

    expect(getCompletedProjectSkills(projects)).toEqual([
      {
        name: "TypeScript",
        key: "typescript",
      },
    ]);
  });

  it("removes duplicate and aliased skills across completed projects", () => {
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

    expect(getCompletedProjectSkills(projects)).toEqual([
      {
        name: "TypeScript",
        key: "typescript",
      },
      {
        name: "Node.js",
        key: "node.js",
      },
    ]);
  });

  it("returns an empty array when there are no completed projects", () => {
    const projects: Project[] = [
      {
        ...baseProject,
        status: "in_progress",
        skills_demonstrated: ["TypeScript"],
      },
    ];

    expect(getCompletedProjectSkills(projects)).toEqual([]);
  });
});
