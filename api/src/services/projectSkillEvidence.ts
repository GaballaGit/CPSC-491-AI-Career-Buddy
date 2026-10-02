import type { Project } from "../entities/project.js";
import { normalizeSkills, type Skill } from "../utils/skills.js";

/**
 * Return normalized skill evidence from completed portfolio projects.
 *
 * In-progress projects do not count as completed skill evidence.
 */
export function getCompletedProjectSkills(
  projects: readonly Project[],
): Skill[] {
  const demonstratedSkills = projects
    .filter((project) => project.status === "completed")
    .flatMap((project) => project.skills_demonstrated);

  return normalizeSkills(demonstratedSkills);
}
