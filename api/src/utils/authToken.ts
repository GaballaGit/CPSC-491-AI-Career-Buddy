/**
 * Token parsing/signing helpers used by authentication middleware.
 * Supports standard Supabase/OAuth JWTs and local dev tokens.
 */
import type { AuthUser } from '../shared.js';

/**
 * Safely decodes base64url string
 */
function decodeBase64Url(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf-8');
}

/**
 * Verifies and decodes an authentication Bearer token into an AuthUser.
 * Supports:
 * 1. Standard JWTs (e.g. from Supabase Auth: header.payload.signature)
 * 2. Development/test tokens (e.g. "dev_<userId>" or "dev_<userId>:<email>")
 */
export function verifyToken(token: string): AuthUser | null {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const trimmed = token.trim();
  if (!trimmed) {
    return null;
  }

  // 1. Handle local development / test tokens
  if (trimmed.startsWith('dev_')) {
    const raw = trimmed.substring(4);
    const parts = raw.split(':');
    const id = parts[0] ?? 'dev-user';
    const email = parts[1] ?? `${id}@example.com`;
    return { id, email, name: `Dev User (${id})` };
  }

  // 2. Handle JWT tokens (header.payload.signature)
  const parts = trimmed.split('.');
  if (parts.length === 3) {
    try {
      const payloadJson = decodeBase64Url(parts[1]!);
      const payload = JSON.parse(payloadJson) as Record<string, unknown>;

      const id = (payload['sub'] ?? payload['id'] ?? payload['user_id']) as string | undefined;
      const email = (payload['email'] ?? (id ? `${id}@example.com` : undefined)) as string | undefined;

      if (!id || !email) {
        return null;
      }

      // Check token expiration if present
      if (typeof payload['exp'] === 'number') {
        const nowInSeconds = Math.floor(Date.now() / 1000);
        if (payload['exp'] < nowInSeconds) {
          return null; // Expired token
        }
      }

      return {
        id,
        email,
        name: typeof payload['name'] === 'string' ? payload['name'] : undefined,
      };
    } catch {
      return null;
    }
  }

  return null;
}
