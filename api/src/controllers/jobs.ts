/** HTTP controllers for listing jobs and retrieving job details. */
import type { RequestHandler } from "express";
import { NotFoundError, ValidationError } from "../errors/index.js";
import { jobRepository } from "../database/jobRepository.js";

export const listJobs: RequestHandler = (req, res) => {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));
  if (!Number.isInteger(page) || !Number.isInteger(limit)) {
    throw new ValidationError("page and limit must be integers");
  }

  const skill = typeof req.query.skill === "string" ? req.query.skill : undefined;
  const category = typeof req.query.category === "string" ? req.query.category : undefined;
  const jobs = category
    ? jobRepository.findByCategory(category)
    : skill
      ? jobRepository.findByRequiredSkill(skill)
      : jobRepository.findAll();
  const start = (page - 1) * limit;

  res.json({
    success: true,
    data: jobs.slice(start, start + limit),
    meta: {
      timestamp: new Date().toISOString(),
      pagination: { page, limit, total: jobs.length, totalPages: Math.ceil(jobs.length / limit) },
    },
  });
};

export const getJob: RequestHandler = (req, res) => {
  const id = req.params.id;
  if (typeof id !== "string") throw new ValidationError("job id is required");
  const job = jobRepository.findById(id);
  if (!job) throw new NotFoundError("Job not found.");

  res.json({ success: true, data: job, meta: { timestamp: new Date().toISOString() } });
};
