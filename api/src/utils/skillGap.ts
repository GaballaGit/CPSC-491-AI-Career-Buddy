/**
 * Structured skill-gap representation (C40CS-7). Builds on the shared skill
 * contract (skills.ts) — skills here are always already-normalized `Skill`s,
 * compared by `key`. See entities/skill-contract.md.
 */

import type { Skill } from "./skills.js";

/** Where a user's skill came from. */
export type SkillSource = "profile" | "resume" | "project";

export interface SourcedSkill extends Skill {
  source: SkillSource;
}

export interface SkillGap<T extends Skill = Skill> {
  /** Required skills the user has, in requiredSkills order. */
  matched: Skill[];
  /** Required skills the user lacks, in requiredSkills order. */
  missing: Skill[];
  /** The user's own skills, deduped by key, first-seen order preserved. */
  known: T[];
}

function dedupeByKey<T extends Skill>(skills: readonly T[]): T[] {
  const seen = new Set<string>();
  const deduped: T[] = [];
  for (const skill of skills) {
    if (seen.has(skill.key)) continue;
    seen.add(skill.key);
    deduped.push(skill);
  }
  return deduped;
}

/**
 * Pure, deterministic comparison: same input always produces the same
 * output and order. Both arguments must already be normalized `Skill`s
 * (via normalizeSkill/normalizeSkills) — this does not normalize strings.
 */
export function compareSkills<T extends Skill>(
  userSkills: readonly T[],
  requiredSkills: readonly Skill[],
): SkillGap<T> {
  const knownKeys = new Set(userSkills.map((skill) => skill.key));

  const matched: Skill[] = [];
  const missing: Skill[] = [];
  const seenRequired = new Set<string>();
  for (const skill of requiredSkills) {
    if (seenRequired.has(skill.key)) continue;
    seenRequired.add(skill.key);
    (knownKeys.has(skill.key) ? matched : missing).push(skill);
  }

  return { matched, missing, known: dedupeByKey(userSkills) };
}

/**
 * Merges a user's skills from multiple sources into one deduped list.
 * When the same skill (by key) appears from more than one source, the
 * first source it's seen from wins, following each source array in the
 * order given.
 */
export function mergeSkillSources(
  sources: readonly { source: SkillSource; skills: readonly Skill[] }[],
): SourcedSkill[] {
  const merged: SourcedSkill[] = [];
  for (const { source, skills } of sources) {
    for (const skill of skills) {
      merged.push({ ...skill, source });
    }
  }
  return dedupeByKey(merged);
}
