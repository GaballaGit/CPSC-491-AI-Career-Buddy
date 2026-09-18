"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getJobs, type Job } from "../lib/jobs";

const categories = ["Engineering", "Data", "Product", "Design", "Infrastructure", "Security", "Content", "Business"];

export default function JobList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    getJobs(category || undefined)
      .then(setJobs)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load jobs."))
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <>
      <label className="filter-label" htmlFor="category">Filter by category</label>
      <select className="category-filter" id="category" value={category} onChange={(event) => { setLoading(true); setError(undefined); setCategory(event.target.value); }}>
        <option value="">All categories</option>
        {categories.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
      {error && <p className="notice error">{error}</p>}
      {loading && <p className="notice">Loading available roles…</p>}
      {!loading && !error && !jobs.length && <p className="notice">No roles found in this category.</p>}
      {!loading && !error && jobs.length > 0 && (
        <div className="job-grid">
          {jobs.map((job) => (
            <Link className="job-card" href={`/jobs/${job.id}`} key={job.id}>
              <span className="eyebrow">{job.category}</span>
              <h2>{job.title}</h2>
              <p>{job.description}</p>
              <div className="skills" aria-label="Required skills">
                {job.required_skills.slice(0, 3).map((skill) => <span className="skill" key={skill.name}>{skill.name}</span>)}
              </div>
              <span className="card-link">View role →</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
