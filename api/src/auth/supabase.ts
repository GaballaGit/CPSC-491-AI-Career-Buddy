import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

let authClient: SupabaseClient | null = null;

export function getSupabaseAuthClient(): SupabaseClient {
  if (authClient) return authClient;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase Auth is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.",
    );
  }

  authClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return authClient;
}

export async function getUserFromAccessToken(token: string): Promise<User | null> {
  if (process.env.SUPABASE_AUTH_TEST_USERS) {
    const users = JSON.parse(process.env.SUPABASE_AUTH_TEST_USERS) as Record<
      string,
      { id: string; email: string }
    >;
    const user = users[token];
    return user
      ? ({
          id: user.id,
          email: user.email,
          app_metadata: {},
          user_metadata: {},
          aud: "authenticated",
          created_at: new Date().toISOString(),
        } as User)
      : null;
  }

  const { data, error } = await getSupabaseAuthClient().auth.getUser(token);

  if (error) return null;
  return data.user ?? null;
}
