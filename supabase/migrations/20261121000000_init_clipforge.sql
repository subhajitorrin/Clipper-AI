-- 001_initial_schema.sql
-- ClipForge AI: Core Database Schema for Jobs, Videos, and Generated Clips

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Enum types for strong state consistency
DO $$ BEGIN
    CREATE TYPE public.job_status AS ENUM ('pending', 'processing', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.pipeline_stage AS ENUM ('audio', 'transcribing', 'moments', 'rendering');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.video_source_type AS ENUM ('youtube', 'upload');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Jobs Table (Primary Queue & Project Entity)
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    source_type public.video_source_type NOT NULL DEFAULT 'youtube',
    video_url TEXT,
    video_path TEXT,
    thumbnail_url TEXT,
    duration INTEGER DEFAULT 0, -- Duration in seconds
    clip_duration INTEGER NOT NULL DEFAULT 45, -- 30, 45, or 60 seconds
    requested_clips INTEGER NOT NULL DEFAULT 3, -- 3, 5, or 10
    status public.job_status NOT NULL DEFAULT 'pending',
    current_stage public.pipeline_stage DEFAULT 'audio',
    stage_progress INTEGER DEFAULT 0 CHECK (stage_progress >= 0 AND stage_progress <= 100),
    error_message TEXT,
    claimed_at TIMESTAMPTZ,
    worker_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Clips Table (Generated 9:16 Shorts)
CREATE TABLE IF NOT EXISTS public.clips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    start_time NUMERIC(10, 2) NOT NULL, -- in seconds
    end_time NUMERIC(10, 2) NOT NULL,   -- in seconds
    duration INTEGER GENERATED ALWAYS AS (ROUND(end_time - start_time)::integer) STORED,
    thumbnail_url TEXT,
    output_url TEXT NOT NULL,
    transcript TEXT,
    aspect_ratio TEXT NOT NULL DEFAULT '9:16',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
-- 002_indexes_and_constraints.sql
-- Performance Indexes and Constraints for Fast Job Queue Processing & UI Queries

-- 1. Index for job listing (most recent projects first)
CREATE INDEX IF NOT EXISTS idx_jobs_created_at_desc ON public.jobs (created_at DESC);

-- 2. Index for filtering by status (pending jobs claimed by worker)
CREATE INDEX IF NOT EXISTS idx_jobs_status_created_at ON public.jobs (status, created_at ASC);

-- 3. Index for user-specific queries (multi-tenant support)
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON public.jobs (user_id);

-- 4. Foreign key index for clips matching parent job
CREATE INDEX IF NOT EXISTS idx_clips_job_id ON public.clips (job_id);

-- 5. Index for ordering clips by timestamp within a video
CREATE INDEX IF NOT EXISTS idx_clips_job_start_time ON public.clips (job_id, start_time ASC);

-- 6. Constraints
ALTER TABLE public.jobs
    ADD CONSTRAINT chk_source_details
    CHECK (
        (source_type = 'youtube' AND video_url IS NOT NULL) OR
        (source_type = 'upload' AND video_path IS NOT NULL)
    );

ALTER TABLE public.clips
    ADD CONSTRAINT chk_clip_time_range
    CHECK (end_time > start_time);
-- 003_rls_policies.sql
-- Simplified Row Level Security (RLS) Configuration:
-- RLS enabled with full open access for all operations (SELECT, INSERT, UPDATE, DELETE)

-- 1. Enable RLS on all tables
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clips ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies if present
DROP POLICY IF EXISTS "Allow public read access to jobs" ON public.jobs;
DROP POLICY IF EXISTS "Allow users and guests to create jobs" ON public.jobs;
DROP POLICY IF EXISTS "Allow users to update own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Allow users to delete own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Allow all access to jobs" ON public.jobs;

DROP POLICY IF EXISTS "Allow read access to clips" ON public.clips;
DROP POLICY IF EXISTS "Allow clip creation for valid jobs" ON public.clips;
DROP POLICY IF EXISTS "Allow clip deletion" ON public.clips;
DROP POLICY IF EXISTS "Allow all access to clips" ON public.clips;

-- 3. Full open access policy on public.jobs (All actions enabled)
CREATE POLICY "Allow all access to jobs"
    ON public.jobs
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 4. Full open access policy on public.clips (All actions enabled)
CREATE POLICY "Allow all access to clips"
    ON public.clips
    FOR ALL
    USING (true)
    WITH CHECK (true);
-- 004_functions_and_triggers.sql
-- Queue Processing Triggers & Atomic Job Claiming Function for Python Worker

-- 1. Auto-update updated_at timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_jobs_updated_at ON public.jobs;
CREATE TRIGGER trigger_jobs_updated_at
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_clips_updated_at ON public.clips;
CREATE TRIGGER trigger_clips_updated_at
    BEFORE UPDATE ON public.clips
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 2. Atomic Job Claim Function for Python Background Worker
-- Uses SKIP LOCKED to prevent race conditions when multiple workers run in parallel
CREATE OR REPLACE FUNCTION public.claim_next_job(worker_name TEXT DEFAULT 'worker-1')
RETURNS SETOF public.jobs AS $$
BEGIN
    RETURN QUERY
    WITH next_job AS (
        SELECT id
        FROM public.jobs
        WHERE status = 'pending'
        ORDER BY created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
    )
    UPDATE public.jobs
    SET status = 'processing',
        current_stage = 'audio',
        stage_progress = 10,
        claimed_at = timezone('utc'::text, now()),
        worker_id = worker_name,
        updated_at = timezone('utc'::text, now())
    WHERE id IN (SELECT id FROM next_job)
    RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
