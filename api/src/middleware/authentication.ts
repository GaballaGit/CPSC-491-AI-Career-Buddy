/** Identifies the current user and protects routes that require authentication. */
import type { RequestHandler } from 'express';

export const requireAuthentication: RequestHandler = (_req, _res, next) => {
  // TODO: verify the session/JWT and attach the authenticated user to the request.
  next(new Error('Authentication middleware is not implemented'));
};
