import type { RequiredSkill } from "../entities/job.js";
import { compareSkills, normalizeSkills, type Skill } from "../utils/skills.js";

export interface JobSkillMatchInput {
  requiredSkills: readonly RequiredSkill[];
  profileSkills?: readonly string[];
  resumeSkills?: readonly string[];
}

export interface JobSkillMatch {
  matched: Skill[];
  missing: Skill[];
  /** Percentage of required skills matched. Jobs with no required skills score 100. */
  score: number;
}

/**
 * Compares a job's required skills with the user's known skills.
 *
 * User skills come from the career profile plus optional resume-derived skills.
 * Both sources are normalized through the shared skill contract, so duplicate,
 * case-variant, and aliased skills only count once.
 */
export function computeJobSkillMatch({
  requiredSkills,
  profileSkills = [],
  resumeSkills = [],
}: JobSkillMatchInput): JobSkillMatch {
  const required = normalizeSkills(requiredSkills.map((skill) => skill.name));
  const known = normalizeSkills([...profileSkills, ...resumeSkills]);
  const { matched, missing } = compareSkills(known, required);
  const score =
    required.length === 0
      ? 100
      : Math.round((matched.length / required.length) * 100);

  return { matched, missing, score };
}
