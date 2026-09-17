/** HTTP controllers for CRUD operations on user-owned portfolio projects. */
import type { RequestHandler } from "express";

export const createProject: RequestHandler = (_req, _res, next) => {
  // TODO: validate and create a project for the authenticated user.
  next(new Error("Project controller is not implemented"));
};

export const getProjects: RequestHandler = (_req, _res, next) => {
  // TODO: return only projects owned by the authenticated user.
  next(new Error("Project controller is not implemented"));
};

export const updateProject: RequestHandler = (_req, _res, next) => {
  // TODO: update a project after checking ownership.
  next(new Error("Project controller is not implemented"));
};

export const deleteProject: RequestHandler = (_req, _res, next) => {
  // TODO: delete a project after checking ownership.
  next(new Error("Project controller is not implemented"));
};
