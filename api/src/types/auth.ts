/**
 * Authentication type definitions
 */

export interface AuthUser {
  id: string; // UUID v4
  email: string;
  name?: string;
}
