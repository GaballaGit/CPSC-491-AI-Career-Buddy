/** HTTP controllers for listing jobs and retrieving job details. */
import type { RequestHandler } from 'express';

export const listJobs: RequestHandler = (_req, _res, next) => {
  // TODO: parse filters/pagination and return jobs with required skills.
  next(new Error('Job controller is not implemented'));
};

export const getJob: RequestHandler = (_req, _res, next) => {
  // TODO: retrieve a job by ID and handle missing jobs.
  next(new Error('Job controller is not implemented'));
};
