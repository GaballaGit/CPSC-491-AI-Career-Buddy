import express, { type Request, type Response } from 'express';

import { errorHandler } from './middleware/errors.js';
import { router } from './routes.js';

export const app = express();

app.use(express.json());

app.get('/', (_req: Request, res: Response) => {
  res.send('Hello, TypeScript + Express!');
});

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api', router);

app.use(errorHandler);