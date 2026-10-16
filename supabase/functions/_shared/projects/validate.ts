import type {
  CreateProjectInput,
  ProjectStatus,
  UpdateProjectInput,
} from "./types.ts";

interface Skill {
  name: string;
  key: string;
}

type ProjectValidation<T> =
  | { valid: true; dto: T }
  | { valid: false; message: string; field?: string };

const PROJECT_STATUSES: ProjectStatus[] = ["in_progress", "completed"];

const PROJECT_FIELDS = [
  "title",
  "description",
  "skills_demonstrated",
  "project_urls",
  "status",
];

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

  for (const alias of aliases) {
    CANONICAL_BY_SPELLING.set(alias, name);
  }
}

function normalizeSkill(input: string): Skill | null {
  const collapsed = input.trim().replace(/\s+/g, " ");

  if (collapsed === "") {
    return null;
  }

  const name = CANONICAL_BY_SPELLING.get(collapsed.toLowerCase()) ?? collapsed;

  return {
    name,
    key: name.toLowerCase(),
  };
}

function normalizeSkills(inputs: readonly string[]): Skill[] {
  const seen = new Set<string>();
  const skills: Skill[] = [];

  for (const input of inputs) {
    const skill = normalizeSkill(input);

    if (!skill || seen.has(skill.key)) {
      continue;
    }

    seen.add(skill.key);
    skills.push(skill);
  }

  return skills;
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) => typeof item === "string" && item.trim().length > 0,
    )
  );
}

function isProjectStatus(value: unknown): value is ProjectStatus {
  return (
    typeof value === "string" &&
    PROJECT_STATUSES.includes(value as ProjectStatus)
  );
}

function invalid(
  message: string,
  field?: string,
): ProjectValidation<never> {
  return field === undefined
    ? { valid: false, message }
    : { valid: false, message, field };
}

function validateProject(
  body: unknown,
  mode: "create",
): ProjectValidation<CreateProjectInput>;
function validateProject(
  body: unknown,
  mode: "update",
): ProjectValidation<UpdateProjectInput>;
function validateProject(
  body: unknown,
  mode: "create" | "update",
): ProjectValidation<UpdateProjectInput> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return invalid("Request body must be a JSON object.");
  }

  const input = body as Record<string, unknown>;
  const creating = mode === "create";

  if (
    !creating &&
    !Object.keys(input).some((key) => PROJECT_FIELDS.includes(key))
  ) {
    return invalid(
      "At least one project field must be provided for update.",
    );
  }

  const dto: UpdateProjectInput = {};

  if (creating || input.title !== undefined) {
    if (typeof input.title !== "string") {
      return invalid(
        creating
          ? "Project title is required."
          : "Project title must be a string.",
        "title",
      );
    }

    const title = input.title.trim();

    if (title.length < 3 || title.length > 100) {
      return invalid(
        "Project title must be between 3 and 100 characters.",
        "title",
      );
    }

    dto.title = title;
  }

  if (creating || input.description !== undefined) {
    if (typeof input.description !== "string") {
      return invalid(
        creating
          ? "Project description is required."
          : "Project description must be a string.",
        "description",
      );
    }

    const description = input.description.trim();

    if (description.length === 0) {
      return invalid(
        "Project description cannot be empty.",
        "description",
      );
    }

    dto.description = description;
  }

  if (creating || input.skills_demonstrated !== undefined) {
    if (!isStringArray(input.skills_demonstrated)) {
      return invalid(
        "skills_demonstrated must be an array of non-empty strings.",
        "skills_demonstrated",
      );
    }

    dto.skills_demonstrated = normalizeSkills(
      input.skills_demonstrated,
    ).map((skill) => skill.name);
  }

  if (input.project_urls !== undefined) {
    if (!isStringArray(input.project_urls)) {
      return invalid(
        "project_urls must be an array of non-empty strings.",
        "project_urls",
      );
    }

    const projectUrls = input.project_urls.map((url) => url.trim());

    for (const projectUrl of projectUrls) {
      try {
        const parsed = new URL(projectUrl);

        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          return invalid(
            "project_urls must contain valid HTTP or HTTPS URLs.",
            "project_urls",
          );
        }
      } catch {
        return invalid(
          "project_urls must contain valid HTTP or HTTPS URLs.",
          "project_urls",
        );
      }
    }

    dto.project_urls = projectUrls;
  }

  if (input.status !== undefined) {
    if (!isProjectStatus(input.status)) {
      return invalid(
        'Project status must be either "in_progress" or "completed".',
        "status",
      );
    }

    dto.status = input.status;
  }

  return { valid: true, dto };
}

export function validateCreateProject(
  body: unknown,
): ProjectValidation<CreateProjectInput> {
  return validateProject(body, "create");
}

export function validateUpdateProject(
  body: unknown,
): ProjectValidation<UpdateProjectInput> {
  return validateProject(body, "update");
}
