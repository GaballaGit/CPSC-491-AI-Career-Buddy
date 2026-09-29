/** Current user from the request's Supabase JWT, plus a client scoped to that user. */
import {
  createClient,
  type SupabaseClient,
} from "npm:@supabase/supabase-js@^2";

export interface AuthContext {
  userId: string;
  db: SupabaseClient;
}

// Authenticate - Null for missing, anon-only, or invalid tokens
export async function authenticate(req: Request): Promise<AuthContext | null> {
  const header = req.headers.get("Authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anonKey) throw new Error("Supabase env vars are not set.");

  // User Client - RLS applies as this user
  const db = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) return null;
  return { userId: data.user.id, db };
}
