/** HTTP controllers for resume upload, processing, and result retrieval. */
import type { RequestHandler } from 'express';

export const uploadResume: RequestHandler = (_req, _res, next) => {
  // TODO: accept a validated multipart PDF and start processing.
  next(new Error('Resume controller is not implemented'));
};

export const getResume: RequestHandler = (_req, _res, next) => {
  // TODO: return processing status and extracted content.
  next(new Error('Resume controller is not implemented'));
};
