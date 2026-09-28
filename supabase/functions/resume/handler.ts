/** Resume function: upload (POST /resume) and saved skills (GET /resume/skills). */
import { type AuthContext, authenticate } from "../_shared/auth.ts";
import { corsHeaders, fail, HttpError, ok } from "../_shared/http.ts";
import { extractResumeText } from "../_shared/resume/extract.ts";
import {
  type ResumeSkillStore,
  supabaseResumeSkillStore,
} from "../_shared/resume/repository.ts";
import { extractSkills } from "../_shared/resume/skills.ts";
import { validateResumeFile } from "../_shared/resume/validate.ts";

export interface ResumeDeps {
  authenticate(req: Request): Promise<AuthContext | null>;
  store(auth: AuthContext): ResumeSkillStore;
}

const defaultDeps: ResumeDeps = {
  authenticate,
  store: (auth) => supabaseResumeSkillStore(auth.db),
};

// Sign-in Check - 401 when there is no real user
async function requireUser(req: Request, deps: ResumeDeps) {
  const auth = await deps.authenticate(req);
  if (!auth) {
    throw new HttpError(
      401,
      "AUTHENTICATION_REQUIRED",
      "Sign in to use resume features.",
    );
  }
  return { userId: auth.userId, store: deps.store(auth) };
}

// Upload - Validate, extract text and skills, save for this user
async function upload(req: Request, deps: ResumeDeps): Promise<Response> {
  const { userId, store } = await requireUser(req, deps);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new HttpError(
      400,
      "INVALID_REQUEST",
      "Request must be multipart/form-data with a file field.",
    );
  }

  const file = validateResumeFile(form.get("file"));
  const bytes = new Uint8Array(await file.arrayBuffer());
  const text = await extractResumeText(bytes, file.name);
  const skills = extractSkills(text);

  await store.save(userId, file.name, skills);

  return ok({
    filename: file.name,
    sizeBytes: file.size,
    characters: text.length,
    text,
    skills,
  });
}

// Saved Skills - Current user's latest resume skills
async function savedSkills(req: Request, deps: ResumeDeps): Promise<Response> {
  const { userId, store } = await requireUser(req, deps);
  const saved = await store.load(userId);
  return ok(saved ?? { filename: null, skills: [], updatedAt: null });
}

export function createResumeHandler(deps: ResumeDeps = defaultDeps) {
  return async (req: Request): Promise<Response> => {
    // Preflight - CORS
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    try {
      const path = new URL(req.url).pathname;

      if (req.method === "POST" && !path.endsWith("/skills")) {
        return await upload(req, deps);
      }
      if (req.method === "GET" && path.endsWith("/skills")) {
        return await savedSkills(req, deps);
      }

      throw new HttpError(
        405,
        "INVALID_REQUEST",
        "Use POST /resume to upload or GET /resume/skills to read skills.",
      );
    } catch (error) {
      return fail(error);
    }
  };
}

export const handleResumeRequest = createResumeHandler();
