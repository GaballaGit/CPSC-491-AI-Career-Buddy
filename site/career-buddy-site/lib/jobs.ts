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

export async function getJobs(): Promise<Job[]> {
  const response = await fetch("/api/jobs");
  if (!response.ok) throw new Error("Unable to load jobs.");
  const payload = (await response.json()) as JobsResponse;
  if (!payload.success) throw new Error("Unable to load jobs.");
  return payload.data;
}
