"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getJobs, type Job, type JobMatchStatus } from "../lib/jobs";

const categories = [
  "Engineering",
  "Data",
  "Product",
  "Design",
  "Infrastructure",
  "Security",
  "Content",
  "Business",
];

export default function JobList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [matchStatus, setMatchStatus] = useState<JobMatchStatus>("signed_out");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    getJobs(category || undefined)
      .then(({ jobs: nextJobs, matchStatus: nextMatchStatus }) => {
        setJobs(nextJobs);
        setMatchStatus(nextMatchStatus);
      })
      .catch((reason: unknown) =>
        setError(
          reason instanceof Error ? reason.message : "Unable to load jobs.",
        )
      )
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <>
      <label className="filter-label" htmlFor="category">
        Filter by category
      </label>
      <select
        className="category-filter"
        id="category"
        value={category}
        onChange={(event) => {
          setLoading(true);
          setError(undefined);
          setCategory(event.target.value);
        }}
      >
        <option value="">All categories</option>
        {categories.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error && <p className="notice error">{error}</p>}
      {loading && <p className="notice">Loading available roles…</p>}
      {!loading && !error && matchStatus === "signed_out" && (
        <p className="notice prompt">
          <Link href="/signin">Sign in</Link>{" "}
          to see how well each role matches your skills.
        </p>
      )}
      {!loading && !error && matchStatus === "profile_missing" && (
        <p className="notice prompt">
          <Link href="/onboarding">Complete onboarding</Link>{" "}
          to unlock your personalized job match scores.
        </p>
      )}
      {!loading && !error && !jobs.length && (
        <p className="notice">No roles found in this category.</p>
      )}
      {!loading && !error && jobs.length > 0 && (
        <div className="job-grid">
          {jobs.map((job) => (
            <Link className="job-card" href={`/jobs/${job.id}`} key={job.id}>
              <span className="eyebrow">{job.category}</span>
              <h2>{job.title}</h2>
              <p>{job.description}</p>
              {job.match && (
                <span className="match-score">{job.match.score}% match</span>
              )}
              <div className="skills" aria-label="Required skills">
                {job.required_skills.slice(0, 3).map((skill) => (
                  <span className="skill" key={skill.name}>
                    {skill.name}
                  </span>
                ))}
              </div>
              <span className="card-link">View role →</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
