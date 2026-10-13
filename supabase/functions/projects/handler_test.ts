import { assertEquals } from "jsr:@std/assert@1";

import type { AuthContext } from "../_shared/auth.ts";
import type { ProjectStore } from "../_shared/projects/repository.ts";
import type { Project } from "../_shared/projects/types.ts";
import { createProjectsHandler, type ProjectsDeps } from "./handler.ts";

const userId = "11111111-1111-1111-1111-111111111111";

const projectId = "22222222-2222-2222-2222-222222222222";

const otherProjectId = "33333333-3333-3333-3333-333333333333";

const sampleProject: Project = {
  id: projectId,
  user_id: userId,
  title: "CareerLM",
  description: "AI-powered career coaching platform",
  skills_demonstrated: ["TypeScript", "Express"],
  project_urls: [],
  status: "in_progress",
  created_at: "2026-09-17T20:00:00.000Z",
  updated_at: "2026-09-17T20:00:00.000Z",
};

type Calls = {
  create: unknown[][];
  findByUser: unknown[][];
  findById: unknown[][];
  update: unknown[][];
  delete: unknown[][];
};

function testContext(options?: {
  authenticated?: boolean;
  findById?: Project | null;
  updateResult?: Project | null;
  deleteResult?: boolean;
}) {
  const calls: Calls = {
    create: [],
    findByUser: [],
    findById: [],
    update: [],
    delete: [],
  };

  const store: ProjectStore = {
    create(id, input) {
      calls.create.push([id, input]);
      return Promise.resolve(sampleProject);
    },

    findByUser(id) {
      calls.findByUser.push([id]);
      return Promise.resolve([sampleProject]);
    },

    findById(id, project) {
      calls.findById.push([id, project]);
      return Promise.resolve(
        options?.findById === undefined ? sampleProject : options.findById,
      );
    },

    update(id, project, input) {
      calls.update.push([id, project, input]);

      return Promise.resolve(
        options?.updateResult === undefined
          ? { ...sampleProject, ...input }
          : options.updateResult,
      );
    },

    delete(id, project) {
      calls.delete.push([id, project]);
      return Promise.resolve(options?.deleteResult ?? true);
    },
  };

  const auth = {
    userId,
    db: {} as AuthContext["db"],
  };

  const deps: ProjectsDeps = {
    authenticate() {
      return Promise.resolve(
        options?.authenticated === false ? null : auth,
      );
    },

    store() {
      return store;
    },
  };

  return {
    handler: createProjectsHandler(deps),
    calls,
  };
}

