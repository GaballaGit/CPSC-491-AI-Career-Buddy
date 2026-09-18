"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getJob, type Job } from "../lib/jobs";

export default function JobDetail({ id }: { id: string }) {
  const [job, setJob] = useState<Job>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    getJob(id).then(setJob).catch((reason: unknown) => {
      setError(reason instanceof Error ? reason.message : "Unable to load job.");
    });
  }, [id]);

  if (error) {
    return (
      <main className="page-shell detail">
        <Link className="back-link" href="/">← Back to jobs</Link>
        <p className="notice error">{error}</p>
      </main>
    );
  }

  if (!job) return <main className="page-shell detail"><p className="notice">Loading role…</p></main>;

  return (
    <main className="page-shell detail">
      <Link className="back-link" href="/">← Back to jobs</Link>
      <span className="eyebrow">{job.category}</span>
      <h1>{job.title}</h1>
      <p className="detail-description">{job.description}</p>
      <h2>Required skills</h2>
      <div className="skills">
        {job.required_skills.map((skill) => <span className="skill" key={skill.name}>{skill.name}</span>)}
      </div>
    </main>
  );
}
