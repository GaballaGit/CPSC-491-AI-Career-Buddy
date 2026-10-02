/** HTTP controllers for listing jobs and retrieving job details. */
import type { RequestHandler } from "express";
import type { Job } from "../entities/job.js";
import type { JobSkillMatch } from "../services/jobMatching.js";
import { careerProfileRepository } from "../database/careerProfileRepository.js";
import { jobRepository } from "../database/jobRepository.js";
import { NotFoundError, ValidationError } from "../errors/index.js";
import { computeJobSkillMatch } from "../services/jobMatching.js";

type JobMatchStatus = "signed_out" | "profile_missing" | "available";

type JobWithMatch = Job & { match?: JobSkillMatch };

async function addMatchData(jobs: Job[], userId?: string) {
  if (!userId) {
    return { jobs, status: "signed_out" as JobMatchStatus };
  }

  const profile = await careerProfileRepository.findByUser(userId);
  if (!profile) {
    return { jobs, status: "profile_missing" as JobMatchStatus };
  }

  return {
    jobs: jobs.map((job): JobWithMatch => ({
      ...job,
      match: computeJobSkillMatch({
        requiredSkills: job.required_skills,
        profileSkills: profile.skills,
      }),
    })),
    status: "available" as JobMatchStatus,
  };
}

export const listJobs: RequestHandler = async (req, res) => {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));
  if (!Number.isInteger(page) || !Number.isInteger(limit)) {
    throw new ValidationError("page and limit must be integers");
  }

  const skill =
    typeof req.query.skill === "string" ? req.query.skill : undefined;
  const category =
    typeof req.query.category === "string" ? req.query.category : undefined;
  const jobs = category
    ? jobRepository.findByCategory(category)
    : skill
      ? jobRepository.findByRequiredSkill(skill)
      : jobRepository.findAll();
  const start = (page - 1) * limit;
  const { jobs: matchedJobs, status } = await addMatchData(
    jobs.slice(start, start + limit),
    req.user?.id,
  );

  res.json({
    success: true,
    data: matchedJobs,
    meta: {
      timestamp: new Date().toISOString(),
      matching: { status },
      pagination: {
        page,
        limit,
        total: jobs.length,
        totalPages: Math.ceil(jobs.length / limit),
      },
    },
  });
};

export const getJob: RequestHandler = async (req, res) => {
  const id = req.params.id;
  if (typeof id !== "string") throw new ValidationError("job id is required");
  const job = jobRepository.findById(id);
  if (!job) throw new NotFoundError("Job not found.");

  const { jobs: matchedJobs, status } = await addMatchData([job], req.user?.id);

  res.json({
    success: true,
    data: matchedJobs[0],
    meta: { timestamp: new Date().toISOString(), matching: { status } },
  });
};
