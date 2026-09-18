export interface Job {
  id: string;
  title: string;
  description: string;
  category: string;
  required_skills: { name: string }[];
  created_at: string;
  updated_at: string;
}

interface JobsResponse {
  success: boolean;
  data: Job[];
}

interface JobResponse {
  success: boolean;
  data: Job;
}

export async function getJobs(category?: string): Promise<Job[]> {
  const query = category ? `?category=${encodeURIComponent(category)}` : "";
  const response = await fetch(`/api/jobs${query}`);
  if (!response.ok) throw new Error("Unable to load jobs.");
  const payload = (await response.json()) as JobsResponse;
  if (!payload.success) throw new Error("Unable to load jobs.");
  return payload.data;
}

export async function getJob(id: string): Promise<Job> {
  const response = await fetch(`/api/jobs/${id}`);
  if (response.status === 404) throw new Error("Job not found.");
  if (!response.ok) throw new Error("Unable to load job.");
  const payload = (await response.json()) as JobResponse;
  if (!payload.success) throw new Error("Unable to load job.");
  return payload.data;
}
