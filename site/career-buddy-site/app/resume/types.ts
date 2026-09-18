// Upload Result - What the resume endpoint returns on success
export interface ResumeUploadData {
  filename: string;
  sizeBytes: number;
  characters: number;
  text: string;
}

// Error Payload - Shared API error shape
export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: { field: string; message: string }[];
}

export type ResumeUploadResponse =
  | { success: true; data: ResumeUploadData; meta: { timestamp: string } }
  | { success: false; error: ApiErrorPayload };
