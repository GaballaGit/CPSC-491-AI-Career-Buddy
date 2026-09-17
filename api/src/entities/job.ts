/** Job entity and DTOs for the Job Intelligence subsystem. */

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

export interface CreateJobDto {
  title: string;
  description: string;
  category: string;
  required_skills: RequiredSkill[];
}

export type UpdateJobDto = Partial<CreateJobDto>;
