/** Integration tests for resume storage. Needs a configured .env. */
import { describe, expect, it } from 'vitest';
import { getResumeById, saveResume } from '../resumeRepository.js';

describe('resumeRepository', () => {
  it('saves a resume and reads it back', async () => {
    const saved = await saveResume({
      filename: 'test-resume.pdf',
      fileSize: 1234,
      extractedText: 'William Wang\nSoftware Engineer',
    });

    expect(saved.id).toBeTruthy();
    expect(saved.filename).toBe('test-resume.pdf');
    expect(saved.characters).toBe(30);

    const found = await getResumeById(saved.id);
    expect(found?.extractedText).toBe('William Wang\nSoftware Engineer');
  });

  it('returns null for an id that does not exist', async () => {
    const found = await getResumeById('00000000-0000-0000-0000-000000000000');
    expect(found).toBeNull();
  });
});
