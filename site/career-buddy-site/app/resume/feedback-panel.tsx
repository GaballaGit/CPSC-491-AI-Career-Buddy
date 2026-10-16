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
        <h2 className="text-lg font-semibold text-foreground">
          AI feedback
        </h2>
        <button
          type="button"
          onClick={requestFeedback}
          disabled={loading}
          className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-85 disabled:bg-line disabled:text-muted"
        >
          {loading
            ? "Reviewing..."
            : feedback
            ? "Review again"
            : "Get AI feedback"}
        </button>
      </div>

      {!feedback && !loading && !error && (
        <p className="mt-3 text-sm text-muted">
          Get strengths, weaknesses, missing skills, and suggestions for your
          target role.
        </p>
      )}

      {loading && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl bg-line"
            />
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-danger-line bg-danger-soft px-5 py-4">
          <p className="text-sm text-danger">{error}</p>
          <button
            type="button"
            onClick={requestFeedback}
            className="shrink-0 rounded-full border border-danger-line px-3 py-1.5 text-xs font-semibold text-danger hover:bg-card"
          >
            Try again
          </button>
        </div>
      )}

      {feedback && !loading && (
        <>
          {feedback.targetRole && (
            <p className="mt-3 text-xs text-muted">
              Reviewed for: {feedback.targetRole}
            </p>
          )}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {SECTIONS.map(({ key, title }) => {
              const items = feedback[key] as string[];
              return (
                <div
                  key={key}
                  className="rounded-xl border border-line bg-card px-5 py-4"
                >
                  <h3 className="text-sm font-semibold text-foreground">
                    {title}
                  </h3>
                  {items.length > 0
                    ? (
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
                        {items.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    )
                    : <p className="mt-2 text-sm text-muted">None noted.</p>}
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
