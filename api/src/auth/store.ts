/** Password storage helpers used by the Auth.js credentials provider. */
import {
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import type { AuthUser } from "../shared.js";

type Account = AuthUser & { passwordHash: string; salt: string };
const accounts = new Map<string, Account>();

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString("hex");
}

export function createAccount(
  email: string,
  password: string,
  name?: string,
): AuthUser {
  const normalizedEmail = email.trim().toLowerCase();
  if (
    [...accounts.values()].some((account) => account.email === normalizedEmail)
  ) {
    throw new Error("An account with that email already exists.");
  }

  const id = randomUUID();
  const salt = randomBytes(16).toString("hex");
  const user = { id, email: normalizedEmail, ...(name ? { name } : {}) };
  accounts.set(id, {
    ...user,
    salt,
    passwordHash: hashPassword(password, salt),
  });
  return user;
}

export function authenticateAccount(
  email: string,
  password: string,
): AuthUser | null {
  const account = [...accounts.values()].find(
    (candidate) => candidate.email === email.trim().toLowerCase(),
  );
  if (!account) return null;

  const expected = Buffer.from(account.passwordHash, "hex");
  const actual = Buffer.from(hashPassword(password, account.salt), "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual)
    ? {
        id: account.id,
        email: account.email,
        ...(account.name ? { name: account.name } : {}),
      }
    : null;
}
