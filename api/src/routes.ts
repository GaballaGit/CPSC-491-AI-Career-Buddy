/** Route registration lives here so index.ts only bootstraps the server. */
import { Router } from "express";

import { getCurrentUser, signUp } from "./controllers/authentication.js";
import {
  createCareerProfile,
  getCareerProfile,
} from "./controllers/careerProfile.js";
import { getJob, listJobs } from "./controllers/jobs.js";
import {
  createProject,
  deleteProject,
  getProject,
  getProjects,
  updateProject,
} from "./controllers/projects.js";
import { requireAuthentication } from "./middleware/authentication.js";

export const router = Router();

router.post("/auth/signup", signUp);
router.get("/auth/me", requireAuthentication, getCurrentUser);
router.get("/jobs", listJobs);
router.get("/jobs/:id", getJob);
router.post("/career-profile", requireAuthentication, createCareerProfile);
router.get("/career-profile", requireAuthentication, getCareerProfile);

router.post("/projects", requireAuthentication, createProject);
router.get("/projects", requireAuthentication, getProjects);
router.get("/projects/:id", requireAuthentication, getProject);
router.patch("/projects/:id", requireAuthentication, updateProject);
router.delete("/projects/:id", requireAuthentication, deleteProject);
