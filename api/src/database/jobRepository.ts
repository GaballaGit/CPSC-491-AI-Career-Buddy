import { randomUUID } from "node:crypto";
import type { CreateJobDto, Job, RequiredSkill } from "../entities/job.js";

export function normalizeSkill(skill: RequiredSkill): RequiredSkill {
  return { name: skill.name.trim().toLowerCase() };
}

class JobRepository {
  private readonly jobs = new Map<string, Job>();

  replaceAll(input: CreateJobDto[]): void {
    this.jobs.clear();
    for (const job of input) this.create(job);
  }

  create(input: CreateJobDto): Job {
    const now = new Date().toISOString();
    const job: Job = {
      id: randomUUID(),
      ...input,
      required_skills: input.required_skills.map(normalizeSkill),
      created_at: now,
      updated_at: now,
    };
    this.jobs.set(job.id, job);
    return job;
  }

  findAll(): Job[] {
    return [...this.jobs.values()].sort((a, b) => a.title.localeCompare(b.title));
  }

  findById(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  findByRequiredSkill(skill: string): Job[] {
    const normalized = skill.trim().toLowerCase();
    return this.findAll().filter((job) =>
      job.required_skills.some((required) => required.name === normalized),
    );
  }

  findByCategory(category: string): Job[] {
    const normalized = category.trim().toLowerCase();
    return this.findAll().filter((job) => job.category.toLowerCase() === normalized);
  }
}

export const jobRepository = new JobRepository();
