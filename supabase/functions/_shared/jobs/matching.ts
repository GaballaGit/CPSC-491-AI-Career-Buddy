import type { RequiredSkill } from "./repository.ts";
import {
  compareSkills,
  normalizeSkills,
  type Skill,
} from "../../../../api/src/utils/skills.ts";

export interface JobSkillMatchInput {
  requiredSkills: readonly RequiredSkill[];
  profileSkills?: readonly string[];
}

export interface JobSkillMatch {
  matched: Skill[];
  missing: Skill[];
  score: number;
}

export function computeJobSkillMatch({
  requiredSkills,
  profileSkills = [],
}: JobSkillMatchInput): JobSkillMatch {
  const required = normalizeSkills(requiredSkills.map((skill) => skill.name));
  const known = normalizeSkills(profileSkills);
  const { matched, missing } = compareSkills(known, required);
  const score = required.length === 0
    ? 100
    : Math.round((matched.length / required.length) * 100);

  return { matched, missing, score };
}
