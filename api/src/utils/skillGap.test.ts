import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { compareSkills, mergeSkillSources } from "./skillGap.js";
import { normalizeSkills } from "./skills.js";

describe("compareSkills", () => {
  it("returns matched/missing based on normalized keys", () => {
    const user = normalizeSkills(["JavaScript", "PostgreSQL"]);
    const required = normalizeSkills(["js", "React", "postgres"]);

    const gap = compareSkills(user, required);

    assert.deepEqual(
      gap.matched.map((s) => s.name),
      ["JavaScript", "PostgreSQL"],
    );
    assert.deepEqual(
      gap.missing.map((s) => s.name),
      ["React"],
    );
  });

  it("is deterministic: same input gives the same output and order", () => {
    const user = normalizeSkills(["React", "SQL", "Go"]);
    const required = normalizeSkills(["Go", "React", "Rust"]);

    const first = compareSkills(user, required);
    const second = compareSkills(user, required);

    assert.deepEqual(first, second);
    // Order follows requiredSkills, not userSkills.
    assert.deepEqual(
      first.matched.map((s) => s.name),
      ["Go", "React"],
    );
  });

  it("empty user skills means every required skill is missing", () => {
    const required = normalizeSkills(["React", "SQL"]);

    const gap = compareSkills([], required);

    assert.deepEqual(gap.matched, []);
    assert.deepEqual(
      gap.missing.map((s) => s.name),
      ["React", "SQL"],
    );
    assert.deepEqual(gap.known, []);
  });

  it("empty required skills means nothing is missing", () => {
    const user = normalizeSkills(["React", "SQL"]);

    const gap = compareSkills(user, []);

    assert.deepEqual(gap.matched, []);
    assert.deepEqual(gap.missing, []);
    assert.deepEqual(
      gap.known.map((s) => s.name),
      ["React", "SQL"],
    );
  });

  it("does not error on empty user and required skills", () => {
    assert.deepEqual(compareSkills([], []), {
      matched: [],
      missing: [],
      known: [],
    });
  });

  it("dedupes required skills by key without affecting order", () => {
    const user = normalizeSkills(["React"]);
    const required = normalizeSkills(["React", "react", "SQL", "SQL"]);

    const gap = compareSkills(user, required);

    assert.deepEqual(
      gap.matched.map((s) => s.name),
      ["React"],
    );
    assert.deepEqual(
      gap.missing.map((s) => s.name),
      ["SQL"],
    );
  });

  it("known is deduped by key, keeping first-seen spelling and order", () => {
    const user = normalizeSkills(["React", "react", "SQL"]);

    const gap = compareSkills(user, []);

    assert.deepEqual(
      gap.known.map((s) => s.name),
      ["React", "SQL"],
    );
  });
});

describe("mergeSkillSources", () => {
  it("merges skills from multiple sources without duplicates", () => {
    const merged = mergeSkillSources([
      { source: "profile", skills: normalizeSkills(["JavaScript", "SQL"]) },
      { source: "resume", skills: normalizeSkills(["js", "React"]) },
      { source: "project", skills: normalizeSkills(["React", "Go"]) },
    ]);

    assert.deepEqual(
      merged.map((s) => s.name),
      ["JavaScript", "SQL", "React", "Go"],
    );
  });

  it("retains source info, keeping the first source a skill is seen from", () => {
    const merged = mergeSkillSources([
      { source: "profile", skills: normalizeSkills(["JavaScript"]) },
      { source: "resume", skills: normalizeSkills(["js", "React"]) },
    ]);

    assert.deepEqual(merged, [
      { name: "JavaScript", key: "javascript", source: "profile" },
      { name: "React", key: "react", source: "resume" },
    ]);
  });

  it("returns an empty list for no sources or all-empty sources", () => {
    assert.deepEqual(mergeSkillSources([]), []);
    assert.deepEqual(
      mergeSkillSources([
        { source: "profile", skills: [] },
        { source: "resume", skills: [] },
      ]),
      [],
    );
  });

  it("feeds cleanly into compareSkills", () => {
    const known = mergeSkillSources([
      { source: "profile", skills: normalizeSkills(["SQL"]) },
      { source: "resume", skills: normalizeSkills(["React", "Go"]) },
    ]);
    const required = normalizeSkills(["React", "Rust"]);

    const gap = compareSkills(known, required);

    assert.deepEqual(
      gap.matched.map((s) => s.name),
      ["React"],
    );
    assert.deepEqual(
      gap.missing.map((s) => s.name),
      ["Rust"],
    );
    assert.equal(gap.known.find((s) => s.key === "react")?.source, "resume");
  });
});
