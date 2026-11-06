import { throws } from "node:assert";

import { HttpError } from "../http.ts";
import {
  checkResumeRequestSize,
  checkResumeSignature,
  RESUME_MAX_REQUEST_BYTES,
} from "./validate.ts";

const fixtures = new URL("./fixtures/", import.meta.url);
const bytes = (text: string) => new TextEncoder().encode(text);

Deno.test("real PDF and DOCX fixtures pass the signature check", async () => {
  checkResumeSignature(
    await Deno.readFile(new URL("sample_resume.pdf", fixtures)),
    "resume.pdf",
  );
  checkResumeSignature(
    await Deno.readFile(new URL("sample_resume.docx", fixtures)),
    "resume.docx",
  );
});

Deno.test("PDF signature needs all four bytes at the start", () => {
  for (const text of ["", "%", "%PD", "%PDX", " %PDF"]) {
    throws(() => checkResumeSignature(bytes(text), "r.pdf"), HttpError, text);
  }
  checkResumeSignature(bytes("%PDF"), "r.pdf");
});

Deno.test("DOCX signature needs the full ZIP header", () => {
  for (const text of ["", "P", "PK", "PK\x03", "PK\x05\x06"]) {
    throws(() => checkResumeSignature(bytes(text), "r.docx"), HttpError);
  }
  checkResumeSignature(bytes("PK\x03\x04"), "r.docx");
});

Deno.test("unknown extensions never pass the signature check", () => {
  throws(() => checkResumeSignature(bytes("%PDF"), "r.txt"), HttpError);
});

// Declared Size - POST with an optional Content-Length
const declared = (length: number | null) =>
  new Request("http://localhost/resume", {
    method: "POST",
    headers: length === null ? {} : { "content-length": String(length) },
  });

Deno.test("size precheck allows up to the request limit", () => {
  checkResumeRequestSize(declared(RESUME_MAX_REQUEST_BYTES));
  checkResumeRequestSize(declared(null));
});

Deno.test("size precheck rejects one byte over the request limit", () => {
  throws(
    () => checkResumeRequestSize(declared(RESUME_MAX_REQUEST_BYTES + 1)),
    HttpError,
  );
});
