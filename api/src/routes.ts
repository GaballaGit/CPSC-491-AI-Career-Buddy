/** Route registration lives here so index.ts only bootstraps the server. */
import { Router } from "express";
import multer from "multer";

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
import { uploadResume } from "./controllers/resumes.js";
import { requireAuthentication } from "./middleware/authentication.js";

export const router = Router();

// Resume Upload - In memory until KAN-18 settles the database
const upload = multer({ storage: multer.memoryStorage() });

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

router.post("/resumes", upload.single("file"), uploadResume);
