/**
 * TypeScript Interfaces for future Python Background Worker & FastAPI Service
 */

import { JobStatus, PipelineStage } from "@/src/types/database.types";

export interface PythonWorkerHealthResponse {
  status: "ok" | "degraded" | "error";
  worker_id: string;
  active_jobs: number;
  ffmpeg_available: boolean;
  deepgram_configured: boolean;
  version: string;
}

export interface PythonProcessJobRequest {
  job_id: string;
  source_type: "youtube" | "upload";
  video_url?: string;
  video_path?: string;
  requested_clips: number;
  clip_duration: number; // 30, 45, or 60
}

export interface PythonProcessJobResponse {
  success: boolean;
  job_id: string;
  status: JobStatus;
  message: string;
}

export interface PythonDetectedMoment {
  start_time: number;
  end_time: number;
  title: string;
  score: number; // 0.0 - 1.0 virality/interest score
  hook_transcript: string;
}

export interface PythonRenderClipRequest {
  job_id: string;
  start_time: number;
  end_time: number;
  title: string;
  aspect_ratio?: "9:16";
  target_resolution?: "1080x1920";
}

export interface PythonRenderClipResponse {
  clip_id: string;
  output_url: string;
  duration: number;
  thumbnail_url: string;
}

export interface PythonJobProgressNotification {
  job_id: string;
  status: JobStatus;
  stage: PipelineStage;
  progress: number;
  error?: string;
}
