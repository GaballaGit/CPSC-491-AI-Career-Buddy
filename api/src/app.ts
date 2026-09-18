import { ExpressAuth } from "@auth/express";
import express, { type Request, type Response } from "express";

import { authConfig } from "./auth/config.js";
import { errorHandler } from "./middleware/errors.js";
import { router } from "./routes.js";

export const app = express();

app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res.send("Hello, TypeScript + Express!");
});

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

// Account creation remains an API controller; Auth.js owns sign-in, sessions, and callbacks.
app.use("/api", router);
// The frontend's /api proxy rewrites Host to this server, and @auth/express
// builds sign-in URLs and redirects from Host, so without this users land on
// the backend after signing in. Uses the configured AUTH_URL, not a request
// header, so clients can't choose the redirect origin.
app.use("/api/auth", (req, _res, next) => {
  if (process.env.AUTH_URL)
    req.headers.host = new URL(process.env.AUTH_URL).host;
  next();
});
app.use("/api/auth", ExpressAuth(authConfig));
app.use(errorHandler);
