/** Reads and writes Career Profiles through the user's own client (RLS applies). */
import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";
import type { CareerProfileInput } from "./validate.ts";

export interface CareerProfile extends CareerProfileInput {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CareerProfileStore {
  findByUser(userId: string): Promise<CareerProfile | null>;
  upsertForUser(
    userId: string,
    input: CareerProfileInput,
  ): Promise<CareerProfile>;
}

export function supabaseCareerProfileStore(
  db: SupabaseClient,
): CareerProfileStore {
  return {
    async findByUser(userId) {
      const { data, error } = await db
        .from("career_profiles")
        .select()
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        throw new Error(`Could not read career profile: ${error.message}`);
      }
      return (data as CareerProfile | null) ?? null;
    },

    // Upsert - One profile per user (user_id is UNIQUE), so re-submitting
    // onboarding replaces the existing profile
    async upsertForUser(userId, input) {
      const { data, error } = await db
        .from("career_profiles")
        .upsert({ ...input, user_id: userId }, { onConflict: "user_id" })
        .select()
        .single();

      if (error) {
        throw new Error(`Could not save career profile: ${error.message}`);
      }
      return data as CareerProfile;
    },
  };
}
