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
