/** HTTP controllers for CRUD operations on user-owned portfolio projects. */

import type { RequestHandler } from "express";

import { projectRepository } from "../database/projectRepository.js";
import type {
  CreateProjectDto,
  ProjectStatus,
  UpdateProjectDto,
} from "../entities/project.js";
import { AuthenticationError } from "../errors/index.js";

/**
 * Allowed project lifecycle statuses.
 */
const PROJECT_STATUSES: ProjectStatus[] = ["in_progress", "completed"];

/**
 * Send a standardized validation error response.
 */
function sendValidationError(
  res: Parameters<RequestHandler>[1],
  message: string,
  field?: string,
): void {
  res.status(400).json({
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message,
      details: field
        ? [
            {
              field,
              message,
            },
          ]
        : [],
    },
  });
}

/**
 * Validate an array of strings.
 */
function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === "string" && item.trim().length > 0)
  );
}

/**
 * Validate project status.
 */
function isProjectStatus(value: unknown): value is ProjectStatus {
  return (
    typeof value === "string" &&
    PROJECT_STATUSES.includes(value as ProjectStatus)
  );
}

/**
 * Validate a create-project request body.
 */
function validateCreateProject(body: unknown):
  | { valid: true; dto: CreateProjectDto }
  | {
      valid: false;
      message: string;
      field?: string;
    } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {
      valid: false,
      message: "Request body must be a JSON object.",
    };
  }

  const input = body as Record<string, unknown>;

  if (typeof input.title !== "string") {
    return {
      valid: false,
      field: "title",
      message: "Project title is required.",
    };
  }

  const title = input.title.trim();

  if (title.length < 3 || title.length > 100) {
    return {
      valid: false,
      field: "title",
      message: "Project title must be between 3 and 100 characters.",
    };
  }

  if (typeof input.description !== "string") {
    return {
      valid: false,
      field: "description",
      message: "Project description is required.",
    };
  }

  const description = input.description.trim();

  if (description.length === 0) {
    return {
      valid: false,
      field: "description",
      message: "Project description cannot be empty.",
    };
  }

  if (
    input.skills_demonstrated === undefined ||
    !isStringArray(input.skills_demonstrated)
  ) {
    return {
      valid: false,
      field: "skills_demonstrated",
      message: "skills_demonstrated must be an array of non-empty strings.",
    };
  }

  if (input.project_urls !== undefined && !isStringArray(input.project_urls)) {
    return {
      valid: false,
      field: "project_urls",
      message: "project_urls must be an array of non-empty strings.",
    };
  }

  if (input.status !== undefined && !isProjectStatus(input.status)) {
    return {
      valid: false,
      field: "status",
      message: 'Project status must be either "in_progress" or "completed".',
    };
  }

  const dto: CreateProjectDto = {
    title,
    description,
    skills_demonstrated: input.skills_demonstrated.map((skill) => skill.trim()),
  };

  if (input.project_urls !== undefined) {
    dto.project_urls = input.project_urls.map((url) => url.trim());
  }

  if (input.status !== undefined) {
    dto.status = input.status;
  }

  return {
    valid: true,
    dto,
  };
}

/**
 * Validate an update-project request body.
 */
