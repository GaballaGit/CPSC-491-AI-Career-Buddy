/** Route registration lives here so index.ts only bootstraps the server. */
import { Router } from "express";

import { getCurrentUser, signUp } from "./controllers/authentication.js";
import { getJob, listJobs } from "./controllers/jobs.js";
import { requireAuthentication } from "./middleware/authentication.js";

export const router = Router();

router.post("/auth/signup", signUp);
router.get("/auth/me", requireAuthentication, getCurrentUser);
router.get("/jobs", listJobs);
router.get("/jobs/:id", getJob);
