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
  public readonly statusCode = 422;
  public readonly code: ApiErrorCode;

  constructor(message?: string);
  constructor(code: ApiErrorCode, message?: string);
  constructor(
    codeOrMessage: ApiErrorCode | string = "RESUME_EXTRACTION_FAILED",
    message?: string,
  ) {
    const knownCodes: ApiErrorCode[] = [
      "INVALID_REQUEST",
      "VALIDATION_ERROR",
      "AUTHENTICATION_REQUIRED",
      "PERMISSION_DENIED",
      "RESOURCE_NOT_FOUND",
      "CONFLICT",
      "UNPROCESSABLE_ENTITY",
      "RESUME_EXTRACTION_FAILED",
      "UNSUPPORTED_FILE_TYPE",
      "NO_TEXT_FOUND",
      "INTERNAL_SERVER_ERROR",
    ];

    const isCode = knownCodes.includes(codeOrMessage as ApiErrorCode);

    super(isCode ? (message ?? "Resume extraction failed") : codeOrMessage);

    this.name = "ResumeExtractionError";

    this.code = isCode
      ? (codeOrMessage as ApiErrorCode)
      : "RESUME_EXTRACTION_FAILED";
  }
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ApiErrorCode;
  public readonly details?: Array<{
    field: string;
    message: string;
  }>;

  constructor(
    message: string,
    statusCode = 500,
    code: ApiErrorCode = "INTERNAL_SERVER_ERROR",
    details?: Array<{
      field: string;
      message: string;
    }>,
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
    details?: Array<{
      field: string;
      message: string;
    }>,
  ) {
    super(message, 400, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}
