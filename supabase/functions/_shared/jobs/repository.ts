import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

export interface RequiredSkill {
  name: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  category: string;
  required_skills: RequiredSkill[];
  created_at: string;
  updated_at: string;
}

interface JobRow {
  id: string;
  title: string;
  description: string;
  category: string;
  created_at: string;
  updated_at: string;
  job_required_skills?: { skill: string }[];
}

export interface JobStore {
  list(category?: string): Promise<Job[]>;
  findById(id: string): Promise<Job | null>;
}

function toJob(row: JobRow): Job {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    created_at: row.created_at,
    updated_at: row.updated_at,
    required_skills: (row.job_required_skills ?? []).map(({ skill }) => ({
      name: skill,
    })),
  };
}

const JOB_SELECT =
  "id, title, description, category, created_at, updated_at, job_required_skills(skill)";

export function supabaseJobStore(db: SupabaseClient): JobStore {
  return {
    async list(category) {
      let query = db.from("jobs").select(JOB_SELECT).order("title");
      if (category) query = query.ilike("category", category.trim());

      const { data, error } = await query;
      if (error) throw new Error(`Could not read jobs: ${error.message}`);
      return ((data ?? []) as JobRow[]).map(toJob);
    },

    async findById(id) {
      const { data, error } = await db
        .from("jobs")
        .select(JOB_SELECT)
        .eq("id", id)
        .maybeSingle();

      if (error) throw new Error(`Could not read job: ${error.message}`);
      return data ? toJob(data as JobRow) : null;
    },
  };
}