function validateUpdateProject(body: unknown):
  | { valid: true; dto: UpdateProjectDto }
  | {
      valid: false;
      message: string;
      field?: string;
    } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {
      valid: false,
      message: "Request body must be a JSON object.",
    };
  }

  const input = body as Record<string, unknown>;

  const allowedFields = [
    "title",
    "description",
    "skills_demonstrated",
    "project_urls",
    "status",
  ];

  const providedFields = Object.keys(input).filter((key) =>
    allowedFields.includes(key),
  );

  if (providedFields.length === 0) {
    return {
      valid: false,
      message: "At least one project field must be provided for update.",
    };
  }

  const dto: UpdateProjectDto = {};

  if (input.title !== undefined) {
    if (typeof input.title !== "string") {
      return {
        valid: false,
        field: "title",
        message: "Project title must be a string.",
      };
    }

    const title = input.title.trim();

    if (title.length < 3 || title.length > 100) {
      return {
        valid: false,
        field: "title",
        message: "Project title must be between 3 and 100 characters.",
      };
    }

    dto.title = title;
  }

  if (input.description !== undefined) {
    if (typeof input.description !== "string") {
      return {
        valid: false,
        field: "description",
        message: "Project description must be a string.",
      };
    }

    const description = input.description.trim();

    if (description.length === 0) {
      return {
        valid: false,
        field: "description",
        message: "Project description cannot be empty.",
      };
    }

    dto.description = description;
  }

  if (input.skills_demonstrated !== undefined) {
    if (!isStringArray(input.skills_demonstrated)) {
      return {
        valid: false,
        field: "skills_demonstrated",
        message: "skills_demonstrated must be an array of non-empty strings.",
      };
    }

    dto.skills_demonstrated = input.skills_demonstrated.map((skill) =>
      skill.trim(),
    );
  }

  if (input.project_urls !== undefined) {
    if (!isStringArray(input.project_urls)) {
      return {
        valid: false,
        field: "project_urls",
        message: "project_urls must be an array of non-empty strings.",
      };
    }

    dto.project_urls = input.project_urls.map((url) => url.trim());
  }

  if (input.status !== undefined) {
    if (!isProjectStatus(input.status)) {
      return {
        valid: false,
        field: "status",
        message: 'Project status must be either "in_progress" or "completed".',
      };
    }

    dto.status = input.status;
  }

  return {
    valid: true,
    dto,
  };
}

/**
 * Normalize an Express route parameter.
 */
function getRouteId(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Create a project owned by the currently authenticated user.
 */
export const createProject: RequestHandler = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      throw new AuthenticationError("Authentication required.");
    }

    const validation = validateCreateProject(req.body);

    if (!validation.valid) {
      sendValidationError(res, validation.message, validation.field);
      return;
    }

    const project = await projectRepository.create(user.id, validation.dto);

    res.status(201).json({
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Return all projects owned by the currently authenticated user.
 */
export const getProjects: RequestHandler = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      throw new AuthenticationError("Authentication required.");
    }

    const projects = await projectRepository.findByUser(user.id);

    res.status(200).json({
      data: projects,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Return one project only if it belongs to the authenticated user.
 */
export const getProject: RequestHandler = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      throw new AuthenticationError("Authentication required.");
    }

    const id = getRouteId(req.params.id);

    if (!id) {
      sendValidationError(res, "Project ID is required.", "id");
      return;
    }

    const project = await projectRepository.findById(user.id, id);

    if (!project) {
      res.status(404).json({
        success: false,
        error: {
          code: "PROJECT_NOT_FOUND",
          message: "Project not found.",
        },
      });
      return;
    }

    res.status(200).json({
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a project only if it belongs to the currently authenticated user.
 */
export const updateProject: RequestHandler = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      throw new AuthenticationError("Authentication required.");
    }

    const id = getRouteId(req.params.id);

    if (!id) {
      sendValidationError(res, "Project ID is required.", "id");
      return;
    }

    const validation = validateUpdateProject(req.body);

    if (!validation.valid) {
      sendValidationError(res, validation.message, validation.field);
      return;
    }

    const project = await projectRepository.update(user.id, id, validation.dto);

    if (!project) {
      res.status(404).json({
        success: false,
        error: {
          code: "PROJECT_NOT_FOUND",
          message: "Project not found.",
        },
      });
      return;
    }

    res.status(200).json({
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a project only if it belongs to the currently authenticated user.
 */
export const deleteProject: RequestHandler = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      throw new AuthenticationError("Authentication required.");
    }

    const id = getRouteId(req.params.id);

    if (!id) {
      sendValidationError(res, "Project ID is required.", "id");
      return;
    }

    const deleted = await projectRepository.delete(user.id, id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: {
          code: "PROJECT_NOT_FOUND",
          message: "Project not found.",
        },
      });
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
