/** Resume skill extraction: finds known skills in text and normalizes them (C40CS-12). */
import {
  normalizeSkills,
  type Skill,
} from "../../../../api/src/utils/skills.ts";

// Dictionary - Spellings to look for; aliases resolve through the shared contract
const SKILL_SPELLINGS: string[] = [
  // Languages
  "JavaScript",
  "JS",
  "TypeScript",
  "TS",
  "Python",
  "Java",
  "C++",
  "C#",
  "Golang",
  "Rust",
  "Kotlin",
  "Swift",
  "Ruby",
  "PHP",
  "SQL",
  "HTML",
  "CSS",
  "Bash",
  // Frameworks and libraries
  "React",
  "React.js",
  "ReactJS",
  "Next.js",
  "NextJS",
  "Vue",
  "Vue.js",
  "Angular",
  "Node.js",
  "NodeJS",
  "Node",
  "Express",
  "Express.js",
  "Django",
  "Flask",
  "FastAPI",
  "Spring Boot",
  "Tailwind CSS",
  "pandas",
  "NumPy",
  "scikit-learn",
  "TensorFlow",
  "PyTorch",
  // Data and infrastructure
  "PostgreSQL",
  "Postgres",
  "MySQL",
  "MongoDB",
  "Redis",
  "Supabase",
  "Firebase",
  "Docker",
  "Kubernetes",
  "K8s",
  "AWS",
  "Azure",
  "GCP",
  "Terraform",
  "Linux",
  // Tools and practices
  "Git",
  "GitHub Actions",
  "CI/CD",
  "REST API",
  "GraphQL",
  "Jest",
  "Vitest",
  "Machine Learning",
  "Agile",
];

// Escape - Treat spellings as literal text in a regex
function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Matchers - Word boundaries that respect "C++", "C#" and "Node.js"
const MATCHERS = SKILL_SPELLINGS.map((spelling) => ({
  spelling,
  pattern: new RegExp(
    `(?<![A-Za-z0-9+#.])${escapeRegExp(spelling)}(?![A-Za-z0-9+#])`,
    "i",
  ),
}));

// Main Entry - Skills in order of first appearance, deduplicated by key
export function extractSkills(text: string): Skill[] {
  const found: Array<{ spelling: string; index: number }> = [];

  for (const { spelling, pattern } of MATCHERS) {
    const match = pattern.exec(text);
    if (match) found.push({ spelling, index: match.index });
  }

  found.sort((a, b) => a.index - b.index);
  return normalizeSkills(found.map((f) => f.spelling));
}
