import { strictEqual as assertEquals } from "node:assert";

import { handleResumeUpload } from "./handler.ts";

const fixtures = new URL("../_shared/resume/fixtures/", import.meta.url);

// Helper - Multipart upload request
async function upload(
  name: string,
  bytes?: Uint8Array<ArrayBuffer>,
): Promise<Response> {
  const form = new FormData();
  const data = bytes ?? await Deno.readFile(new URL(name, fixtures));
  form.append("file", new File([data], name));
  return handleResumeUpload(
    new Request("http://localhost/resume", { method: "POST", body: form }),
  );
}

Deno.test("PDF upload returns extracted text", async () => {
  const res = await upload("sample_resume.pdf");
  const body = await res.json();
  assertEquals(res.status, 200);
  assertEquals(body.success, true);
  assertEquals(body.data.text.startsWith("Alex Rivera"), true);
});

Deno.test("DOCX upload returns extracted text", async () => {
  const res = await upload("sample_resume.docx");
  const body = await res.json();
  assertEquals(res.status, 200);
  assertEquals(body.data.text.startsWith("Alex Rivera"), true);
});

Deno.test("TXT upload is rejected with VALIDATION_ERROR", async () => {
  const res = await upload("sample_resume.txt");
  const body = await res.json();
  assertEquals(res.status, 400);
  assertEquals(body.error.code, "VALIDATION_ERROR");
  assertEquals(body.error.details[0].field, "file");
});

Deno.test("Oversized file is rejected", async () => {
  const res = await upload("big.pdf", new Uint8Array(5 * 1024 * 1024 + 1));
  const body = await res.json();
  assertEquals(res.status, 400);
  assertEquals(body.error.message, "File is too large.");
});

Deno.test("Missing file is rejected", async () => {
  const res = await handleResumeUpload(
    new Request("http://localhost/resume", {
      method: "POST",
      body: new FormData(),
    }),
  );
  const body = await res.json();
  assertEquals(res.status, 400);
  assertEquals(body.error.code, "VALIDATION_ERROR");
});

Deno.test("GET is rejected", async () => {
  const res = await handleResumeUpload(new Request("http://localhost/resume"));
  assertEquals(res.status, 405);
});

Deno.test("OPTIONS returns CORS headers", async () => {
  const res = await handleResumeUpload(
    new Request("http://localhost/resume", { method: "OPTIONS" }),
  );
  await res.body?.cancel();
  assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*");
});
