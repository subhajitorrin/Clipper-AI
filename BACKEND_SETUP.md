# ClipForge AI — Database & Backend Architecture Documentation

This document describes the complete Supabase PostgreSQL database architecture, Next.js data service layer, and future Python background worker contracts for **ClipForge AI**.

---

## 1. Database Architecture & Schema

The database is built on PostgreSQL with Supabase, engineered around an asynchronous job queue model where Next.js acts as the job creator/dashboard interface and the Python worker acts as an autonomous background consumer.

### Tables

#### 1. `public.jobs`
Stores video clipping jobs created by users or guest creators.

| Column | Type | Constraints / Defaults | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique job identifier |
| `user_id` | `UUID` | `REFERENCES auth.users(id) ON DELETE SET NULL` | Creator user ID (optional / guest support) |
| `title` | `TEXT` | `NOT NULL` | Project / Video title |
| `source_type` | `public.video_source_type` | `NOT NULL DEFAULT 'youtube'` | `'youtube'` or `'upload'` |
| `video_url` | `TEXT` | `NULLABLE` | Source YouTube URL (validated) |
| `video_path` | `TEXT` | `NULLABLE` | Uploaded video filename / Supabase Storage path |
| `thumbnail_url` | `TEXT` | `NULLABLE` | Video preview thumbnail |
| `duration` | `INTEGER` | `DEFAULT 0` | Total video duration in seconds |
| `clip_duration` | `INTEGER` | `NOT NULL DEFAULT 45` | Target duration: 30, 45, or 60 seconds |
| `requested_clips`| `INTEGER` | `NOT NULL DEFAULT 3` | Number of clips: 3, 5, or 10 |
| `status` | `public.job_status` | `NOT NULL DEFAULT 'pending'` | `'pending'`, `'processing'`, `'completed'`, `'failed'` |
| `current_stage` | `public.pipeline_stage` | `DEFAULT 'audio'` | `'audio'`, `'transcribing'`, `'moments'`, `'rendering'` |
| `stage_progress`| `INTEGER` | `DEFAULT 0 (0-100)` | Percentage completion of current stage |
| `error_message` | `TEXT` | `NULLABLE` | Error diagnostics if job failed |
| `claimed_at` | `TIMESTAMPTZ` | `NULLABLE` | Timestamp when worker locked the job |
| `worker_id` | `TEXT` | `NULLABLE` | Identifier of worker processing the job |
| `metadata` | `JSONB` | `DEFAULT '{}'` | Additional worker metadata |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT timezone('utc', now())` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT timezone('utc', now())` | Auto-updated via trigger |

#### 2. `public.clips`
Stores the resulting short-form 9:16 vertical videos rendered by the Python worker.

| Column | Type | Constraints / Defaults | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique clip identifier |
| `job_id` | `UUID` | `NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE` | Parent job foreign key |
| `title` | `TEXT` | `NOT NULL` | AI-generated viral hook title |
| `start_time` | `NUMERIC(10, 2)` | `NOT NULL` | Original video start timestamp in seconds |
| `end_time` | `NUMERIC(10, 2)` | `NOT NULL` | Original video end timestamp in seconds |
| `duration` | `INTEGER` | `GENERATED ALWAYS AS (ROUND(end_time - start_time)::integer) STORED` | Calculated duration in seconds |
| `thumbnail_url` | `TEXT` | `NULLABLE` | Generated clip cover / poster |
| `output_url` | `TEXT` | `NOT NULL` | URL to final MP4 video file |
| `transcript` | `TEXT` | `NULLABLE` | Highlighted spoken transcript text |
| `aspect_ratio` | `TEXT` | `NOT NULL DEFAULT '9:16'` | Video aspect ratio |
| `metadata` | `JSONB` | `DEFAULT '{}'` | Virality score, keywords, face tracking data |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT timezone('utc', now())` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT timezone('utc', now())` | Auto-updated via trigger |

---

## 2. Table Relationships & Constraints
- **One-to-Many**: `public.jobs.id` 1 ── ∞ `public.clips.job_id` with `ON DELETE CASCADE`.
- **User Relationship**: `public.jobs.user_id` references `auth.users(id)` with `ON DELETE SET NULL` to preserve clips if an account is deleted.
- **Integrity Constraints**:
  - `chk_source_details`: Ensures either `video_url` (for YouTube) or `video_path` (for uploads) is present.
  - `chk_clip_time_range`: Enforces `end_time > start_time`.
