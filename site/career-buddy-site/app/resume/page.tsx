"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type ResumeUploadData,
  type Skill,
  getSavedResumeSkills,
  isSignedIn,
  ResumeRequestError,
  uploadResume,
} from "../../lib/resume";
import FeedbackPanel from "./feedback-panel";
import SkillsPanel from "./skills-panel";
import Link from "next/link";

// Display - Turn raw bytes into something readable
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = new Set(["pdf", "docx"]);

// Stats - Simple counts shown under the extracted text
function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

function validateResumeFile(next: File): string | null {
  const extension = getFileExtension(next.name);

  if (!ACCEPTED_EXTENSIONS.has(extension)) {
    return "Please upload a PDF or DOCX resume.";
  }

  if (next.size > MAX_FILE_SIZE_BYTES) {
    return "Please upload a file that is 5 MB or smaller.";
  }

  return null;
}

export default function ResumePage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<ResumeUploadData | null>(null);
  const [error, setError] = useState<string>("");
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillsFile, setSkillsFile] = useState<string | null>(null);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [skillsError, setSkillsError] = useState("");

  // Saved Skills - Show what was found in the last upload
  const loadSavedSkills = useCallback(async () => {
    setSkillsLoading(true);
    setSkillsError("");
    try {
      const saved = await getSavedResumeSkills();
      setSkills(saved.skills);
      setSkillsFile(saved.filename);
    } catch (err) {
      setSkillsError(
        err instanceof ResumeRequestError
          ? err.message
          : "Could not load your skills.",
      );
    } finally {
      setSkillsLoading(false);
    }
  }, []);

  // First Load - Sign-in check, then saved skills
  useEffect(() => {
    let cancelled = false;
    isSignedIn()
      .then((yes) => {
        if (cancelled) return;
        setSignedIn(yes);
        if (yes) void loadSavedSkills();
      })
      .catch(() => {
        if (!cancelled) setSignedIn(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadSavedSkills]);

  // Selection - Reset previous output whenever a new file is picked
  function selectFile(next: File | null) {
    setResult(null);
    setError("");

    if (!next) {
      setFile(null);
      return;
    }

    const validationError = validateResumeFile(next);

    if (validationError) {
      setFile(null);
      setError(validationError);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setFile(next);
  }

  // Upload - Send the file and keep either the text or the error message
  async function handleUpload() {
    if (!file) return;

    setUploading(true);
    setError("");
    setResult(null);

    try {
      const data = await uploadResume(file);
      setResult(data);
      setSkills(data.skills);
      setSkillsFile(data.filename);
      setSkillsError("");
    } catch (err) {
      if (err instanceof ResumeRequestError) {
        if (err.code === "AUTHENTICATION_REQUIRED") setSignedIn(false);
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
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
    <div className="min-h-screen bg-background">
      {/* Top Bar - Product name and section */}
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-6 py-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-xs font-bold text-card">
            C
          </span>
          <span className="text-sm font-semibold text-foreground">
            CareerLM
          </span>
          <span className="h-4 w-px bg-line" />
          <span className="text-sm text-muted">
            Resume Intelligence
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">
          Step 1 of 3
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          Upload your resume
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-8 text-muted">
          We read the text out of your{" "}
          <code className="rounded border border-line bg-background px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">
            .pdf
          </code>{" "}
          or{" "}
          <code className="rounded border border-line bg-background px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">
            .docx
          </code>{" "}
          so the rest of CareerLM can work with it.
        </p>

        {signedIn === false && (
          <div className="mt-10 rounded-2xl border border-line bg-card p-6 text-sm text-foreground">
            <p>Sign in to upload your resume and see your skills.</p>
            <Link
              href="/signin"
              className="mt-4 inline-flex h-10 items-center rounded-full bg-foreground px-5 text-sm font-medium text-background hover:opacity-85"
            >
              Sign in
            </Link>
          </div>
        )}

        {signedIn && (
          <>
            {/* Upload Card - Drop zone plus action */}
            <div className="mt-10 rounded-2xl border border-line bg-card p-6">
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
                    ? "border-accent bg-accent-soft"
                    : "border-line hover:border-accent hover:bg-background"
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
                      ? "bg-accent-soft text-accent"
                      : "bg-background text-muted"
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
                    {file
                      ? (
                        <>
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <path d="M14 2v6h6" />
                          <path d="m9 15 2 2 4-4" />
                        </>
                      )
                      : (
                        <>
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <path d="m7 10 5-5 5 5" />
                          <path d="M12 5v12" />
                        </>
                      )}
                  </svg>
                </div>

                {file
                  ? (
                    <>
                      <p className="mt-4 font-mono text-sm font-medium text-foreground">
                        {file.name}
                      </p>
                      <p className="mt-1.5 text-sm text-muted">
                        {formatBytes(file.size)} · click to choose another
                      </p>
                    </>
                  )
                  : (
                    <>
                      <p className="mt-4 text-base font-medium text-foreground">
                        Drop a file here, or click to browse
                      </p>
                      <p className="mt-1.5 text-sm text-muted">
                        PDF or Word, up to 5 MB
                      </p>
                    </>
                  )}
              </div>

              <button
                type="button"
                onClick={handleUpload}
                disabled={!file || uploading}
                className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-full bg-foreground px-8 text-sm font-medium text-background transition-colors hover:opacity-85 disabled:bg-line disabled:text-muted sm:w-auto"
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
                {uploading ? "Reading resume..." : "Upload resume"}
              </button>
            </div>

            {error && (
              <div className="mt-6 flex gap-3 rounded-xl border border-danger-line bg-danger-soft px-5 py-4">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  strokeLinecap="round"
                  className="mt-0.5 h-5 w-5 shrink-0 text-danger"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-danger">
                    We could not read that file
                  </p>
                  <p className="mt-1 text-sm text-danger">
                    {error}
                  </p>
                </div>
              </div>
            )}

            <SkillsPanel
              {...(skillsLoading ? { state: "loading" as const } : skillsError
                ? {
                  state: "error" as const,
                  message: skillsError,
                  onRetry: () => void loadSavedSkills(),
                }
                : {
                  state: "ready" as const,
                  skills,
                  filename: skillsFile,
                })}
            />

            {result && (
              <FeedbackPanel key={result.filename} text={result.text} />
            )}

            {result && (
              <section className="mt-12">
                <h2 className="text-lg font-semibold text-foreground">
                  Extraction result
                </h2>

                {/* Stats - Quick numbers about what came back */}
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl border border-line bg-card px-4 py-3"
                    >
                      <p className="text-xs font-medium uppercase tracking-wider text-muted">
                        {stat.label}
                      </p>
                      <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 overflow-hidden rounded-xl border border-line bg-card">
                  <div className="flex items-center justify-between gap-4 border-b border-line bg-background px-5 py-3">
                    <span className="truncate font-mono text-sm font-medium text-foreground">
                      {result.filename}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="shrink-0 rounded-full border border-line px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-card"
                    >
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap px-5 py-4 text-sm leading-6 text-foreground">
                    {result.text}
                  </pre>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
