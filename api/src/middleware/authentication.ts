/** Loads the Auth.js session and protects routes that require authentication. */
import type { RequestHandler } from "express";
import { getSession } from "@auth/express";

import { authConfig } from "../auth/config.js";
import { AuthenticationError } from "../errors/index.js";
import type { AuthUser } from "../shared.js";

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser;
  }
}

export const requireAuthentication: RequestHandler = async (
  req,
  _res,
  next,
) => {
  try {
    const session = await getSession(req, authConfig);
    const user = session?.user;
    if (!user?.id || !user.email) {
      return next(new AuthenticationError());
    }

    req.user = {
      id: user.id,
      email: user.email,
      ...(user.name ? { name: user.name } : {}),
    };
    next();
  } catch (error) {
    next(error);
  }
};
