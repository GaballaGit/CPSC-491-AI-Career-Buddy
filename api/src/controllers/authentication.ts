/** HTTP controllers for signup, login, and authentication-related requests. */
import type { RequestHandler } from 'express';

export const signUp: RequestHandler = (_req, _res, next) => {
  // TODO: validate credentials and create an account.
  next(new Error('Signup controller is not implemented'));
};

export const logIn: RequestHandler = (_req, _res, next) => {
  // TODO: authenticate credentials and return a session/token.
  next(new Error('Login controller is not implemented'));
};
