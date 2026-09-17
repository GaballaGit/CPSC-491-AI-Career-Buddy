/** Request validation helpers shared by controllers. */
import { RESUME_ALLOWED_EXTENSIONS, RESUME_MAX_BYTES } from '../constants/index.js';
import { ValidationError } from '../errors/index.js';

// Resume Upload - Reject bad files before extraction runs
export function validateResumeFile(file?: Express.Multer.File): Express.Multer.File {
  if (!file) {
    throw new ValidationError('No file was uploaded.', [
      { field: 'file', message: 'A resume file is required.' },
    ]);
  }

  const ext = file.originalname.toLowerCase().split('.').pop() ?? '';

  if (!RESUME_ALLOWED_EXTENSIONS.includes(ext)) {
    throw new ValidationError('Unsupported file type.', [
      {
        field: 'file',
        message: `Only ${RESUME_ALLOWED_EXTENSIONS.join(' and ')} files are accepted.`,
      },
    ]);
  }

  if (file.size > RESUME_MAX_BYTES) {
    throw new ValidationError('File is too large.', [
      { field: 'file', message: `Maximum size is ${RESUME_MAX_BYTES / 1024 / 1024} MB.` },
    ]);
  }

  return file;
}
