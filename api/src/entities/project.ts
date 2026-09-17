/**
 * Project Entity and Data Transfer Objects (DTOs)
 * Defined for Member 4 Subsystem: Portfolio & Career Readiness
 * Follows conventions defined in CONVENTIONS.md
 */

export type ProjectStatus = 'in_progress' | 'completed';

/**
 * Core Project Domain Entity representing a user-submitted portfolio item
 */
export interface Project {
  id: string; // UUID v4 primary key
  user_id: string; // UUID v4 foreign key referencing the owner
  title: string; // Title of the portfolio project (e.g. "AI Career Coach")
  description: string; // Detailed description of the project & technologies
  skills_demonstrated: string[]; // Normalized skill tags (e.g. ["TypeScript", "Next.js", "PostgreSQL"])
  project_urls: string[]; // Relevant URLs (GitHub repo, live deployment, demo video)
  status: ProjectStatus; // Current project lifecycle status
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

/**
 * DTO for creating a new portfolio project
 */
export interface CreateProjectDto {
  title: string;
  description: string;
  skills_demonstrated: string[];
  project_urls?: string[];
  status?: ProjectStatus;
}

/**
 * DTO for updating an existing portfolio project
 */
export interface UpdateProjectDto {
  title?: string;
  description?: string;
  skills_demonstrated?: string[];
  project_urls?: string[];
  status?: ProjectStatus;
}

/**
 * Lightweight project summary for dashboard consumption
 */
export interface ProjectSummary {
  id: string;
  title: string;
  skills_demonstrated: string[];
  status: ProjectStatus;
  updated_at: string;
}
