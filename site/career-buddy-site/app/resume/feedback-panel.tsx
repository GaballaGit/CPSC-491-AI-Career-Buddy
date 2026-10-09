"use client";

import { useState } from "react";

import {
  getResumeFeedback,
  ResumeRequestError,
  type ResumeFeedback,
} from "../../lib/resume";

const SECTIONS: Array<{ key: keyof ResumeFeedback; title: string }> = [
  { key: "strengths", title: "Strengths" },
  { key: "weaknesses", title: "Weaknesses" },
  { key: "missing_skills", title: "Missing skills" },
  { key: "suggestions", title: "Suggestions" },
];

// Feedback Panel - Button, loading, error with retry, and four lists
export default function FeedbackPanel({ text }: { text: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState<ResumeFeedback | null>(null);

  async function requestFeedback() {
    setLoading(true);
    setError("");
    try {
      setFeedback(await getResumeFeedback(text));
    } catch (err) {
      setError(
        err instanceof ResumeRequestError
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-12" aria-live="polite">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          AI feedback
        </h2>
        <button
          type="button"
          onClick={requestFeedback}
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:bg-zinc-300 disabled:text-zinc-500 dark:disabled:bg-zinc-800"
        >
          {loading
            ? "Reviewing..."
            : feedback
            ? "Review again"
            : "Get AI feedback"}
        </button>
      </div>

      {!feedback && !loading && !error && (
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Get strengths, weaknesses, missing skills, and suggestions for your
          target role.
        </p>
      )}

      {loading && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800"
            />
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-red-300 bg-red-50 px-5 py-4 dark:border-red-900 dark:bg-red-950/50">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          <button
            type="button"
            onClick={requestFeedback}
            className="shrink-0 rounded-md border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-white dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950"
          >
            Try again
          </button>
        </div>
      )}

      {feedback && !loading && (
        <>
          {feedback.targetRole && (
            <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
              Reviewed for: {feedback.targetRole}
            </p>
          )}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {SECTIONS.map(({ key, title }) => {
              const items = feedback[key] as string[];
              return (
                <div
                  key={key}
                  className="rounded-xl border border-zinc-200 bg-white px-5 py-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                    {title}
                  </h3>
                  {items.length > 0
                    ? (
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
                        {items.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    )
                    : <p className="mt-2 text-sm text-zinc-500">None noted.</p>}
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
