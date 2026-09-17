import { randomUUID } from "node:crypto";
import type { CreateJobDto, Job } from "../entities/job.js";

class JobRepository {
  private readonly jobs = new Map<string, Job>();

  replaceAll(input: CreateJobDto[]): void {
    this.jobs.clear();
    for (const job of input) this.create(job);
  }

  create(input: CreateJobDto): Job {
    const now = new Date().toISOString();
    const job: Job = { id: randomUUID(), ...input, created_at: now, updated_at: now };
    this.jobs.set(job.id, job);
    return job;
  }

  findAll(): Job[] {
    return [...this.jobs.values()].sort((a, b) => a.title.localeCompare(b.title));
  }

  findById(id: string): Job | undefined {
    return this.jobs.get(id);
  }
}

export const jobRepository = new JobRepository();
