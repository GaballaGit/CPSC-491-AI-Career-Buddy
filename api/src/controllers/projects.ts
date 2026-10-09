/** HTTP controllers for CRUD operations on user-owned portfolio projects. */

import type { RequestHandler } from "express";

import { projectRepository } from "../database/projectRepository.js";
import {
  validateCreateProject,
  validateUpdateProject,
} from "../entities/projectValidation.js";
import { AuthenticationError } from "../errors/index.js";

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
