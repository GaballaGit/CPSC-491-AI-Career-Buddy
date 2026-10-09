/** Project input validation; no HTTP or persistence dependencies. */
import type {
  CreateProjectDto,
  ProjectStatus,
  UpdateProjectDto,
} from "./project.js";
import { normalizeSkills } from "../utils/skills.js";

type ProjectValidation<T> =
  { valid: true; dto: T } | { valid: false; message: string; field?: string };

const PROJECT_STATUSES: ProjectStatus[] = ["in_progress", "completed"];
const PROJECT_FIELDS = [
  "title",
  "description",
  "skills_demonstrated",
  "project_urls",
  "status",
];

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === "string" && item.trim().length > 0)
  );
}

function isProjectStatus(value: unknown): value is ProjectStatus {
  return (
    typeof value === "string" &&
    PROJECT_STATUSES.includes(value as ProjectStatus)
  );
}

function invalid(message: string, field?: string): ProjectValidation<never> {
  return field === undefined
    ? { valid: false, message }
    : { valid: false, message, field };
}

function validateProject(
  body: unknown,
  mode: "create",
): ProjectValidation<CreateProjectDto>;
function validateProject(
  body: unknown,
  mode: "update",
): ProjectValidation<UpdateProjectDto>;
function validateProject(
  body: unknown,
  mode: "create" | "update",
): ProjectValidation<UpdateProjectDto> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return invalid("Request body must be a JSON object.");
  }
  const input = body as Record<string, unknown>;
  const creating = mode === "create";

  if (
    !creating &&
    !Object.keys(input).some((key) => PROJECT_FIELDS.includes(key))
  ) {
    return invalid("At least one project field must be provided for update.");
  }

  const dto: UpdateProjectDto = {};
  // Check in this order: callers expose only the first validation failure.
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
      return invalid("Project description cannot be empty.", "description");
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
    dto.skills_demonstrated = normalizeSkills(input.skills_demonstrated).map(
      (skill) => skill.name,
    );
  }

  if (input.project_urls !== undefined) {
    if (!isStringArray(input.project_urls)) {
      return invalid(
        "project_urls must be an array of non-empty strings.",
        "project_urls",
      );
    }
    dto.project_urls = input.project_urls.map((url) => url.trim());
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
): ProjectValidation<CreateProjectDto> {
  return validateProject(body, "create");
}

export function validateUpdateProject(
  body: unknown,
): ProjectValidation<UpdateProjectDto> {
  return validateProject(body, "update");
}
