/** Verifies Supabase Auth bearer tokens and protects authenticated routes. */
import type { RequestHandler } from "express";

import { getUserFromAccessToken } from "../auth/supabase.js";
import { AuthenticationError } from "../errors/index.js";
import type { AuthUser } from "../shared.js";

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser;
  }
}

function bearerToken(header: string | undefined): string | null {
  if (!header) return null;

  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;

  return token;
}

export const requireAuthentication: RequestHandler = async (
  req,
  _res,
  next,
) => {
  try {
    const token = bearerToken(req.header("authorization"));
    if (!token) return next(new AuthenticationError());

    const user = await getUserFromAccessToken(token);
    if (!user?.id || !user.email) return next(new AuthenticationError());

    req.user = {
      id: user.id,
      email: user.email,
      ...(user.user_metadata?.name && typeof user.user_metadata.name === "string"
        ? { name: user.user_metadata.name }
        : {}),
    };

    next();
  } catch (error) {
    next(error);
  }
};
