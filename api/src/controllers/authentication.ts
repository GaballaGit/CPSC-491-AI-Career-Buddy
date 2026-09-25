/** HTTP controller for authentication-related requests. */
import type { RequestHandler } from "express";

import { AuthenticationError, AppError } from "../errors/index.js";

export const signUp: RequestHandler = (_req, _res, next) => {
  next(
    new AppError(
      "Sign up is handled by Supabase Auth. Use the frontend Supabase client instead.",
      410,
      "RESOURCE_NOT_FOUND",
    ),
  );
};

export const getCurrentUser: RequestHandler = (req, res, next) => {
  if (!req.user) return next(new AuthenticationError());
  res.json({ success: true, data: { user: req.user } });
};
