# Resume test fixtures

All content is fictional. Never add a real resume here; the repo is public.

| File                    | What it represents                 | Expected result                      |
| ----------------------- | ---------------------------------- | ------------------------------------ |
| `sample_resume.pdf`     | Standard one-column resume         | Text and skills extracted            |
| `sample_resume.docx`    | Same resume as a Word file         | Text and skills extracted            |
| `sample_resume.txt`     | Unsupported file type              | 400 `VALIDATION_ERROR`               |
| `two_column_resume.pdf` | Two-column layout (skills sidebar) | Text and skills extracted            |
| `long_resume.pdf`       | Four-page resume                   | Text extracted, under the 5 MB limit |
| `no_skills_resume.docx` | Real text with no known skills     | 200 with an empty skill list         |
| `scanned_resume.pdf`    | Image-only page with no text layer | 422 `NO_TEXT_FOUND`                  |

Corrupt, empty, and renamed files are built inside `resume/handler_test.ts`
instead of being stored here.
