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

// No profile yet is normal for a new user, so it's a 200 with data: null
// rather than a 404 the frontend would have to treat as an error.
export const getCareerProfile: RequestHandler = async (req, res) => {
  if (!req.user) throw new AuthenticationError();

  const profile = await careerProfileRepository.findByUser(req.user.id);

  res.json({
    success: true,
    data: profile,
    meta: { timestamp: new Date().toISOString() },
  });
};
