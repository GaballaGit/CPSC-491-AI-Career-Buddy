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

async function functionHeaders(): Promise<HeadersInit> {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) {
    throw new Error(
      "Supabase Auth is not configured. Set NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  const { data } = await getSupabaseClient().auth.getSession();
  const token = data.session?.access_token ?? anonKey;

  return {
    apikey: anonKey,
    Authorization: `Bearer ${token}`,
  };
}

function jobsFunctionUrl(path = "", query = ""): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error(
      "Supabase Auth is not configured. Set NEXT_PUBLIC_SUPABASE_URL.",
    );
  }
  return `${supabaseUrl}/functions/v1/jobs${path}${query}`;
}

function matchStatus(payload: JobsResponse | JobResponse): JobMatchStatus {
  return payload.meta?.matching?.status ?? "signed_out";
}

export async function getJobs(category?: string): Promise<JobsResult> {
  const query = category ? `?category=${encodeURIComponent(category)}` : "";
  const response = await fetch(jobsFunctionUrl("", query), {
    headers: await functionHeaders(),
  });
  if (!response.ok) throw new Error("Unable to load jobs.");
  const payload = (await response.json()) as JobsResponse;
  if (!payload.success) throw new Error("Unable to load jobs.");
  return { jobs: payload.data, matchStatus: matchStatus(payload) };
}

export async function getJob(id: string): Promise<JobResult> {
  const response = await fetch(jobsFunctionUrl(`/${id}`), {
    headers: await functionHeaders(),
  });
  if (response.status === 404) throw new Error("Job not found.");
  if (!response.ok) throw new Error("Unable to load job.");
  const payload = (await response.json()) as JobResponse;
  if (!payload.success) throw new Error("Unable to load job.");
  return { job: payload.data, matchStatus: matchStatus(payload) };
}
