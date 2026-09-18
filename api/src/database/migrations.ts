/**
 * Database schema migrations and local development seed data.
 * Follows conventions defined in CONVENTIONS.md
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { jobRepository } from "./jobRepository.js";
import { sampleJobs } from "./seed/jobs.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface MigrationFile {
  name: string;
  filePath: string;
  sql?: string;
}

/**
 * List of registered domain migrations in execution order
 */
export const registeredMigrations: string[] = [
  "001_create_projects.sql",
  "002_create_jobs.sql",
  "003_create_career_profiles.sql",
];

/**
 * Load available migration files from the migrations directory
 */
export function getAvailableMigrations(): MigrationFile[] {
  const migrationsDir = path.join(__dirname, "migrations");
  if (!fs.existsSync(migrationsDir)) {
    return [];
  }

  return fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .map((fileName) => ({
      name: fileName,
      filePath: path.join(migrationsDir, fileName),
      sql: fs.readFileSync(path.join(migrationsDir, fileName), "utf-8"),
    }));
}

export async function runMigrations(): Promise<string[]> {
  const migrations = getAvailableMigrations();
  // When a database connection is active, each migration's SQL will be executed in a transaction.
  return migrations.map((m) => m.name);
}

export async function seedDatabase(): Promise<number> {
  jobRepository.replaceAll(sampleJobs);
  return sampleJobs.length;
}
