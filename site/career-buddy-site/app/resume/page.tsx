"use client";

import { useRef, useState } from "react";
import type { ResumeUploadData, ResumeUploadResponse } from "./types";

// Display - Turn raw bytes into something readable
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// Stats - Simple counts shown under the extracted text
function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export default function ResumePage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<ResumeUploadData | null>(null);
  const [error, setError] = useState<string>("");

  // Selection - Reset previous output whenever a new file is picked
  function selectFile(next: File | null) {
    setFile(next);
    setResult(null);
    setError("");
  }

  // Upload - Send the file and keep either the text or the error message
  async function handleUpload() {
    if (!file) return;

    setUploading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/resumes", {
        method: "POST",
        body: formData,
      });
      const body: ResumeUploadResponse = await response.json();

      if (body.success) {
        setResult(body.data);
      } else {
        setError(body.error.details?.[0]?.message ?? body.error.message);
      }
    } catch {
      setError("Could not reach the server. Make sure the API is running.");
    } finally {
      setUploading(false);
    }
  }

  // Copy - Put the extracted text on the clipboard
  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const stats = result
    ? [
        { label: "Characters", value: result.characters.toLocaleString() },
        { label: "Words", value: countWords(result.text).toLocaleString() },
        { label: "File size", value: formatBytes(result.sizeBytes) },
        {
          label: "Format",
          value: result.filename.split(".").pop()?.toUpperCase() ?? "—",
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      {/* Top Bar - Product name and section */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-6 py-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
            C
          </span>
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            CareerLM
          </span>
          <span className="h-4 w-px bg-zinc-300 dark:bg-zinc-700" />
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            Resume Intelligence
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
          Step 1 of 3
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Upload your resume
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          We read the text out of your{" "}
          <code className="rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 font-mono text-[0.85em] text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
            .pdf
          </code>{" "}
          or{" "}
          <code className="rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 font-mono text-[0.85em] text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
            .docx
          </code>{" "}
          so the rest of CareerLM can work with it.
        </p>

        {/* Upload Card - Drop zone plus action */}
        <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              selectFile(e.dataTransfer.files?.[0] ?? null);
            }}
            className={`cursor-pointer rounded-xl border-2 border-dashed px-8 py-14 text-center transition-colors ${
              dragging
                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40"
                : "border-zinc-300 hover:border-indigo-400 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:border-indigo-500 dark:hover:bg-zinc-800/50"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx"
              onChange={(e) => selectFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />

            <div
              className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
                file
                  ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
                  : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
                aria-hidden="true"
              >
                {file ? (
                  <>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                    <path d="m9 15 2 2 4-4" />
                  </>
                ) : (
                  <>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <path d="m7 10 5-5 5 5" />
                    <path d="M12 5v12" />
                  </>
                )}
              </svg>
            </div>

            {file ? (
              <>
                <p className="mt-4 font-mono text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {file.name}
                </p>
                <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                  {formatBytes(file.size)} · click to choose another
                </p>
              </>
            ) : (
              <>
                <p className="mt-4 text-base font-medium text-zinc-900 dark:text-zinc-100">
                  Drop a file here, or click to browse
                </p>
                <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                  PDF or Word, up to 5 MB
                </p>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || uploading}
            className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-lg bg-indigo-600 px-8 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:bg-zinc-200 disabled:text-zinc-400 sm:w-auto dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600"
          >
            {uploading && (
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeOpacity={0.3}
                />
                <path
                  d="M21 12a9 9 0 0 0-9-9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                />
              </svg>
            )}
            {uploading ? "Extracting..." : "Extract text"}
          </button>
        </div>

        {error && (
          <div className="mt-6 flex gap-3 rounded-xl border border-red-300 bg-red-50 px-5 py-4 dark:border-red-900 dark:bg-red-950/50">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-red-900 dark:text-red-200">
                We could not read that file
              </p>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
            </div>
          </div>
        )}

        {result && (
          <section className="mt-12">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Extraction result
            </h2>

            {/* Stats - Quick numbers about what came back */}
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-zinc-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between gap-4 border-b border-zinc-200 bg-zinc-50 px-5 py-3 dark:border-zinc-800 dark:bg-zinc-800/50">
                <span className="truncate font-mono text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {result.filename}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="shrink-0 rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-white dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap px-5 py-4 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                {result.text}
              </pre>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
