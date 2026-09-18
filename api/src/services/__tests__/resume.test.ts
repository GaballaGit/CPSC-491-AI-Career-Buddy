/** Unit tests for resume text extraction. */
import { describe, expect, it } from 'vitest';
import { extractResumeText } from '../resume.js';

describe('extractResumeText', () => {
  it('rejects an unsupported file type', async () => {
    await expect(
      extractResumeText(Buffer.from('hello'), 'notes.txt'),
    ).rejects.toThrow(/Unsupported file type/);
  });

  it('rejects a file with no extension', async () => {
    await expect(
      extractResumeText(Buffer.from('hello'), 'resume'),
    ).rejects.toThrow(/Unsupported file type/);
  });
});
