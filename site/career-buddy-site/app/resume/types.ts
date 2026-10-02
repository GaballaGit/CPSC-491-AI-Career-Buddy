// Skill - Shared skill contract shape (api/src/utils/skills.ts)
export interface Skill {
  name: string;
  key: string;
}

// Upload Result - What the resume function returns on success
export interface ResumeUploadData {
  filename: string;
  sizeBytes: number;
  characters: number;
  text: string;
  skills: Skill[];
}

// Saved Skills - GET /resume/skills; filename is null before the first upload
export interface SavedResumeSkills {
  filename: string | null;
  skills: Skill[];
  updatedAt: string | null;
}

// AI Feedback - POST /resume/feedback; targetRole is null without a profile
export interface ResumeFeedback {
  strengths: string[];
  weaknesses: string[];
  missing_skills: string[];
  suggestions: string[];
  targetRole: string | null;
}

// Error Payload - Shared API error shape
export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: { field: string; message: string }[];
}