- **Performance Indexes**:
  - `idx_jobs_created_at_desc`: Fast sorting for Dashboard recent projects list.
  - `idx_jobs_status_created_at`: High-speed queue lookup for workers claiming pending jobs.
  - `idx_clips_job_id`: Fast join when loading the Results screen.
  - `idx_clips_job_start_time`: Chronological ordering of clips within a project.

---

## 3. SQL Migrations & Manual Execution Instructions

All migration scripts are located in `supabase/migrations/`:

1. `001_initial_schema.sql`: Core tables, enums (`job_status`, `pipeline_stage`, `video_source_type`).
2. `002_indexes_and_constraints.sql`: Indexes and integrity check constraints.
3. `003_rls_policies.sql`: Row Level Security enabled on all tables with full open access (`FOR ALL USING (true) WITH CHECK (true)`).
4. `004_functions_and_triggers.sql`: Auto-updating timestamps and the `claim_next_job()` queue function.

### Using Supabase CLI:
```bash
# Link to your Supabase project (if not already linked)
supabase link --project-ref otzayjzhoblhwkgftoca

# Push migrations to remote database
supabase db push
```

Or for local development:
```bash
supabase migration up
```

### Or Manually via Supabase Dashboard SQL Editor:
1. Open your Supabase Dashboard: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: `otzayjzhoblhwkgftoca`
3. Navigate to **SQL Editor** in the left sidebar.
4. Copy and run the contents of [supabase/migrations/20261121000000_init_clipforge.sql](file:///d:/Projects/Clipper/supabase/migrations/20261121000000_init_clipforge.sql).

---

## 4. Next.js Architecture & Data Integration

- **Client-Side Helpers**:
  - [frontend/utils/supabase/client.ts](file:///d:/Projects/Clipper/frontend/utils/supabase/client.ts): Browser client via `@supabase/ssr`.
- **Server-Side Helpers**:
  - [frontend/utils/supabase/server.ts](file:///d:/Projects/Clipper/frontend/utils/supabase/server.ts): Server Component & Action client with cookie store.
- **Middleware / Session Management**:
  - [frontend/middleware.ts](file:///d:/Projects/Clipper/frontend/middleware.ts) & [frontend/utils/supabase/middleware.ts](file:///d:/Projects/Clipper/frontend/utils/supabase/middleware.ts): Refreshes Supabase auth sessions transparently.
- **Services Layer**:
  - [frontend/src/services/jobs.service.ts](file:///d:/Projects/Clipper/frontend/src/services/jobs.service.ts): Centralized data fetching, insertion, and fallback logic.
- **REST API Routes**:
  - `GET /api/jobs`: List all jobs.
  - `POST /api/jobs`: Create a new video generation job.
  - `GET /api/jobs/[id]`: Retrieve job status and all associated clips.

---

## 5. Future Python Backend Integration

### Operations Handled by Next.js:
- User interface, dashboard, project listing, and status monitoring.
- Job creation and queue insertion (`public.jobs`).
- Serving video previews and clip download triggers.

### Operations Handled by Python Background Worker:
- **Audio Extraction**: Using FFmpeg or yt-dlp to download video and isolate audio track.
- **Transcription**: Calling Deepgram API to extract word-level timestamps.
- **Moments Detection**: Running LLM / heuristic logic to detect viral hooks.
- **Video Rendering**: FFmpeg cropping to 9:16, motion-tracking reframe, and MP4 generation.
- **Storage Upload**: Uploading final MP4 clips to Supabase Storage.

### Python Contracts & Interfaces
- Types defined in [frontend/src/types/python.types.ts](file:///d:/Projects/Clipper/frontend/src/types/python.types.ts).
- Service client in [frontend/src/services/python.service.ts](file:///d:/Projects/Clipper/frontend/src/services/python.service.ts).
- Expected endpoints for optional direct dispatch:
  - `GET /health`: Health and worker cluster status.
  - `POST /api/v1/jobs/process`: Explicit job dispatch.
