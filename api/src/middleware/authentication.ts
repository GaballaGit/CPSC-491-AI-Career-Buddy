/**
 * Identifies the current user and protects routes that require authentication.
 * Follows conventions defined in CONVENTIONS.md
 */
import type { RequestHandler } from 'express';

import { AuthenticationError } from '../errors/index.js';
import type { AuthUser } from '../shared.js';
import { verifyToken } from '../utils/authToken.js';

/**
 * Augment Express Request interface with the authenticated user context
 */
declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

/**
 * Authentication middleware that enforces a valid Bearer token and injects req.user.
 */
export const requireAuthentication: RequestHandler = (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(
      new AuthenticationError(
        'Missing Authorization header. Expected Bearer token.',
      ),
    );
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(
      new AuthenticationError(
        'Invalid Authorization format. Expected: Bearer <token>.',
      ),
    );
  }

  const user = verifyToken(token);

  if (!user) {
    return next(
      new AuthenticationError('Invalid or expired authentication token.'),
    );
  }

  // Attach verified user context to request
  req.user = user;
  next();
};