import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

export interface CareerProfile {
  skills: string[];
}

export interface CareerProfileStore {
  findByUser(userId: string): Promise<CareerProfile | null>;
}

export function supabaseCareerProfileStore(
  db: SupabaseClient,
): CareerProfileStore {
  return {
    async findByUser(userId) {
      const { data, error } = await db
        .from("career_profiles")
        .select("skills")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        throw new Error(`Could not read career profile: ${error.message}`);
      }
      return (data as CareerProfile | null) ?? null;
    },
  };
}
