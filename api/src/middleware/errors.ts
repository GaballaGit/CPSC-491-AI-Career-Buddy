/** Final Express error middleware; keeps error responses consistent. */
import type { ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  // TODO: map known errors to status codes and hide internal details in production.
  res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
};
