import { getSupabaseClient } from "./supabase";

/**
 * Best-effort fetch of the signed-in user's resume-derived skills, for the
 * profile edit flow's "import from resume" step (C40CS-8). Returns an empty
 * list rather than throwing on any failure — no resume uploaded yet, not
 * signed in, or the resume Edge Function isn't deployed (C40CS-15) are all
 * just "nothing to offer", not errors this page should surface.
 */
export async function getResumeSkills(): Promise<string[]> {
  try {
    const { data, error } = await getSupabaseClient().functions.invoke(
      "resume/skills",
      { method: "GET" },
    );
    if (error) return [];

    const skills = (data as { data?: { skills?: unknown } } | null)?.data
      ?.skills;
    if (!Array.isArray(skills)) return [];

    return skills
      .map((skill) =>
        typeof skill === "object" && skill !== null && "name" in skill
          ? String((skill as { name: unknown }).name)
          : null,
      )
      .filter((name): name is string => name !== null);
  } catch {
    return [];
  }
}
