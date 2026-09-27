/** Upload validation for resume files, matching the Express rules. */
import { HttpError } from "../http.ts";

// Limits - Same as api/src/constants
export const RESUME_ALLOWED_EXTENSIONS = ["pdf", "docx"];
export const RESUME_MAX_BYTES = 5 * 1024 * 1024;

// Upload Check - Presence, extension, size
export function validateResumeFile(file: FormDataEntryValue | null): File {
  if (!(file instanceof File)) {
    throw new HttpError(400, "VALIDATION_ERROR", "No file was uploaded.", [
      { field: "file", message: "A resume file is required." },
    ]);
  }

  const ext = file.name.toLowerCase().split(".").pop() ?? "";

  if (!RESUME_ALLOWED_EXTENSIONS.includes(ext)) {
    throw new HttpError(400, "VALIDATION_ERROR", "Unsupported file type.", [
      {
        field: "file",
        message: `Only ${
          RESUME_ALLOWED_EXTENSIONS.join(" and ")
        } files are accepted.`,
      },
    ]);
  }

  if (file.size > RESUME_MAX_BYTES) {
    throw new HttpError(400, "VALIDATION_ERROR", "File is too large.", [
      {
        field: "file",
        message: `Maximum size is ${RESUME_MAX_BYTES / 1024 / 1024} MB.`,
      },
    ]);
  }

  return file;
}
