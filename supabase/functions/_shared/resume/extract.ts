/** Resume text extraction for Edge Functions: PDF or DOCX to plain text. */
import { Buffer } from "node:buffer";
import mammoth from "npm:mammoth@~1.12.3";
import { extractText, getDocumentProxy } from "npm:unpdf@^1.8.1";

import { HttpError } from "../http.ts";

// Format Adjustments - Collapse whitespace
export function normalize(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Main Entry - Resume file to plain text
export async function extractResumeText(
  bytes: Uint8Array,
  filename: string,
): Promise<string> {
  const ext = filename.toLowerCase().split(".").pop();
  let raw: string;

  // PDF Branch - unpdf
  if (ext === "pdf") {
    const pdf = await getDocumentProxy(bytes);
    const result = await extractText(pdf, { mergePages: true });
    raw = result.text as string;

    // DOCX Branch - mammoth (Buffer, not arrayBuffer, in Deno)
  } else if (ext === "docx") {
    const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
    raw = result.value;

    // Rejected - Unsupported extension
  } else {
    throw new HttpError(
      422,
      "UNSUPPORTED_FILE_TYPE",
      `Unsupported file type: .${ext}`,
    );
  }

  const text = normalize(raw);

  // Empty Result - Likely a scanned image
  if (!text) {
    throw new HttpError(
      422,
      "NO_TEXT_FOUND",
      "No readable text found. The file may be a scanned image.",
    );
  }

  return text;
}
