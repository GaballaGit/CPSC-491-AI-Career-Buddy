/** Route registration lives here so index.ts only bootstraps the server. */
import { Router } from 'express';
import multer from 'multer';
import { uploadResume } from './controllers/resumes.js';

export const router = Router();

// Resume Upload - In memory until KAN-18 settles the database
const upload = multer({ storage: multer.memoryStorage() });

router.post('/resumes', upload.single('file'), uploadResume);

// TODO: register auth, Career Profile, job, and project routes here.
