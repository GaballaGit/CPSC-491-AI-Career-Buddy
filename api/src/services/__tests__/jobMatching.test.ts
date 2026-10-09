import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { computeJobSkillMatch } from "../jobMatching.js";

const requiredSkills = (...names: string[]) => names.map((name) => ({ name }));

describe("computeJobSkillMatch", () => {
  it("matches complete user skill data from profile and resume", () => {
    const match = computeJobSkillMatch({
      requiredSkills: requiredSkills("TypeScript", "React", "PostgreSQL"),
      profileSkills: ["React"],
      resumeSkills: ["TypeScript", "Postgres"],
    });

    assert.deepEqual(
      match.matched.map((skill) => skill.name),
      ["TypeScript", "React", "PostgreSQL"],
    );
    assert.deepEqual(match.missing, []);
    assert.equal(match.score, 100);
  });

  it("uses profile skills when resume skills are absent", () => {
    const match = computeJobSkillMatch({
      requiredSkills: requiredSkills("React", "Node.js", "PostgreSQL", "AWS"),
      profileSkills: ["React", "nodejs"],
    });

    assert.deepEqual(
      match.matched.map((skill) => skill.name),
      ["React", "Node.js"],
    );
    assert.deepEqual(
      match.missing.map((skill) => skill.name),
      ["PostgreSQL", "AWS"],
    );
    assert.equal(match.score, 50);
  });

  it("returns every required skill as missing when the user has no skills", () => {
    const match = computeJobSkillMatch({
      requiredSkills: requiredSkills("JavaScript", "React"),
    });

    assert.deepEqual(match.matched, []);
    assert.deepEqual(
      match.missing.map((skill) => skill.name),
      ["JavaScript", "React"],
    );
    assert.equal(match.score, 0);
  });

  it("reports missing skills correctly for partial matches", () => {
    const match = computeJobSkillMatch({
      requiredSkills: requiredSkills("TypeScript", "GraphQL", "Kubernetes"),
      profileSkills: ["TypeScript"],
      resumeSkills: ["k8s"],
    });

    assert.deepEqual(
      match.matched.map((skill) => skill.name),
      ["TypeScript", "Kubernetes"],
    );
    assert.deepEqual(
      match.missing.map((skill) => skill.name),
      ["GraphQL"],
    );
    assert.equal(match.score, 67);
  });

  it("does not double-count duplicate, case-variant, or aliased skills", () => {
    const match = computeJobSkillMatch({
      requiredSkills: requiredSkills("JavaScript", "js", "React", "reactjs"),
      profileSkills: ["JS", "javascript", "REACT"],
      resumeSkills: ["ecmascript", "react.js"],
    });

    assert.deepEqual(
      match.matched.map((skill) => skill.name),
      ["JavaScript", "React"],
    );
    assert.deepEqual(match.missing, []);
    assert.equal(match.score, 100);
  });

  it("preserves requirement spelling and order, drops blanks, and rounds scores", () => {
    const input = {
      requiredSkills: requiredSkills(" ", "GraphQL", "graphql", "js", "SQL"),
      profileSkills: ["sql", "JS"],
    };
    const original = structuredClone(input);

    assert.deepEqual(computeJobSkillMatch(input), {
      matched: [
        { name: "JavaScript", key: "javascript" },
        { name: "SQL", key: "sql" },
      ],
      missing: [{ name: "GraphQL", key: "graphql" }],
      score: 67,
    });
    assert.deepEqual(input, original);
    assert.deepEqual(
      computeJobSkillMatch({ requiredSkills: requiredSkills(" ") }),
      {
        matched: [],
        missing: [],
        score: 100,
      },
    );
  });

  it("handles jobs with no required skills without dividing by zero", () => {
    const match = computeJobSkillMatch({
      requiredSkills: [],
      profileSkills: ["React"],
      resumeSkills: ["TypeScript"],
    });

    assert.deepEqual(match.matched, []);
    assert.deepEqual(match.missing, []);
    assert.equal(match.score, 100);
  });
});
