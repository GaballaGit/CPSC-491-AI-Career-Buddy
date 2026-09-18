/** HTTP controller for account creation and authentication-related requests. */
import type { RequestHandler } from "express";
import validator from "validator";

import {
  AppError,
  AuthenticationError,
  ValidationError,
} from "../errors/index.js";
import { createAccount } from "../auth/store.js";

function credentials(req: Parameters<RequestHandler>[0]) {
  const { email, password, name } = req.body ?? {};
  if (
    typeof email !== "string" ||
    !validator.isEmail(email) ||
    typeof password !== "string" ||
    !validator.isLength(password, { min: 8 })
  ) {
    throw new ValidationError(
      "A valid email and password of at least 8 characters are required.",
    );
  }
  return {
    email,
    password,
    name: typeof name === "string" ? name.trim() : undefined,
  };
}

export const signUp: RequestHandler = (req, res, next) => {
  try {
    const { email, password, name } = credentials(req);
    const user = createAccount(email, password, name);
    res.status(201).json({ success: true, data: { user } });
  } catch (error) {
    next(
      error instanceof Error && error.message.includes("already exists")
        ? new AppError(error.message, 409, "VALIDATION_ERROR")
        : error,
    );
  }
};

export const getCurrentUser: RequestHandler = (req, res, next) => {
  if (!req.user) return next(new AuthenticationError());
  res.json({ success: true, data: { user: req.user } });
};
