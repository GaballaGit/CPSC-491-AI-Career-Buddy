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
app.use("/api/auth", ExpressAuth(authConfig));
app.use(errorHandler);
