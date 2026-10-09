import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { app } from "../app.js";
import { projectRepository } from "../database/projectRepository.js";
import type { Project } from "../entities/project.js";

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
const authToken = "project-test-token";

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

const otherProjectId = "33333333-3333-3333-3333-333333333333";

describe("Portfolio project API", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    process.env.SUPABASE_AUTH_TEST_USERS = JSON.stringify({
      [authToken]: {
        id: userId,
        email: "project-test@example.com",
      },
    });
  });

  describe("validation contract", () => {
    const valid = {
      title: "CareerLM",
      description: "Test project",
      skills_demonstrated: ["TypeScript"],
    };
    const cases: Array<{
      input: Record<string, unknown>;
      field?: string;
      message: string;
    }> = [
      {
        input: { title: 1 },
        field: "title",
        message: "Project title must be a string.",
      },
      {
        input: { title: " ab " },
        field: "title",
        message: "Project title must be between 3 and 100 characters.",
      },
      {
        input: { title: "x".repeat(101) },
        field: "title",
        message: "Project title must be between 3 and 100 characters.",
      },
      {
        input: { description: null },
        field: "description",
        message: "Project description must be a string.",
      },
      {
        input: { description: "  " },
        field: "description",
        message: "Project description cannot be empty.",
      },
      {
        input: { skills_demonstrated: [""] },
        field: "skills_demonstrated",
        message: "skills_demonstrated must be an array of non-empty strings.",
      },
      {
        input: { skills_demonstrated: null },
        field: "skills_demonstrated",
        message: "skills_demonstrated must be an array of non-empty strings.",
      },
      {
        input: { project_urls: [1] },
        field: "project_urls",
        message: "project_urls must be an array of non-empty strings.",
      },
      {
        input: { status: "unknown" },
        field: "status",
        message: 'Project status must be either "in_progress" or "completed".',
      },
    ];

    for (const method of ["post", "patch"] as const) {
      for (const { input, field, message } of cases) {
        it(`${method} preserves validation for ${JSON.stringify(input)}`, async () => {
          const expectedMessage =
            method === "post" && input.title === 1
              ? "Project title is required."
              : method === "post" && input.description === null
                ? "Project description is required."
                : message;
          const agent = request(app);
          const response = await agent[method](
            method === "post"
              ? "/api/projects"
              : `/api/projects/${sampleProject.id}`,
          )
            .set("Authorization", `Bearer ${authToken}`)
            .send({ ...valid, ...input });
          expect(response.status).toBe(400);
          expect(response.body).toEqual({
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: expectedMessage,
              details: [{ field, message: expectedMessage }],
            },
          });
          expect(projectRepository.create).not.toHaveBeenCalled();
          expect(projectRepository.update).not.toHaveBeenCalled();
        });
      }

      it(`${method} rejects non-object bodies with empty details`, async () => {
        const agent = request(app);
        const response = await agent[method](
          method === "post"
            ? "/api/projects"
            : `/api/projects/${sampleProject.id}`,
        )
          .set("Authorization", `Bearer ${authToken}`)
          .send([]);
        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Request body must be a JSON object.",
            details: [],
          },
        });
      });
    }

    it("reports the first invalid field and rejects an unknown-only update", async () => {
      const create = await request(app)
        .post("/api/projects")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ title: "", description: "", status: "bad" });
      expect(create.body.error.details[0].field).toBe("title");
      const update = await request(app)
        .patch(`/api/projects/${sampleProject.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ user_id: "other" });
      expect(update.body).toEqual({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "At least one project field must be provided for update.",
          details: [],
        },
      });
    });

    it("accepts empty skill/URL arrays, trims fields, and ignores ownership input", async () => {
      vi.mocked(projectRepository.create).mockResolvedValue(sampleProject);
      const response = await request(app)
        .post("/api/projects")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: " abc ",
          description: " test ",
          skills_demonstrated: [],
          project_urls: [],
          user_id: "other",
        });
      expect(response.status).toBe(201);
      expect(response.body).toEqual({ data: sampleProject });
      expect(projectRepository.create).toHaveBeenCalledWith(userId, {
        title: "abc",
        description: "test",
        skills_demonstrated: [],
        project_urls: [],
      });
    });
  });

  describe("POST /api/projects", () => {
    it("creates a project for the authenticated user", async () => {
      vi.mocked(projectRepository.create).mockResolvedValue(sampleProject);

      const response = await request(app)
        .post("/api/projects")
        .set("Authorization", `Bearer ${authToken}`)
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

    it("normalizes and deduplicates project skills on create", async () => {
      vi.mocked(projectRepository.create).mockResolvedValue(sampleProject);

      const response = await request(app)
        .post("/api/projects")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "CareerLM",
          description: "AI-powered career coaching platform",
          skills_demonstrated: [
            " ts ",
            "TypeScript",
            "nodejs",
            "Node.js",
            " postgres ",
          ],
          project_urls: [],
          status: "completed",
        });

      expect(response.status).toBe(201);

      expect(projectRepository.create).toHaveBeenCalledWith(userId, {
        title: "CareerLM",
        description: "AI-powered career coaching platform",
        skills_demonstrated: ["TypeScript", "Node.js", "PostgreSQL"],
        project_urls: [],
        status: "completed",
      });
    });

    it("returns 401 for an unauthenticated create request", async () => {
      const response = await request(app)
        .post("/api/projects")
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
        .set("Authorization", `Bearer ${authToken}`)
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

      const response = await request(app)
        .get("/api/projects")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([sampleProject]);

      expect(projectRepository.findByUser).toHaveBeenCalledWith(userId);
    });

    it("returns an empty array when the user has no projects", async () => {
      vi.mocked(projectRepository.findByUser).mockResolvedValue([]);

      const response = await request(app)
        .get("/api/projects")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);

      expect(projectRepository.findByUser).toHaveBeenCalledWith(userId);
    });

    it("returns 401 for an unauthenticated list request", async () => {
      const response = await request(app).get("/api/projects");

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe("AUTHENTICATION_REQUIRED");

      expect(projectRepository.findByUser).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/projects/:id", () => {
    it("returns a project owned by the authenticated user", async () => {
      vi.mocked(projectRepository.findById).mockResolvedValue(sampleProject);

      const response = await request(app)
        .get(`/api/projects/${sampleProject.id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(sampleProject);

      expect(projectRepository.findById).toHaveBeenCalledWith(
        userId,
        sampleProject.id,
      );
    });

    it("does not allow the user to read another user's project", async () => {
      vi.mocked(projectRepository.findById).mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/projects/${otherProjectId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe("PROJECT_NOT_FOUND");

      expect(projectRepository.findById).toHaveBeenCalledWith(
        userId,
        otherProjectId,
      );
    });
  });

  describe("PATCH /api/projects/:id", () => {
    it("normalizes and deduplicates project skills on update", async () => {
      vi.mocked(projectRepository.update).mockResolvedValue({
        ...sampleProject,
        skills_demonstrated: ["TypeScript", "Node.js"],
        status: "completed",
      });

      const response = await request(app)
        .patch(`/api/projects/${sampleProject.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          skills_demonstrated: [" ts ", "TypeScript", "nodejs", "Node.js"],
          status: "completed",
        });

      expect(response.status).toBe(200);

      expect(projectRepository.update).toHaveBeenCalledWith(
        userId,
        sampleProject.id,
        {
          skills_demonstrated: ["TypeScript", "Node.js"],
          status: "completed",
        },
      );
    });

    it("persists the completed project status", async () => {
      const completedProject: Project = {
        ...sampleProject,
        status: "completed",
      };

      vi.mocked(projectRepository.update).mockResolvedValue(completedProject);

      const response = await request(app)
        .patch(`/api/projects/${sampleProject.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          status: "completed",
        });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe("completed");

      expect(projectRepository.update).toHaveBeenCalledWith(
        userId,
        sampleProject.id,
        {
          status: "completed",
        },
      );
    });

    it("does not allow the user to update another user's project", async () => {
      vi.mocked(projectRepository.update).mockResolvedValue(null);

      const response = await request(app)
        .patch(`/api/projects/${otherProjectId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "Unauthorized change",
        });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe("PROJECT_NOT_FOUND");

      expect(projectRepository.update).toHaveBeenCalledWith(
        userId,
        otherProjectId,
        {
          title: "Unauthorized change",
        },
      );
    });

    it("returns 401 for an unauthenticated update request", async () => {
      const response = await request(app)
        .patch(`/api/projects/${sampleProject.id}`)
        .send({
          status: "completed",
        });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe("AUTHENTICATION_REQUIRED");

      expect(projectRepository.update).not.toHaveBeenCalled();
    });
  });

  describe("DELETE /api/projects/:id", () => {
    it("deletes a project owned by the authenticated user", async () => {
      vi.mocked(projectRepository.delete).mockResolvedValue(true);

      const response = await request(app)
        .delete(`/api/projects/${sampleProject.id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(204);
      expect(response.text).toBe("");

      expect(projectRepository.delete).toHaveBeenCalledWith(
        userId,
        sampleProject.id,
      );
    });

    it("does not allow the user to delete another user's project", async () => {
      vi.mocked(projectRepository.delete).mockResolvedValue(false);

      const response = await request(app)
        .delete(`/api/projects/${otherProjectId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe("PROJECT_NOT_FOUND");

      expect(projectRepository.delete).toHaveBeenCalledWith(
        userId,
        otherProjectId,
      );
    });

    it("returns 401 for an unauthenticated delete request", async () => {
      const response = await request(app).delete(
        `/api/projects/${sampleProject.id}`,
      );

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe("AUTHENTICATION_REQUIRED");

      expect(projectRepository.delete).not.toHaveBeenCalled();
    });
  });
});
