import { deepStrictEqual } from "node:assert";
import { computeJobSkillMatch } from "./matching.ts";

Deno.test("matching preserves requirement order, spelling, aliases and rounding", () => {
  const input = {
    requiredSkills: [" ", "GraphQL", "graphql", "js", "SQL"].map((name) => ({
      name,
    })),
    profileSkills: ["sql", "JS"],
  };
  const original = structuredClone(input);
  deepStrictEqual(computeJobSkillMatch(input), {
    matched: [
      { name: "JavaScript", key: "javascript" },
      { name: "SQL", key: "sql" },
    ],
    missing: [{ name: "GraphQL", key: "graphql" }],
    score: 67,
  });
  deepStrictEqual(input, original);
});

Deno.test("matching treats an absent profile as no known skills", () => {
  deepStrictEqual(
    computeJobSkillMatch({
      requiredSkills: [{ name: "ts" }, { name: "TypeScript" }],
    }),
    {
      matched: [],
      missing: [{ name: "TypeScript", key: "typescript" }],
      score: 0,
    },
  );
});

Deno.test("matching scores empty or blank-only requirements as 100", () => {
  for (const requiredSkills of [[], [{ name: " " }]]) {
    deepStrictEqual(computeJobSkillMatch({ requiredSkills }), {
      matched: [],
      missing: [],
      score: 100,
    });
  }
});
