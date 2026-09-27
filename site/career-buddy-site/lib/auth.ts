import { getSupabaseClient } from "./supabase";

export async function getAccessToken(): Promise<string> {
  const { data, error } = await getSupabaseClient().auth.getSession();

  if (error || !data.session?.access_token) {
    throw new Error("Sign in to continue.");
  }

  return data.session.access_token;
}

export async function authHeaders(): Promise<Record<string, string>> {
  return {
    Authorization: `Bearer ${await getAccessToken()}`,
  };
}