function request(
  path: string,
  method: string,
  body?: unknown,
) {
  return new Request(
    `http://localhost/functions/v1/projects${path}`,
    {
      method,
      headers: body === undefined ? undefined : {
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    },
  );
}

Deno.test("POST creates a project for the authenticated user", async () => {
  const { handler, calls } = testContext();

  const response = await handler(
    request("", "POST", {
      title: "CareerLM",
      description: "AI-powered career coaching platform",
      skills_demonstrated: [
        "TypeScript",
        "Express",
      ],
      project_urls: [],
      status: "in_progress",
    }),
  );

  const body = await response.json();

  assertEquals(response.status, 201);
  assertEquals(body.data, sampleProject);

  assertEquals(calls.create, [
    [
      userId,
      {
        title: "CareerLM",
        description: "AI-powered career coaching platform",
        skills_demonstrated: [
          "TypeScript",
          "Express",
        ],
        project_urls: [],
        status: "in_progress",
      },
    ],
  ]);
});

Deno.test("POST normalizes and deduplicates skills", async () => {
  const { handler, calls } = testContext();

  const response = await handler(
    request("", "POST", {
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
    }),
  );

  assertEquals(response.status, 201);

  assertEquals(calls.create[0][1], {
    title: "CareerLM",
    description: "AI-powered career coaching platform",
    skills_demonstrated: [
      "TypeScript",
      "Node.js",
      "PostgreSQL",
    ],
    project_urls: [],
    status: "completed",
  });
});

Deno.test("POST rejects unauthenticated requests", async () => {
  const { handler, calls } = testContext({
    authenticated: false,
  });

  const response = await handler(
    request("", "POST", {
      title: "CareerLM",
      description: "Test",
      skills_demonstrated: ["TypeScript"],
    }),
  );

  const body = await response.json();

  assertEquals(response.status, 401);
  assertEquals(
    body.error.code,
    "AUTHENTICATION_REQUIRED",
  );
  assertEquals(calls.create.length, 0);
});

Deno.test("POST returns field validation details", async () => {
  const { handler } = testContext();

  const response = await handler(
    request("", "POST", {
      title: "",
      description: "Test project",
      skills_demonstrated: ["TypeScript"],
    }),
  );

  const body = await response.json();

  assertEquals(response.status, 400);
  assertEquals(body.error.code, "VALIDATION_ERROR");
  assertEquals(body.error.details, [
    {
      field: "title",
      message: "Project title must be between 3 and 100 characters.",
    },
  ]);
});

Deno.test("GET lists authenticated user's projects", async () => {
  const { handler, calls } = testContext();

  const response = await handler(
    request("", "GET"),
  );

  const body = await response.json();

  assertEquals(response.status, 200);
  assertEquals(body.data, [sampleProject]);
  assertEquals(calls.findByUser, [[userId]]);
});

Deno.test("GET list requires authentication", async () => {
  const { handler } = testContext({
    authenticated: false,
  });

  const response = await handler(
    request("", "GET"),
  );

  const body = await response.json();

  assertEquals(response.status, 401);
  assertEquals(
    body.error.code,
    "AUTHENTICATION_REQUIRED",
  );
});

Deno.test("GET returns one owned project", async () => {
  const { handler, calls } = testContext();

  const response = await handler(
    request(`/${projectId}`, "GET"),
  );

  const body = await response.json();

  assertEquals(response.status, 200);
  assertEquals(body.data, sampleProject);
  assertEquals(calls.findById, [
    [userId, projectId],
  ]);
});

Deno.test("GET returns 404 for another user's project", async () => {
  const { handler, calls } = testContext({
    findById: null,
  });

  const response = await handler(
    request(`/${otherProjectId}`, "GET"),
  );

  const body = await response.json();

  assertEquals(response.status, 404);
  assertEquals(
    body.error.code,
    "PROJECT_NOT_FOUND",
  );
  assertEquals(calls.findById, [
    [userId, otherProjectId],
  ]);
});

Deno.test("PATCH normalizes project skills", async () => {
  const completed: Project = {
    ...sampleProject,
    skills_demonstrated: [
      "TypeScript",
      "Node.js",
    ],
    status: "completed",
  };

  const { handler, calls } = testContext({
    updateResult: completed,
  });

  const response = await handler(
    request(`/${projectId}`, "PATCH", {
      skills_demonstrated: [
        " ts ",
        "TypeScript",
        "nodejs",
        "Node.js",
      ],
      status: "completed",
    }),
  );

  assertEquals(response.status, 200);

  assertEquals(calls.update, [
    [
      userId,
      projectId,
      {
        skills_demonstrated: [
          "TypeScript",
          "Node.js",
        ],
        status: "completed",
      },
    ],
  ]);
});

Deno.test("PATCH returns 404 for another user's project", async () => {
  const { handler } = testContext({
    updateResult: null,
  });

  const response = await handler(
    request(`/${otherProjectId}`, "PATCH", {
      title: "Unauthorized change",
    }),
  );

  const body = await response.json();

  assertEquals(response.status, 404);
  assertEquals(
    body.error.code,
    "PROJECT_NOT_FOUND",
  );
});

Deno.test("PATCH requires authentication", async () => {
  const { handler, calls } = testContext({
    authenticated: false,
  });

  const response = await handler(
    request(`/${projectId}`, "PATCH", {
      status: "completed",
    }),
  );

  const body = await response.json();

  assertEquals(response.status, 401);
  assertEquals(
    body.error.code,
    "AUTHENTICATION_REQUIRED",
  );
  assertEquals(calls.update.length, 0);
});

Deno.test("DELETE removes an owned project", async () => {
  const { handler, calls } = testContext();

  const response = await handler(
    request(`/${projectId}`, "DELETE"),
  );

  assertEquals(response.status, 204);
  assertEquals(await response.text(), "");
  assertEquals(calls.delete, [
    [userId, projectId],
  ]);
});

Deno.test("DELETE returns 404 for another user's project", async () => {
  const { handler } = testContext({
    deleteResult: false,
  });

  const response = await handler(
    request(`/${otherProjectId}`, "DELETE"),
  );

  const body = await response.json();

  assertEquals(response.status, 404);
  assertEquals(
    body.error.code,
    "PROJECT_NOT_FOUND",
  );
});

Deno.test("DELETE requires authentication", async () => {
  const { handler, calls } = testContext({
    authenticated: false,
  });

  const response = await handler(
    request(`/${projectId}`, "DELETE"),
  );

  const body = await response.json();

  assertEquals(response.status, 401);
  assertEquals(
    body.error.code,
    "AUTHENTICATION_REQUIRED",
  );
  assertEquals(calls.delete.length, 0);
});
