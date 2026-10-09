/**
 * Shared skill contract (C40CS-6). Deliberately has no imports so API code and
 * Supabase Edge Functions can both use it. See entities/skill-contract.md.
 */

export interface Skill {
  /** Display name, e.g. "JavaScript". */
  name: string;
  /** Comparison key, e.g. "javascript". Compare skills by key, never by name. */
  key: string;
}

// Canonical display name -> accepted alternate spellings (lowercase).
const CANONICAL_SKILLS: Record<string, string[]> = {
  JavaScript: ["js", "ecmascript"],
  TypeScript: ["ts"],
  "Node.js": ["node", "nodejs", "node js"],
  React: ["reactjs", "react.js"],
  "Next.js": ["next", "nextjs", "next js"],
  "Vue.js": ["vue", "vuejs", "vue js"],
  PostgreSQL: ["postgres", "psql"],
  MongoDB: ["mongo"],
  Kubernetes: ["k8s"],
  Go: ["golang"],
  "C++": ["cpp"],
  "C#": ["csharp", "c sharp"],
};

const CANONICAL_BY_SPELLING = new Map<string, string>();
for (const [name, aliases] of Object.entries(CANONICAL_SKILLS)) {
  CANONICAL_BY_SPELLING.set(name.toLowerCase(), name);
  for (const alias of aliases) CANONICAL_BY_SPELLING.set(alias, name);
}

/** Returns null for empty or whitespace-only input. Length limits are the caller's job. */
export function normalizeSkill(input: string): Skill | null {
  if (typeof input !== "string") return null;
  const collapsed = input.trim().replace(/\s+/g, " ");
  if (collapsed === "") return null;

  const name = CANONICAL_BY_SPELLING.get(collapsed.toLowerCase()) ?? collapsed;
  return { name, key: name.toLowerCase() };
}

/** Drops empty entries and duplicates (by key), keeping first-seen order and spelling. */
export function normalizeSkills(inputs: readonly string[]): Skill[] {
  const seen = new Set<string>();
  const skills: Skill[] = [];
  for (const input of inputs) {
    const skill = normalizeSkill(input);
    if (skill === null || seen.has(skill.key)) continue;
    seen.add(skill.key);
    skills.push(skill);
  }
  return skills;
}

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
