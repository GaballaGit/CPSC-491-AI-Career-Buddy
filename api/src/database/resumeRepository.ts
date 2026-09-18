/** Reads and writes resume records in Supabase. */
import "dotenv/config";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface ResumeRecord {
  id: string;
  filename: string;
  fileSize: number;
  characters: number;
  extractedText: string;
  createdAt: string;
}

export interface NewResume {
  filename: string;
  fileSize: number;
  extractedText: string;
}

let client: SupabaseClient | null = null;

// Client - Created once, on first use
function getClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase is not configured. See docs/database.md.");
  }

  client = createClient(url, key);
  return client;
}

// Mapping - Database columns are snake_case, our code is camelCase
interface ResumeRow {
  id: string;
  filename: string;
  file_size: number;
  characters: number;
  extracted_text: string;
  created_at: string;
}

function toRecord(row: ResumeRow): ResumeRecord {
  return {
    id: row.id,
    filename: row.filename,
    fileSize: row.file_size,
    characters: row.characters,
    extractedText: row.extracted_text,
    createdAt: row.created_at,
  };
}

// Save - Store one resume and return what was written
export async function saveResume(resume: NewResume): Promise<ResumeRecord> {
  const { data, error } = await getClient()
    .from("resumes")
    .insert({
      filename: resume.filename,
      file_size: resume.fileSize,
      characters: resume.extractedText.length,
      extracted_text: resume.extractedText,
    })
    .select()
    .single();

  if (error) throw new Error(`Could not save resume: ${error.message}`);
  return toRecord(data as ResumeRow);
}

// Fetch - Look one up by id, null when it does not exist
export async function getResumeById(id: string): Promise<ResumeRecord | null> {
  const { data, error } = await getClient()
    .from("resumes")
    .select()
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Could not read resume: ${error.message}`);
  return data ? toRecord(data as ResumeRow) : null;
}
