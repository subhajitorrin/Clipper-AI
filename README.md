# ClipForge AI

MVP for ClipForge AI - short-form video generator powered by Next.js, Supabase, Deepgram, and Python FFmpeg workers.

## Architecture

- **Frontend & App Backend**: Next.js (App Router, TypeScript, Tailwind CSS, Supabase Client/Admin)
- **Database & Job Queue**: Supabase PostgreSQL (atomic claim function for jobs)
- **Worker**: Python background worker (transcription via Deepgram, video clipping via FFmpeg)

## Directory Structure

```
clipforge-ai/
│
├── frontend/
│   ├── src/app/
│   │   ├── api/
│   │   │   ├── jobs/
│   │   │   └── videos/
│   │   └── dashboard/
│   └── src/lib/supabase/
│
├── worker/
│   ├── main.py
│   ├── processor.py
│   ├── transcription.py
│   ├── clip_detector.py
│   └── video_renderer.py
│
└── README.md
```
