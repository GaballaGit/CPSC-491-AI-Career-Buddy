/** HTTP controllers for resume upload, processing, and result retrieval. */
import type { RequestHandler } from 'express';
import { extractResumeText } from '../services/resume.js';
import { validateResumeFile } from '../utils/validation.js';

// Upload - Validate, extract, return text
export const uploadResume: RequestHandler = async (req, res, next) => {
  try {
    const file = validateResumeFile(req.file);
    const text = await extractResumeText(file.buffer, file.originalname);

    res.status(200).json({
      success: true,
      data: {
        filename: file.originalname,
        sizeBytes: file.size,
        characters: text.length,
        text,
      },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
};

export const getResume: RequestHandler = (_req, _res, next) => {
  // TODO: return processing status and extracted content.
  next(new Error('Resume controller is not implemented'));
};
