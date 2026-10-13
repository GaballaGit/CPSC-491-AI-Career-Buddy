-- Migration: 001_create_projects.sql
-- Description: Create projects table for user portfolio evidence and readiness tracking
-- Author: Daniel Lee (Member 4 — Portfolio & Career Readiness)
-- Sprint: Sprint 1 (Foundation)

-- 1. Ensure required extensions exist
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL
        REFERENCES auth.users(id)
        ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL
        CHECK (char_length(title) BETWEEN 3 AND 100),
    description TEXT NOT NULL,
    skills_demonstrated TEXT[] NOT NULL DEFAULT '{}',
    project_urls TEXT[] NOT NULL DEFAULT '{}',
    status VARCHAR(50) NOT NULL DEFAULT 'in_progress'
        CHECK (status IN ('in_progress', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create performance indexes
-- Fast lookup by authenticated user
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
-- Fast filtering by project status (e.g. counting completed projects for readiness score)
CREATE INDEX IF NOT EXISTS idx_projects_user_status ON projects(user_id, status);

-- 4. Enable Row Level Security (RLS) for Supabase / PostgreSQL
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 5. Define RLS Policies ensuring strict multi-tenant isolation
-- Note: In Supabase, auth.uid() returns the authenticated user's UUID.
-- For standard PostgreSQL connections, application-layer user_id enforcement is also required.

DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
CREATE POLICY "Users can view their own projects"
    ON projects FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
CREATE POLICY "Users can insert their own projects"
    ON projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
CREATE POLICY "Users can update their own projects"
    ON projects FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
CREATE POLICY "Users can delete their own projects"
    ON projects FOR DELETE
    USING (auth.uid() = user_id);

-- 6. Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_projects_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_projects_updated_at ON projects;
CREATE TRIGGER trigger_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_projects_updated_at_column();
