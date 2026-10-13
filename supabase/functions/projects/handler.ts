import { type AuthContext, authenticate } from "../_shared/auth.ts";
import { corsHeaders, fail, HttpError, ok } from "../_shared/http.ts";
import {
  type ProjectStore,
  supabaseProjectStore,
} from "../_shared/projects/repository.ts";
import {
  validateCreateProject,
  validateUpdateProject,
} from "../_shared/projects/validate.ts";

export interface ProjectsDeps {
  authenticate(req: Request): Promise<AuthContext | null>;
  store(auth: AuthContext): ProjectStore;
}

const defaultDeps: ProjectsDeps = {
  authenticate,
  store: (auth) => supabaseProjectStore(auth.db),
};

function routePath(url: URL): string[] {
  const parts = url.pathname.split("/").filter(Boolean);
  const functionIndex = parts.indexOf("projects");

  return functionIndex >= 0 ? parts.slice(functionIndex + 1) : [];
}

async function requireUser(
  req: Request,
  deps: ProjectsDeps,
) {
  const auth = await deps.authenticate(req);

  if (!auth) {
    throw new HttpError(
      401,
      "AUTHENTICATION_REQUIRED",
      "Authentication required. Please provide a valid Bearer token.",
    );
  }

  return {
    userId: auth.userId,
    store: deps.store(auth),
  };
}

function validationError(
  message: string,
  field?: string,
): never {
  throw new HttpError(
    400,
    "VALIDATION_ERROR",
    message,
    field ? [{ field, message }] : undefined,
  );
}

function notFound(): never {
  throw new HttpError(
    404,
    "PROJECT_NOT_FOUND",
    "Project not found.",
  );
}

async function createProject(
  req: Request,
  deps: ProjectsDeps,
): Promise<Response> {
  const { userId, store } = await requireUser(req, deps);

  const body = await req.json().catch(() => null);
  const validation = validateCreateProject(body);

  if (!validation.valid) {
    validationError(
      validation.message,
      validation.field,
    );
  }

  return ok(
    await store.create(userId, validation.dto),
    201,
  );
}

async function listProjects(
  req: Request,
  deps: ProjectsDeps,
): Promise<Response> {
  const { userId, store } = await requireUser(req, deps);

  return ok(await store.findByUser(userId));
}

async function getProject(
  req: Request,
  id: string,
  deps: ProjectsDeps,
): Promise<Response> {
  const { userId, store } = await requireUser(req, deps);

  const project = await store.findById(userId, id);

  if (!project) {
    notFound();
  }

  return ok(project);
}

async function updateProject(
  req: Request,
  id: string,
  deps: ProjectsDeps,
): Promise<Response> {
  const { userId, store } = await requireUser(req, deps);

  const body = await req.json().catch(() => null);
  const validation = validateUpdateProject(body);

  if (!validation.valid) {
    validationError(
      validation.message,
      validation.field,
    );
  }

  const project = await store.update(
    userId,
    id,
    validation.dto,
  );

  if (!project) {
    notFound();
  }

  return ok(project);
}

async function deleteProject(
  req: Request,
  id: string,
  deps: ProjectsDeps,
): Promise<Response> {
  const { userId, store } = await requireUser(req, deps);

  const deleted = await store.delete(userId, id);

  if (!deleted) {
    notFound();
  }

  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export function createProjectsHandler(
  deps: ProjectsDeps = defaultDeps,
) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        headers: corsHeaders,
      });
    }

    try {
      const path = routePath(new URL(req.url));

      if (path.length === 0) {
        if (req.method === "GET") {
          return await listProjects(req, deps);
        }

        if (req.method === "POST") {
          return await createProject(req, deps);
        }

        throw new HttpError(
          405,
          "INVALID_REQUEST",
          "Use GET /projects or POST /projects.",
        );
      }

      if (path.length === 1) {
        const id = path[0];

        if (req.method === "GET") {
          return await getProject(req, id, deps);
        }

        if (req.method === "PATCH") {
          return await updateProject(req, id, deps);
        }

        if (req.method === "DELETE") {
          return await deleteProject(req, id, deps);
        }

        throw new HttpError(
          405,
          "INVALID_REQUEST",
          "Use GET, PATCH, or DELETE for /projects/:id.",
        );
      }

      throw new HttpError(
        404,
        "RESOURCE_NOT_FOUND",
        "Project route not found.",
      );
    } catch (error) {
      return fail(error);
    }
  };
}

export const handleProjectsRequest = createProjectsHandler();
