"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getJob, type Job, type JobMatchStatus } from "../lib/jobs";

export default function JobDetail({ id }: { id: string }) {
  const [job, setJob] = useState<Job>();
  const [matchStatus, setMatchStatus] = useState<JobMatchStatus>("signed_out");
  const [error, setError] = useState<string>();

  useEffect(() => {
    getJob(id)
      .then(({ job: nextJob, matchStatus: nextMatchStatus }) => {
        setJob(nextJob);
        setMatchStatus(nextMatchStatus);
      })
      .catch((reason: unknown) => {
        setError(
          reason instanceof Error ? reason.message : "Unable to load job.",
        );
      });
  }, [id]);

  if (error) {
    return (
      <main className="page-shell detail">
        <Link className="back-link" href="/">
          ← Back to jobs
        </Link>
        <p className="notice error">{error}</p>
      </main>
    );
  }

  if (!job) {
    return (
      <main className="page-shell detail">
        <p className="notice">Loading role…</p>
      </main>
    );
  }

  return (
    <main className="page-shell detail">
      <Link className="back-link" href="/">
        ← Back to jobs
      </Link>
      <span className="eyebrow">{job.category}</span>
      <h1>{job.title}</h1>
      <p className="detail-description">{job.description}</p>
      {job.match && (
        <p className="match-score detail-score">{job.match.score}% match</p>
      )}
      {matchStatus === "signed_out" && (
        <p className="notice prompt">
          <Link href="/signin">Sign in</Link>{" "}
          to compare this role against your skills.
        </p>
      )}
      {matchStatus === "profile_missing" && (
        <p className="notice prompt">
          <Link href="/onboarding">Complete onboarding</Link>{" "}
          to see your matched and missing skills.
        </p>
      )}
      <h2>Required skills</h2>
      <div className="skills">
        {job.required_skills.map((skill) => (
          <span className="skill" key={skill.name}>
            {skill.name}
          </span>
        ))}
      </div>
      {job.match && (
        <section
          className="match-breakdown"
          aria-labelledby="match-breakdown-heading"
        >
          <h2 id="match-breakdown-heading">Your match breakdown</h2>
          <div className="match-columns">
            <div>
              <h3>Matched skills</h3>
              {job.match.matched.length
                ? (
                  <div className="skills success-skills">
                    {job.match.matched.map((skill) => (
                      <span className="skill" key={skill.name}>
                        {skill.name}
                      </span>
                    ))}
                  </div>
                )
                : (
                  <p className="notice compact">
                    No required skills matched yet.
                  </p>
                )}
            </div>
            <div>
              <h3>Missing skills</h3>
              {job.match.missing.length
                ? (
                  <div className="skills missing-skills">
                    {job.match.missing.map((skill) => (
                      <span className="skill" key={skill.name}>
                        {skill.name}
                      </span>
                    ))}
                  </div>
                )
                : (
                  <p className="notice compact">
                    You have all listed required skills.
                  </p>
                )}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
