import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getUserFromAccessToken } from "../auth/supabase.js";
import { app } from "../app.js";
import { projectRepository } from "../database/projectRepository.js";
import type { Project } from "../entities/project.js";

vi.mock("../auth/supabase.js", () => ({
  getUserFromAccessToken: vi.fn(),
}));

vi.mock("../database/projectRepository.js", () => ({
  projectRepository: {
    create: vi.fn(),
    findByUser: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getSummaryByUser: vi.fn(),
    countByUser: vi.fn(),
  },
}));

const userId = "11111111-1111-1111-1111-111111111111";
const authHeader = { Authorization: "Bearer test-token" };

const sampleProject: Project = {
  id: "22222222-2222-2222-2222-222222222222",
  user_id: userId,
  title: "CareerLM",
  description: "AI-powered career coaching platform",
  skills_demonstrated: ["TypeScript", "Express"],
  project_urls: [],
  status: "in_progress",
  created_at: "2026-09-17T20:00:00.000Z",
  updated_at: "2026-09-17T20:00:00.000Z",
};

describe("Project creation and retrieval", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(getUserFromAccessToken).mockResolvedValue({
      id: userId,
      email: "project-test@example.com",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: "2026-09-17T20:00:00.000Z",
    });
  });

  describe("POST /api/projects", () => {
    it("creates a project for the authenticated user", async () => {
      vi.mocked(projectRepository.create).mockResolvedValue(sampleProject);

      const response = await request(app)
        .post("/api/projects")
        .set(authHeader)
        .send({
          title: "CareerLM",
          description: "AI-powered career coaching platform",
          skills_demonstrated: ["TypeScript", "Express"],
          project_urls: [],
          status: "in_progress",
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toEqual(sampleProject);

      expect(projectRepository.create).toHaveBeenCalledWith(userId, {
        title: "CareerLM",
        description: "AI-powered career coaching platform",
        skills_demonstrated: ["TypeScript", "Express"],
        project_urls: [],
        status: "in_progress",
      });
    });

    it("rejects an unauthenticated request", async () => {
      vi.mocked(getUserFromAccessToken).mockResolvedValueOnce(null);

      const response = await request(app)
        .post("/api/projects")
        .set(authHeader)
        .send({
          title: "CareerLM",
          description: "AI-powered career coaching platform",
          skills_demonstrated: ["TypeScript"],
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("AUTHENTICATION_REQUIRED");

      expect(projectRepository.create).not.toHaveBeenCalled();
    });

    it("rejects invalid project data", async () => {
      const response = await request(app)
        .post("/api/projects")
        .set(authHeader)
        .send({
          title: "",
          description: "Test project",
          skills_demonstrated: ["TypeScript"],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");

      expect(projectRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/projects", () => {
    it("returns projects belonging to the authenticated user", async () => {
      vi.mocked(projectRepository.findByUser).mockResolvedValue([
        sampleProject,
      ]);

      const response = await request(app).get("/api/projects").set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([sampleProject]);

      expect(projectRepository.findByUser).toHaveBeenCalledWith(userId);
    });

    it("returns an empty array when the user has no projects", async () => {
      vi.mocked(projectRepository.findByUser).mockResolvedValue([]);

      const response = await request(app).get("/api/projects").set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);

      expect(projectRepository.findByUser).toHaveBeenCalledWith(userId);
    });

    it("rejects an unauthenticated request", async () => {
      vi.mocked(getUserFromAccessToken).mockResolvedValueOnce(null);

      const response = await request(app).get("/api/projects").set(authHeader);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("AUTHENTICATION_REQUIRED");

      expect(projectRepository.findByUser).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/projects/:id", () => {
    it("returns one project owned by the authenticated user", async () => {
      vi.mocked(projectRepository.findById).mockResolvedValue(sampleProject);

      const response = await request(app)
        .get(`/api/projects/${sampleProject.id}`)
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(sampleProject);

      expect(projectRepository.findById).toHaveBeenCalledWith(
        userId,
        sampleProject.id,
      );
    });

    it("returns 404 when the project cannot be found for the user", async () => {
      vi.mocked(projectRepository.findById).mockResolvedValue(null);

      const response = await request(app)
        .get("/api/projects/33333333-3333-3333-3333-333333333333")
        .set(authHeader);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("PROJECT_NOT_FOUND");
      expect(response.body.error.message).toBe("Project not found.");
    });
  });
});
