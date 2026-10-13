export type ProjectStatus = "in_progress" | "completed";

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

export interface CreateProjectInput {
  title: string;
  description: string;
  skills_demonstrated: string[];
  project_urls?: string[];
  status?: ProjectStatus;
}

export interface UpdateProjectInput {
  title?: string;
  description?: string;
  skills_demonstrated?: string[];
  project_urls?: string[];
  status?: ProjectStatus;
}
