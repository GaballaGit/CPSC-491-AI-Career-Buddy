/** Resume upload handler: validate, extract, return text. */
import { corsHeaders, fail, HttpError, ok } from "../_shared/http.ts";
import { extractResumeText } from "../_shared/resume/extract.ts";
import { validateResumeFile } from "../_shared/resume/validate.ts";

export async function handleResumeUpload(req: Request): Promise<Response> {
  // Preflight - CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Method Check - POST only
    if (req.method !== "POST") {
      throw new HttpError(
        405,
        "INVALID_REQUEST",
        "Use POST to upload a resume.",
      );
    }

    // Body Parse - Multipart form
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      throw new HttpError(
        400,
        "INVALID_REQUEST",
        "Request must be multipart/form-data with a file field.",
      );
    }

    const file = validateResumeFile(form.get("file"));
    const bytes = new Uint8Array(await file.arrayBuffer());
    const text = await extractResumeText(bytes, file.name);

    return ok({
      filename: file.name,
      sizeBytes: file.size,
      characters: text.length,
      text,
    });
  } catch (error) {
    return fail(error);
  }
}
