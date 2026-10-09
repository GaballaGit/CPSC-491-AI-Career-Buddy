/** Current user from the request's Supabase JWT, plus a client scoped to that user. */
import {
  createClient,
  type SupabaseClient,
} from "npm:@supabase/supabase-js@^2";

export interface AuthContext {
  userId: string;
  db: SupabaseClient;
}

interface AuthDeps {
  getEnv(name: string): string | undefined;
  createClient: typeof createClient;
}

const defaultDeps: AuthDeps = {
  getEnv: (name) => Deno.env.get(name),
  createClient,
};

/** Create an authenticator with injectable environment/client dependencies for tests. */
export function createAuthenticator(deps: AuthDeps = defaultDeps) {
  return async function authenticate(
    req: Request,
  ): Promise<AuthContext | null> {
    const header = req.headers.get("Authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) return null;

    const url = deps.getEnv("SUPABASE_URL");
    const anonKey = deps.getEnv("SUPABASE_ANON_KEY");
    if (!url || !anonKey) throw new Error("Supabase env vars are not set.");

    // User Client - RLS applies as this user
    const db = deps.createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await db.auth.getUser(token);
    if (error || !data.user) return null;
    return { userId: data.user.id, db };
  };
}

export const authenticate = createAuthenticator();
