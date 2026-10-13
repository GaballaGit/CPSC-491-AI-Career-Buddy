import type { Project } from "./types.ts";

export interface Skill {
  name: string;
  key: string;
}

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

const canonicalBySpelling = new Map<string, string>();

for (const [name, aliases] of Object.entries(CANONICAL_SKILLS)) {
  canonicalBySpelling.set(name.toLowerCase(), name);

  for (const alias of aliases) {
    canonicalBySpelling.set(alias, name);
  }
}

function normalizeSkills(inputs: readonly string[]): Skill[] {
  const seen = new Set<string>();
  const skills: Skill[] = [];

  for (const input of inputs) {
    const collapsed = input.trim().replace(/\s+/g, " ");

    if (!collapsed) {
      continue;
    }

    const name = canonicalBySpelling.get(collapsed.toLowerCase()) ?? collapsed;

    const key = name.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    skills.push({ name, key });
  }

  return skills;
}

export function getCompletedProjectSkills(
  projects: readonly Project[],
): Skill[] {
  const demonstratedSkills = projects
    .filter((project) => project.status === "completed")
    .flatMap((project) => project.skills_demonstrated);

  return normalizeSkills(demonstratedSkills);
}
