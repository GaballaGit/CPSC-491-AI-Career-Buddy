/** Shared application errors and error-handling helpers. */

export class NotImplementedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotImplementedError';
  }
}

// Resume Extraction - Typed failure with a machine-readable code
export class ResumeExtractionError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ResumeExtractionError';
  }
}
