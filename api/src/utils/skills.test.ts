import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { normalizeSkill, normalizeSkills } from "./skills.js";

describe("normalizeSkill", () => {
  it("trims and collapses whitespace", () => {
    assert.deepEqual(normalizeSkill("  Machine   Learning  "), {
      name: "Machine Learning",
      key: "machine learning",
    });
  });

  it("gives every casing of a skill the same key", () => {
    const keys = ["react", "React", " REACT "].map(
      (s) => normalizeSkill(s)?.key,
    );
    assert.deepEqual(keys, ["react", "react", "react"]);
  });

  it("maps documented aliases to one canonical skill", () => {
    for (const alias of ["js", "JS", "JavaScript", "ecmascript"]) {
      assert.deepEqual(normalizeSkill(alias), {
        name: "JavaScript",
        key: "javascript",
      });
    }
    for (const alias of ["node", "NodeJS", "node js", "Node.js"]) {
      assert.equal(normalizeSkill(alias)?.key, "node.js", alias);
    }
    assert.equal(normalizeSkill("postgres")?.name, "PostgreSQL");
    assert.equal(normalizeSkill("k8s")?.name, "Kubernetes");
  });

  it("keeps the caller's spelling for skills without an alias", () => {
    assert.deepEqual(normalizeSkill("Figma"), { name: "Figma", key: "figma" });
    assert.deepEqual(normalizeSkill("GraphQL"), {
      name: "GraphQL",
      key: "graphql",
    });
  });

  it("keeps punctuation that is part of the skill name", () => {
    assert.equal(normalizeSkill("C++")?.key, "c++");
    assert.equal(normalizeSkill("C#")?.key, "c#");
    assert.equal(normalizeSkill(".NET")?.key, ".net");
  });

  it("returns null for empty, whitespace-only, and non-string input", () => {
    assert.equal(normalizeSkill(""), null);
    assert.equal(normalizeSkill("   \t\n"), null);
    assert.equal(normalizeSkill(42 as unknown as string), null);
    assert.equal(normalizeSkill(undefined as unknown as string), null);
  });
});

describe("normalizeSkills", () => {
  it("removes duplicates and keeps the first spelling and order", () => {
    assert.deepEqual(
      normalizeSkills(["React", "react", " REACT ", "SQL", "sql"]).map(
        (s) => s.name,
      ),
      ["React", "SQL"],
    );
  });

  it("treats aliases as duplicates of the canonical skill", () => {
    assert.deepEqual(
      normalizeSkills(["JavaScript", "js", "JS"]).map((s) => s.name),
      ["JavaScript"],
    );
  });

  it("drops empty entries", () => {
    assert.deepEqual(
      normalizeSkills(["", "  ", "Go", "golang"]).map((s) => s.name),
      ["Go"],
    );
  });

  it("returns an empty list for empty input", () => {
    assert.deepEqual(normalizeSkills([]), []);
  });

  it("is idempotent", () => {
    const once = normalizeSkills(["js", "React", "react", " Node "]);
    const twice = normalizeSkills(once.map((s) => s.name));
    assert.deepEqual(twice, once);
  });
});
