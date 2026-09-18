/** HTTP controllers for creating and retrieving a user's Career Profile. */
import type { RequestHandler } from "express";

import { careerProfileRepository } from "../database/careerProfileRepository.js";
import { AuthenticationError } from "../errors/index.js";
import { validateCreateCareerProfile } from "../utils/validation.js";

export const createCareerProfile: RequestHandler = async (req, res) => {
  if (!req.user) throw new AuthenticationError();

  const dto = validateCreateCareerProfile(req.body);
  const profile = await careerProfileRepository.upsertForUser(req.user.id, dto);

  res.status(201).json({
    success: true,
    data: profile,
    meta: { timestamp: new Date().toISOString() },
  });
};

export const getCareerProfile: RequestHandler = (_req, _res, next) => {
  // TODO: return the authenticated user's profile or an empty/not-found result.
  next(new Error("Career Profile controller is not implemented"));
};
