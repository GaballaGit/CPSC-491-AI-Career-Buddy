import { extractText, getDocumentProxy } from "unpdf";
import mammoth from "mammoth";

// Error Type - Typed extraction failure
export class ResumeExtractionError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = "ResumeExtractionError";
  }
}

// Format Adjustments - Collapse whitespace
function normalize(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Main Entry - Resume file to plain text
export async function extractResumeText(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const ext = filename.toLowerCase().split(".").pop();
  let raw: string;

  // PDF Branch - unpdf
  if (ext === "pdf") {
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const result = await extractText(pdf, { mergePages: true });
    raw = result.text as string;

  // DOCX Branch - mammoth
  } else if (ext === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    raw = result.value;

  // Rejected - Unsupported extension
  } else {
    throw new ResumeExtractionError(
      "UNSUPPORTED_FILE_TYPE",
      `Unsupported file type: .${ext}`
    );
  }

  const text = normalize(raw);

  // Empty Result - Likely a scanned image
  if (!text) {
    throw new ResumeExtractionError(
      "NO_TEXT_FOUND",
      "No readable text found. The file may be a scanned image."
    );
  }

  return text;
}