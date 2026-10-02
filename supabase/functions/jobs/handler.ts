/** Jobs function: list (GET /jobs) and detail (GET /jobs/:id). */
import {
  createClient,
  type SupabaseClient,
} from "npm:@supabase/supabase-js@^2";
import { type AuthContext, authenticate } from "../_shared/auth.ts";
import { corsHeaders, fail, HttpError, ok } from "../_shared/http.ts";
import {
  type CareerProfileStore,
  supabaseCareerProfileStore,
} from "../_shared/jobs/profile.ts";
import {
  type Job,
  type JobStore,
  supabaseJobStore,
} from "../_shared/jobs/repository.ts";
import {
  computeJobSkillMatch,
  type JobSkillMatch,
} from "../_shared/jobs/matching.ts";

export type JobMatchStatus = "signed_out" | "profile_missing" | "available";

type JobWithMatch = Job & { match?: JobSkillMatch };

export interface JobsDeps {
  authenticate(req: Request): Promise<AuthContext | null>;
  publicDb(): SupabaseClient;
  jobs(db: SupabaseClient): JobStore;
  profiles(db: SupabaseClient): CareerProfileStore;
}

function publicDb(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anonKey) throw new Error("Supabase env vars are not set.");

  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const defaultDeps: JobsDeps = {
  authenticate,
  publicDb,
  jobs: (db) => supabaseJobStore(db),
  profiles: (db) => supabaseCareerProfileStore(db),
};

function integerParam(
  url: URL,
  name: string,
  fallback: number,
  min: number,
  max: number,
): number {
  const value = Number(url.searchParams.get(name) ?? fallback);
  if (!Number.isInteger(value)) {
    throw new HttpError(400, "VALIDATION_ERROR", `${name} must be an integer`);
  }
  return Math.min(max, Math.max(min, value));
}

async function addMatchData(
  jobs: Job[],
  auth: AuthContext | null,
  deps: JobsDeps,
): Promise<{ jobs: JobWithMatch[]; status: JobMatchStatus }> {
  if (!auth) return { jobs, status: "signed_out" };

  const profile = await deps.profiles(auth.db).findByUser(auth.userId);
  if (!profile) return { jobs, status: "profile_missing" };

  return {
    jobs: jobs.map((job) => ({
      ...job,
      match: computeJobSkillMatch({
        requiredSkills: job.required_skills,
        profileSkills: profile.skills,
      }),
    })),
    status: "available",
  };
}

function routePath(url: URL): string[] {
  const parts = url.pathname.split("/").filter(Boolean);
  const functionIndex = parts.indexOf("jobs");
  return functionIndex >= 0 ? parts.slice(functionIndex + 1) : [];
}

async function listJobs(
  req: Request,
  auth: AuthContext | null,
  deps: JobsDeps,
): Promise<Response> {
  const url = new URL(req.url);
  const page = integerParam(url, "page", 1, 1, Number.MAX_SAFE_INTEGER);
  const limit = integerParam(url, "limit", 20, 1, 50);
  const category = url.searchParams.get("category") ?? undefined;
  const allJobs = await deps.jobs(deps.publicDb()).list(category);
  const start = (page - 1) * limit;
  const { jobs, status } = await addMatchData(
    allJobs.slice(start, start + limit),
    auth,
    deps,
  );

  return ok(jobs, 200, {
    matching: { status },
    pagination: {
      page,
      limit,
      total: allJobs.length,
      totalPages: Math.ceil(allJobs.length / limit),
    },
  });
}

async function getJob(
  id: string,
  auth: AuthContext | null,
  deps: JobsDeps,
): Promise<Response> {
  const job = await deps.jobs(deps.publicDb()).findById(id);
  if (!job) throw new HttpError(404, "RESOURCE_NOT_FOUND", "Job not found.");

  const { jobs, status } = await addMatchData([job], auth, deps);
  return ok(jobs[0], 200, { matching: { status } });
}

export function createJobsHandler(deps: JobsDeps = defaultDeps) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    try {
      if (req.method !== "GET") {
        throw new HttpError(
          405,
          "INVALID_REQUEST",
          "Use GET /jobs or GET /jobs/:id.",
        );
      }

      const url = new URL(req.url);
      const path = routePath(url);
      const auth = await deps.authenticate(req);

      if (path.length === 0) return await listJobs(req, auth, deps);
      if (path.length === 1) return await getJob(path[0], auth, deps);

      throw new HttpError(404, "RESOURCE_NOT_FOUND", "Job route not found.");
    } catch (error) {
      return fail(error);
    }
  };
}

export const handleJobsRequest = createJobsHandler();
