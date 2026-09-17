/**
 * Project Repository: User-Scoped Persistence Layer
 * Guarantees multi-tenant isolation so users can only ever access their own projects.
 * Follows conventions defined in CONVENTIONS.md
 */
import { randomUUID } from 'node:crypto';
import type { CreateProjectDto, Project, ProjectSummary, UpdateProjectDto } from '../entities/project.js';

export interface IProjectRepository {
  create(userId: string, dto: CreateProjectDto): Promise<Project>;
  findByUser(userId: string): Promise<Project[]>;
  findById(userId: string, id: string): Promise<Project | null>;
  update(userId: string, id: string, dto: UpdateProjectDto): Promise<Project | null>;
  delete(userId: string, id: string): Promise<boolean>;
  getSummaryByUser(userId: string): Promise<ProjectSummary[]>;
  countByUser(userId: string): Promise<{ total: number; completed: number; in_progress: number }>;
  clear(): void; // Used for automated testing
}

/**
 * In-memory / durable project store supporting complete user scoping and isolation.
 */
class ProjectRepository implements IProjectRepository {
  private projects: Map<string, Project> = new Map();

  /**
   * Create a new project strictly bound to the authenticated userId.
   */
  async create(userId: string, dto: CreateProjectDto): Promise<Project> {
    const now = new Date().toISOString();
    const id = randomUUID();

    const newProject: Project = {
      id,
      user_id: userId, // Enforce database-level ownership
      title: dto.title.trim(),
      description: dto.description.trim(),
      skills_demonstrated: [...(dto.skills_demonstrated ?? [])],
      project_urls: [...(dto.project_urls ?? [])],
      status: dto.status ?? 'in_progress',
      created_at: now,
      updated_at: now,
    };

    this.projects.set(id, newProject);
    return { ...newProject };
  }

  /**
   * Retrieve all projects owned by the authenticated user.
   */
  async findByUser(userId: string): Promise<Project[]> {
    const results: Project[] = [];
    for (const project of this.projects.values()) {
      if (project.user_id === userId) {
        results.push({ ...project });
      }
    }
    // Sort descending by creation date
    return results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  /**
   * Retrieve a specific project by ID, strictly enforcing ownership.
   * Returns null if the project does not exist OR belongs to another user.
   */
  async findById(userId: string, id: string): Promise<Project | null> {
    const project = this.projects.get(id);
    if (!project || project.user_id !== userId) {
      return null;
    }
    return { ...project };
  }

  /**
   * Update an existing project only if it belongs to the authenticated user.
   */
  async update(userId: string, id: string, dto: UpdateProjectDto): Promise<Project | null> {
    const existing = this.projects.get(id);
    if (!existing || existing.user_id !== userId) {
      return null; // Not found or not owned
    }

    const updated: Project = {
      ...existing,
      title: dto.title !== undefined ? dto.title.trim() : existing.title,
      description: dto.description !== undefined ? dto.description.trim() : existing.description,
      skills_demonstrated: dto.skills_demonstrated !== undefined ? [...dto.skills_demonstrated] : existing.skills_demonstrated,
      project_urls: dto.project_urls !== undefined ? [...dto.project_urls] : existing.project_urls,
      status: dto.status !== undefined ? dto.status : existing.status,
      updated_at: new Date().toISOString(),
    };

    this.projects.set(id, updated);
    return { ...updated };
  }

  /**
   * Delete a project only if it belongs to the authenticated user.
   */
  async delete(userId: string, id: string): Promise<boolean> {
    const existing = this.projects.get(id);
    if (!existing || existing.user_id !== userId) {
      return false; // Not found or not owned
    }

    this.projects.delete(id);
    return true;
  }

  /**
   * Retrieve lightweight summaries for dashboard display.
   */
  async getSummaryByUser(userId: string): Promise<ProjectSummary[]> {
    const userProjects = await this.findByUser(userId);
    return userProjects.map((p) => ({
      id: p.id,
      title: p.title,
      skills_demonstrated: p.skills_demonstrated,
      status: p.status,
      updated_at: p.updated_at,
    }));
  }

  /**
   * Retrieve project counts for dashboard / readiness score calculation.
   */
  async countByUser(userId: string): Promise<{ total: number; completed: number; in_progress: number }> {
    const userProjects = await this.findByUser(userId);
    let completed = 0;
    let in_progress = 0;

    for (const project of userProjects) {
      if (project.status === 'completed') {
        completed++;
      } else {
        in_progress++;
      }
    }

    return {
      total: userProjects.length,
      completed,
      in_progress,
    };
  }

  /**
   * Clear all records (useful for test resets).
   */
  clear(): void {
    this.projects.clear();
  }
}

// Export singleton instance
export const projectRepository = new ProjectRepository();
