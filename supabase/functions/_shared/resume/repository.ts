/** Resume skill storage: one row per user, replaced on each upload. */
import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import {
  normalizeSkills,
  type Skill,
} from "../../../../api/src/utils/skills.ts";

export interface ResumeSkills {
  filename: string;
  skills: Skill[];
  updatedAt: string;
}

export interface ResumeSkillStore {
  save(userId: string, filename: string, skills: Skill[]): Promise<void>;
  load(userId: string): Promise<ResumeSkills | null>;
}

// Supabase Store - Table resume_skills (migration 004)
export function supabaseResumeSkillStore(
  db: SupabaseClient,
): ResumeSkillStore {
  return {
    async save(userId, filename, skills) {
      const { error } = await db.from("resume_skills").upsert({
        user_id: userId,
        filename,
        skills: skills.map((s) => s.name),
        updated_at: new Date().toISOString(),
      });
      if (error) {
        throw new Error(`Could not save resume skills: ${error.message}`);
      }
    },

    async load(userId) {
      const { data, error } = await db
        .from("resume_skills")
        .select("filename, skills, updated_at")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) {
        throw new Error(`Could not read resume skills: ${error.message}`);
      }
      if (!data) return null;
      return {
        filename: data.filename,
        skills: normalizeSkills(data.skills ?? []),
        updatedAt: data.updated_at,
      };
    },
  };
}
