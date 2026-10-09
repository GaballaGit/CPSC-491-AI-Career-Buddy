/** Career Profile function (C40CS-32): read (GET /profile) and create or
 * replace (POST /profile) the signed-in user's profile.
 */
import { type AuthContext, authenticate } from "../_shared/auth.ts";
import { corsHeaders, fail, HttpError, ok } from "../_shared/http.ts";
import {
  type CareerProfileStore,
  supabaseCareerProfileStore,
} from "../_shared/profile/repository.ts";
import { validateCareerProfile } from "../_shared/profile/validate.ts";

export interface ProfileDeps {
  authenticate(req: Request): Promise<AuthContext | null>;
  store(auth: AuthContext): CareerProfileStore;
}

const defaultDeps: ProfileDeps = {
  authenticate,
  store: (auth) => supabaseCareerProfileStore(auth.db),
};

function routePath(url: URL): string[] {
  const parts = url.pathname.split("/").filter(Boolean);
  const functionIndex = parts.indexOf("profile");
  return functionIndex >= 0 ? parts.slice(functionIndex + 1) : [];
}

// Sign-in Check - Same 401 as the Express requireAuthentication middleware
async function requireUser(req: Request, deps: ProfileDeps) {
  const auth = await deps.authenticate(req);
  if (!auth) {
    throw new HttpError(
      401,
      "AUTHENTICATION_REQUIRED",
      "Authentication required. Please provide a valid Bearer token.",
    );
  }
  return { userId: auth.userId, store: deps.store(auth) };
}

// Read - No profile yet is normal for a new user, so 200 with data: null
async function getProfile(req: Request, deps: ProfileDeps) {
  const { userId, store } = await requireUser(req, deps);
  return ok(await store.findByUser(userId));
}

// Save - user_id always comes from the token, never the body
async function saveProfile(req: Request, deps: ProfileDeps) {
  const { userId, store } = await requireUser(req, deps);
  const body = await req.json().catch(() => null);
  const input = validateCareerProfile(body);
  return ok(await store.upsertForUser(userId, input), 201);
}

export function createProfileHandler(deps: ProfileDeps = defaultDeps) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    try {
      const path = routePath(new URL(req.url));
      if (path.length > 0) {
        throw new HttpError(
          404,
          "RESOURCE_NOT_FOUND",
          "Profile route not found.",
        );
      }

      if (req.method === "GET") return await getProfile(req, deps);
      if (req.method === "POST") return await saveProfile(req, deps);

      throw new HttpError(
        405,
        "INVALID_REQUEST",
        "Use GET /profile or POST /profile.",
      );
    } catch (error) {
      return fail(error);
    }
  };
}

export const handleProfileRequest = createProfileHandler();
