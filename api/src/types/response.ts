/**
 * API Response envelope type definitions
 */
import type { PaginationMeta } from './pagination.js';
import type { ApiErrorPayload } from './error.js';

export interface ApiMeta {
  timestamp: string;
  pagination?: PaginationMeta;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta: ApiMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorPayload;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
