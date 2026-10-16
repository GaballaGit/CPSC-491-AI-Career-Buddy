import { FunctionsHttpError } from "@supabase/supabase-js";

import { getSupabaseClient } from "./supabase";

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

interface ApiErrorPayload {
  code: string;
  message: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}

export class ProjectRequestError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "ProjectRequestError";
  }
}

async function toProjectRequestError(
  error: unknown,
): Promise<ProjectRequestError> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = (await error.context.json()) as {
        error?: ApiErrorPayload;
      };

      const apiError = body.error;

      if (apiError) {
        return new ProjectRequestError(
          apiError.details?.[0]?.message ?? apiError.message,
          apiError.code,
        );
      }
    } catch {
      // Unreadable response body; use generic fallback below.
    }
  }

  return new ProjectRequestError(
    "Something went wrong. Please try again.",
    "UNKNOWN",
  );
}

/**
 * Create a new project for the authenticated user.
 */
export async function createProject(
  input: CreateProjectInput,
): Promise<Project> {
  const { data, error } = await getSupabaseClient().functions.invoke(
    "projects",
    {
      body: input,
    },
  );

  if (error) {
    throw await toProjectRequestError(error);
  }

  return (data as { data: Project }).data;
}

/**
 * Retrieve all projects belonging to the authenticated user.
 */
export async function getProjects(): Promise<Project[]> {
  const { data, error } = await getSupabaseClient().functions.invoke(
    "projects",
    {
      method: "GET",
    },
  );

  if (error) {
    throw await toProjectRequestError(error);
  }

  return (data as { data: Project[] }).data;
}
