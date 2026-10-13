import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import type {
  CreateProjectInput,
  Project,
  UpdateProjectInput,
} from "./types.ts";

export interface ProjectStore {
  create(
    userId: string,
    input: CreateProjectInput,
  ): Promise<Project>;

  findByUser(userId: string): Promise<Project[]>;

  findById(
    userId: string,
    id: string,
  ): Promise<Project | null>;

  update(
    userId: string,
    id: string,
    input: UpdateProjectInput,
  ): Promise<Project | null>;

  delete(
    userId: string,
    id: string,
  ): Promise<boolean>;
}

export function supabaseProjectStore(
  db: SupabaseClient,
): ProjectStore {
  return {
    async create(userId, input) {
      const { data, error } = await db
        .from("projects")
        .insert({
          user_id: userId,
          title: input.title,
          description: input.description,
          skills_demonstrated: input.skills_demonstrated,
          project_urls: input.project_urls ?? [],
          status: input.status ?? "in_progress",
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create project: ${error.message}`);
      }

      return data as Project;
    },

    async findByUser(userId) {
      const { data, error } = await db
        .from("projects")
        .select()
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(
          `Failed to retrieve projects: ${error.message}`,
        );
      }

      return (data ?? []) as Project[];
    },

    async findById(userId, id) {
      const { data, error } = await db
        .from("projects")
        .select()
        .eq("id", id)
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        throw new Error(
          `Failed to retrieve project: ${error.message}`,
        );
      }

      return (data as Project | null) ?? null;
    },

    async update(userId, id, input) {
      const { data, error } = await db
        .from("projects")
        .update(input)
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to update project: ${error.message}`);
      }

      return (data as Project | null) ?? null;
    },

    async delete(userId, id) {
      const { data, error } = await db
        .from("projects")
        .delete()
        .eq("id", id)
        .eq("user_id", userId)
        .select("id")
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to delete project: ${error.message}`);
      }

      return data !== null;
    },
  };
}
