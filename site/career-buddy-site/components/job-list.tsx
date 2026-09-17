"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getJobs, type Job } from "../lib/jobs";

export default function JobList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string>();

  useEffect(() => {
    getJobs().then(setJobs).catch((reason: unknown) => {
      setError(reason instanceof Error ? reason.message : "Unable to load jobs.");
    });
  }, []);

  if (error) return <p className="notice error">{error}</p>;
  if (!jobs.length) return <p className="notice">Loading available roles…</p>;

  return (
    <div className="job-grid">
      {jobs.map((job) => (
        <Link className="job-card" href={`/jobs/${job.id}`} key={job.id}>
          <span className="eyebrow">{job.category}</span>
          <h2>{job.title}</h2>
          <p>{job.description}</p>
          <div className="skills" aria-label="Required skills">
            {job.required_skills.slice(0, 3).map((skill) => (
              <span className="skill" key={skill.name}>{skill.name}</span>
            ))}
          </div>
          <span className="card-link">View role →</span>
        </Link>
      ))}
    </div>
  );
}
