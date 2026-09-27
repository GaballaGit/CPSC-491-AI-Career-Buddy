import { authHeaders } from "./auth";

export type ProjectStatus = "in_progress" | "completed";

export interface CreateProjectInput {
  title: string;
  description: string;
  skills_demonstrated: string[];
  project_urls?: string[];
  status?: ProjectStatus;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string;
  skills_demonstrated: string[];
  project_urls: string[];
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta: {
    timestamp: string;
  };
}

interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

/**
 * Create a new project for the authenticated user.
 */
export async function createProject(
  input: CreateProjectInput,
): Promise<Project> {
  const response = await fetch(`${API_URL}/api/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await authHeaders()),
    },
    body: JSON.stringify(input),
  });

  const payload = (await response.json()) as
    | ApiSuccessResponse<Project>
    | ApiErrorResponse;

  if (!response.ok || !payload.success) {
    const message =
      "error" in payload
        ? payload.error.message
        : "Unable to create project.";

    throw new Error(message);
  }

  return payload.data;
}

/**
 * Retrieve all projects belonging to the authenticated user.
 */
export async function getProjects(): Promise<Project[]> {
  const response = await fetch(`${API_URL}/api/projects`, {
    method: "GET",
    headers: await authHeaders(),
    cache: "no-store",
  });

  const payload = (await response.json()) as
    | ApiSuccessResponse<Project[]>
    | ApiErrorResponse;

  if (!response.ok || !payload.success) {
    const message =
      "error" in payload
        ? payload.error.message
        : "Unable to retrieve projects.";

    throw new Error(message);
  }

  return payload.data;
}