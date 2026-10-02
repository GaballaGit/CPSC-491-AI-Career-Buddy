import { getSupabaseClient } from "./supabase";

export type JobMatchStatus = "signed_out" | "profile_missing" | "available";

export interface JobSkill {
  name: string;
}

export interface JobMatch {
  matched: JobSkill[];
  missing: JobSkill[];
  score: number;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  category: string;
  required_skills: JobSkill[];
  match?: JobMatch;
  created_at: string;
  updated_at: string;
}

export interface JobsResult {
  jobs: Job[];
  matchStatus: JobMatchStatus;
}

export interface JobResult {
  job: Job;
  matchStatus: JobMatchStatus;
}

interface JobsResponse {
  success: boolean;
  data: Job[];
  meta?: { matching?: { status?: JobMatchStatus } };
}

interface JobResponse {
  success: boolean;
  data: Job;
  meta?: { matching?: { status?: JobMatchStatus } };
}

async function optionalAuthHeaders(): Promise<HeadersInit> {
  const { data } = await getSupabaseClient().auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function matchStatus(payload: JobsResponse | JobResponse): JobMatchStatus {
  return payload.meta?.matching?.status ?? "signed_out";
}

export async function getJobs(category?: string): Promise<JobsResult> {
  const query = category ? `?category=${encodeURIComponent(category)}` : "";
  const response = await fetch(`/api/jobs${query}`, {
    headers: await optionalAuthHeaders(),
  });
  if (!response.ok) throw new Error("Unable to load jobs.");
  const payload = (await response.json()) as JobsResponse;
  if (!payload.success) throw new Error("Unable to load jobs.");
  return { jobs: payload.data, matchStatus: matchStatus(payload) };
}

export async function getJob(id: string): Promise<JobResult> {
  const response = await fetch(`/api/jobs/${id}`, {
    headers: await optionalAuthHeaders(),
  });
  if (response.status === 404) throw new Error("Job not found.");
  if (!response.ok) throw new Error("Unable to load job.");
  const payload = (await response.json()) as JobResponse;
  if (!payload.success) throw new Error("Unable to load job.");
  return { job: payload.data, matchStatus: matchStatus(payload) };
}
