/**
 * API Error payload type definitions
 */

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

export type ApiErrorCode =
  | 'INVALID_REQUEST'
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_REQUIRED'
  | 'PERMISSION_DENIED'
  | 'RESOURCE_NOT_FOUND'
  | 'CONFLICT'
  | 'UNPROCESSABLE_ENTITY'
  | 'RESUME_EXTRACTION_FAILED'
  | 'UNSUPPORTED_FILE_TYPE'
  | 'NO_TEXT_FOUND'
  | 'INTERNAL_SERVER_ERROR';

export interface ApiErrorPayload {
  code: ApiErrorCode;
  message: string;
  details?: ValidationErrorDetail[];
}
