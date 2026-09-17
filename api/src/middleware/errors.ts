/**
 * Final Express error middleware; formats errors into standard CONVENTIONS.md envelope.
 */
import type { ErrorRequestHandler } from 'express';
import { AppError, ResumeExtractionError } from '../errors/index.js';
import type { ApiErrorCode, ApiErrorResponse } from '../types/index.js';

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  let statusCode = 500;
  let errorCode: ApiErrorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'Internal server error';
  let details: Array<{ field: string; message: string }> | undefined;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    errorCode = error.code;
    message = error.message;
    details = error.details;
  } else if (error instanceof ResumeExtractionError) {
    statusCode = error.statusCode;
    errorCode = error.code;
    message = error.message;
  } else if (error instanceof Error) {
    message = error.message;
  }

  const responsePayload: ApiErrorResponse = {
    success: false,
    error: {
      code: errorCode,
      message,
      ...(details && details.length > 0 ? { details } : {}),
    },
  };

  res.status(statusCode).json(responsePayload);
};
