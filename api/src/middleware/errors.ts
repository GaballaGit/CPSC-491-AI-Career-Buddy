/**
 * Final Express error middleware; formats errors into standard CONVENTIONS.md envelope.
 */
import type { ErrorRequestHandler } from "express";
import { AppError, ResumeExtractionError } from "../errors/index.js";
import type { ApiErrorCode, ApiErrorResponse } from "../types/index.js";

interface BodyParserError {
  status: number;
  type: string;
  message: string;
}

// express.json() rejects malformed or oversized bodies with a 4xx http-error
// (expose: true); without this they fall through to a generic 500.
function isBodyParserError(error: unknown): error is BodyParserError {
  if (typeof error !== "object" || error === null) return false;
  const { status, type, expose } = error as Record<string, unknown>;
  return (
    expose === true &&
    typeof type === "string" &&
    typeof status === "number" &&
    status >= 400 &&
    status < 500
  );
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  let statusCode = 500;
  let errorCode: ApiErrorCode = "INTERNAL_SERVER_ERROR";
  let message = "Internal server error";
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
  } else if (isBodyParserError(error)) {
    statusCode = error.status;
    errorCode = "INVALID_REQUEST";
    message =
      error.type === "entity.parse.failed"
        ? "Request body must be valid JSON."
        : error.message;
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
