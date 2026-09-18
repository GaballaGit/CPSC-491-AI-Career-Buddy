/** Reads and writes Career Profiles in Supabase, always scoped to one user. */
import type {
  CareerProfile,
  CreateCareerProfileDto,
} from "../entities/index.js";
import { getDatabaseClient } from "./client.js";

export const careerProfileRepository = {
  // One profile per user (user_id is UNIQUE), so re-submitting onboarding
  // replaces the existing profile instead of failing.
  async upsertForUser(
    userId: string,
    dto: CreateCareerProfileDto,
  ): Promise<CareerProfile> {
    const { data, error } = await getDatabaseClient()
      .from("career_profiles")
      .upsert({ user_id: userId, ...dto }, { onConflict: "user_id" })
      .select()
      .single();

    if (error) {
      throw new Error(`Could not save career profile: ${error.message}`);
    }
    return data as CareerProfile;
  },

  async findByUser(userId: string): Promise<CareerProfile | null> {
    const { data, error } = await getDatabaseClient()
      .from("career_profiles")
      .select()
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Could not read career profile: ${error.message}`);
    }
    return (data as CareerProfile | null) ?? null;
  },
};
