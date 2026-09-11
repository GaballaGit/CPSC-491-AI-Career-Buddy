/**
 * CareerLM Shared Types
 * Defined according to CONVENTIONS.md
 */

/**
 * Standard Authenticated User context extracted from JWT Bearer token
 */
export interface AuthUser {
  id: string; // UUID v4
  email: string;
  name?: string;
}

/**
 * Standard Pagination Metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

/**
 * Standard API Metadata
 */
export interface ApiMeta {
  timestamp: string;
  pagination?: PaginationMeta;
  [key: string]: unknown;
}

/**
 * Standard API Success Envelope
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta: ApiMeta;
}

/**
 * Field-level validation error detail
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
}

/**
 * Standard API Error Detail
 */
export interface ApiErrorPayload {
  code:
    | 'INVALID_REQUEST'
    | 'VALIDATION_ERROR'
    | 'AUTHENTICATION_REQUIRED'
    | 'PERMISSION_DENIED'
    | 'RESOURCE_NOT_FOUND'
    | 'CONFLICT'
    | 'UNPROCESSABLE_ENTITY'
    | 'INTERNAL_SERVER_ERROR'
    | string;
  message: string;
  details?: ValidationErrorDetail[];
}

/**
 * Standard API Error Envelope
 */
export interface ApiErrorResponse {
  success: false;
  error: ApiErrorPayload;
}

/**
 * Union API Response type
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
