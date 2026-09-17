-- Migration: 002_create_career_profiles.sql
-- Description: Create career_profiles table storing each user's target career,
--              experience level, skills, learning preferences, and weekly availability
-- Author: Jim Alvarez (Member 1 — Career Profile)
-- Sprint: Sprint 1 (Foundation)

-- 1. Ensure required extensions exist
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create career_profiles table
CREATE TABLE IF NOT EXISTS career_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE
        REFERENCES auth.users(id)
        ON DELETE CASCADE,
    target_career VARCHAR(100) NOT NULL
        CHECK (char_length(target_career) BETWEEN 1 AND 100),
    experience_level VARCHAR(20) NOT NULL
        CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
    skills TEXT[] NOT NULL DEFAULT '{}',
    learning_preferences TEXT[] NOT NULL DEFAULT '{}',
    weekly_availability_hours SMALLINT NOT NULL
        CHECK (weekly_availability_hours BETWEEN 1 AND 168),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create performance index
-- One profile per user (enforced by the UNIQUE constraint above); this index
-- keeps existence checks and other-subsystem joins (Resume/Job/Portfolio) fast.
CREATE INDEX IF NOT EXISTS idx_career_profiles_user_id ON career_profiles(user_id);

-- 4. Enable Row Level Security (RLS) for Supabase / PostgreSQL
ALTER TABLE career_profiles ENABLE ROW LEVEL SECURITY;

-- 5. Define RLS Policies ensuring strict multi-tenant isolation
-- Note: In Supabase, auth.uid() returns the authenticated user's UUID.
-- For standard PostgreSQL connections, application-layer user_id enforcement is also required.

DROP POLICY IF EXISTS "Users can view their own career profile" ON career_profiles;
CREATE POLICY "Users can view their own career profile"
    ON career_profiles FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own career profile" ON career_profiles;
CREATE POLICY "Users can insert their own career profile"
    ON career_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own career profile" ON career_profiles;
CREATE POLICY "Users can update their own career profile"
    ON career_profiles FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own career profile" ON career_profiles;
CREATE POLICY "Users can delete their own career profile"
    ON career_profiles FOR DELETE
    USING (auth.uid() = user_id);

-- 6. Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_career_profiles_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_career_profiles_updated_at ON career_profiles;
CREATE TRIGGER trigger_career_profiles_updated_at
    BEFORE UPDATE ON career_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_career_profiles_updated_at_column();
