/**
 * Project Repository: User-Scoped Persistence Layer
 *
 * Persists portfolio projects in Supabase/PostgreSQL.
 * Every operation is explicitly scoped to the authenticated user ID.
 */

import type {
  CreateProjectDto,
  Project,
  ProjectSummary,
  UpdateProjectDto,
} from "../entities/project.js";

import { getDatabaseClient } from "./client.js";

export interface IProjectRepository {
  create(userId: string, dto: CreateProjectDto): Promise<Project>;

  findByUser(userId: string): Promise<Project[]>;

  findById(userId: string, id: string): Promise<Project | null>;

  update(
    userId: string,
    id: string,
    dto: UpdateProjectDto,
  ): Promise<Project | null>;

  delete(userId: string, id: string): Promise<boolean>;

  getSummaryByUser(userId: string): Promise<ProjectSummary[]>;

  countByUser(userId: string): Promise<{
    total: number;
    completed: number;
    in_progress: number;
  }>;
}

class ProjectRepository implements IProjectRepository {
  /**
   * Create a project owned by the authenticated user.
   */
  async create(userId: string, dto: CreateProjectDto): Promise<Project> {
    const databaseClient = getDatabaseClient();

    const { data, error } = await databaseClient
      .from("projects")
      .insert({
        user_id: userId,
        title: dto.title.trim(),
        description: dto.description.trim(),
        skills_demonstrated: dto.skills_demonstrated ?? [],
        project_urls: dto.project_urls ?? [],
        status: dto.status ?? "in_progress",
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to create project: ${error.message}`);
    }

    return data as Project;
  }

  /**
   * Return all projects owned by the authenticated user.
   */
  async findByUser(userId: string): Promise<Project[]> {
    const databaseClient = getDatabaseClient();

    const { data, error } = await databaseClient
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      throw new Error(`Failed to retrieve projects: ${error.message}`);
    }

    return (data ?? []) as Project[];
  }

  /**
   * Return one project only when it belongs to the authenticated user.
   *
   * A project belonging to another user is treated as not found.
   */
  async findById(userId: string, id: string): Promise<Project | null> {
    const databaseClient = getDatabaseClient();

    const { data, error } = await databaseClient
      .from("projects")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to retrieve project: ${error.message}`);
    }

    return data ? (data as Project) : null;
  }

  /**
   * Update a project only when it belongs to the authenticated user.
   */
  async update(
    userId: string,
    id: string,
    dto: UpdateProjectDto,
  ): Promise<Project | null> {
    const databaseClient = getDatabaseClient();

    const updates: Partial<{
      title: string;
      description: string;
      skills_demonstrated: string[];
      project_urls: string[];
      status: string;
    }> = {};

    if (dto.title !== undefined) {
      updates.title = dto.title.trim();
    }

    if (dto.description !== undefined) {
      updates.description = dto.description.trim();
    }

    if (dto.skills_demonstrated !== undefined) {
      updates.skills_demonstrated = dto.skills_demonstrated;
    }

    if (dto.project_urls !== undefined) {
      updates.project_urls = dto.project_urls;
    }

    if (dto.status !== undefined) {
      updates.status = dto.status;
    }

    const { data, error } = await databaseClient
      .from("projects")
      .update(updates)
      .eq("id", id)
      .eq("user_id", userId)
      .select("*")
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to update project: ${error.message}`);
    }

    return data ? (data as Project) : null;
  }

  /**
   * Delete a project only when it belongs to the authenticated user.
   */
  async delete(userId: string, id: string): Promise<boolean> {
    const databaseClient = getDatabaseClient();

    const { data, error } = await databaseClient
      .from("projects")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to delete project: ${error.message}`);
    }

    return data !== null;
  }

  /**
   * Return lightweight project information for dashboard use.
   */
  async getSummaryByUser(userId: string): Promise<ProjectSummary[]> {
    const databaseClient = getDatabaseClient();

    const { data, error } = await databaseClient
      .from("projects")
      .select("id, title, skills_demonstrated, status, updated_at")
      .eq("user_id", userId)
      .order("updated_at", {
        ascending: false,
      });

    if (error) {
      throw new Error(`Failed to retrieve project summaries: ${error.message}`);
    }

    return (data ?? []) as ProjectSummary[];
  }

  /**
   * Return project counts for the authenticated user.
   */
  async countByUser(userId: string): Promise<{
    total: number;
    completed: number;
    in_progress: number;
  }> {
    /*
     * No getDatabaseClient() is needed here because
     * findByUser() already obtains the database client.
     */
    const projects = await this.findByUser(userId);

    let completed = 0;
    let inProgress = 0;

    for (const project of projects) {
      if (project.status === "completed") {
        completed += 1;
      } else if (project.status === "in_progress") {
        inProgress += 1;
      }
    }

    return {
      total: projects.length,
      completed,
      in_progress: inProgress,
    };
  }
}

export const projectRepository = new ProjectRepository();
