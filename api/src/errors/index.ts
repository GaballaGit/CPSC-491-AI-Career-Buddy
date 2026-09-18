/** Shared application errors and error-handling helpers. */
import type { ApiErrorCode } from "../types/index.js";

export class NotImplementedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotImplementedError";
  }
}

// Resume Extraction - Typed failure with a machine-readable code
export class ResumeExtractionError extends Error {
  public readonly code = "RESUME_EXTRACTION_FAILED";
  public readonly statusCode = 422;

  constructor(message = "Resume extraction failed") {
    super(message);
    this.name = "ResumeExtractionError";
  }
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ApiErrorCode;
  public readonly details?: Array<{ field: string; message: string }>;

  constructor(
    message: string,
    statusCode = 500,
    code: ApiErrorCode = "INTERNAL_SERVER_ERROR",
    details?: Array<{ field: string; message: string }>,
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class AuthenticationError extends AppError {
  constructor(
    message = "Authentication required. Please provide a valid Bearer token.",
  ) {
    super(message, 401, "AUTHENTICATION_REQUIRED");
    this.name = "AuthenticationError";
  }
}

export class ForbiddenError extends AppError {
  constructor(
    message = "You do not have permission to access or modify this resource.",
  ) {
    super(message, 403, "PERMISSION_DENIED");
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Requested resource was not found.") {
    super(message, 404, "RESOURCE_NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    details?: Array<{ field: string; message: string }>,
  ) {
    super(message, 400, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}
