/** Reads and writes Career Profiles in Supabase, always scoped to one user. */
import "dotenv/config";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type {
  CareerProfile,
  CreateCareerProfileDto,
} from "../entities/index.js";

let client: SupabaseClient | null = null;

// TODO: switch to the shared getDatabaseClient() once it lands on main (PR #20).
function getClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase is not configured. See docs/database.md.");
  }

  client = createClient(url, key);
  return client;
}

export const careerProfileRepository = {
  // One profile per user (user_id is UNIQUE), so re-submitting onboarding
  // replaces the existing profile instead of failing.
  async upsertForUser(
    userId: string,
    dto: CreateCareerProfileDto,
  ): Promise<CareerProfile> {
    const { data, error } = await getClient()
      .from("career_profiles")
      .upsert({ user_id: userId, ...dto }, { onConflict: "user_id" })
      .select()
      .single();

    if (error) {
      throw new Error(`Could not save career profile: ${error.message}`);
    }
    return data as CareerProfile;
  },
};
