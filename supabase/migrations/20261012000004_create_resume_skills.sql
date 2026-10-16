-- Migration: 004_create_resume_skills.sql
-- Description: Store the skills found in each user's latest resume upload.
--              One row per user; a new upload replaces the previous row.
-- Author: William Wang (Member 2 — Resume Intelligence)
-- Sprint: Sprint 2 (C40CS-12)

-- 1. Create resume_skills table
-- skills holds display names from the shared skill contract (api/src/utils/skills.ts).
CREATE TABLE IF NOT EXISTS resume_skills (
    user_id UUID PRIMARY KEY
        REFERENCES auth.users(id)
        ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    skills TEXT[] NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE resume_skills ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies - Each user sees and changes only their own row
DROP POLICY IF EXISTS "Users can view their own resume skills" ON resume_skills;
CREATE POLICY "Users can view their own resume skills"
    ON resume_skills FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own resume skills" ON resume_skills;
CREATE POLICY "Users can insert their own resume skills"
    ON resume_skills FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own resume skills" ON resume_skills;
CREATE POLICY "Users can update their own resume skills"
    ON resume_skills FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own resume skills" ON resume_skills;
CREATE POLICY "Users can delete their own resume skills"
    ON resume_skills FOR DELETE
    USING (auth.uid() = user_id);
