/** HTTP controllers for creating and retrieving a user's Career Profile. */
import type { RequestHandler } from 'express';

export const createCareerProfile: RequestHandler = (_req, _res, next) => {
  // TODO: validate the payload and persist the authenticated user's profile.
  next(new Error('Career Profile controller is not implemented'));
};

export const getCareerProfile: RequestHandler = (_req, _res, next) => {
  // TODO: return the authenticated user's profile or an empty/not-found result.
  next(new Error('Career Profile controller is not implemented'));
};
