import { throws } from "node:assert";

import { HttpError } from "../http.ts";
import { checkResumeSignature } from "./validate.ts";

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
