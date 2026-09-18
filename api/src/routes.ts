/** Route registration lives here so index.ts only bootstraps the server. */

import { Router } from "express";

import {
  createProject,
  deleteProject,
  getProject,
  getProjects,
  updateProject,
} from "./controllers/projects.js";
import { requireAuthentication } from "./middleware/authentication.js";

export const router = Router();

/**
 * Project routes
 * All project operations require authentication.
 */
router.post("/projects", requireAuthentication, createProject);

router.get("/projects", requireAuthentication, getProjects);

router.get("/projects/:id", requireAuthentication, getProject);

router.patch("/projects/:id", requireAuthentication, updateProject);

router.delete("/projects/:id", requireAuthentication, deleteProject);
