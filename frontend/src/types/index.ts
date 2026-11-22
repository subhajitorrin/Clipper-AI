export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ProjectJob {
  id: string;
  title: string;
  video_url?: string;
  video_path?: string;
  thumbnail_url?: string;
  duration?: number; // total duration in seconds
  status: JobStatus;
  current_stage?: 'audio' | 'transcribing' | 'moments' | 'rendering';
  stage_progress?: number; // 0 to 100
  metadata?: Record<string, any>;
  error_message?: string;
  requested_clips: number;
  clip_duration: number; // 30, 45, or 60 seconds
  created_at: string;
  updated_at: string;
  clip_count?: number;
}

export interface GeneratedClip {
  id: string;
  job_id: string;
  title: string;
  duration: number; // in seconds
  start_time: number; // in seconds
  end_time: number; // in seconds
  thumbnail_url: string;
  output_url: string;
  transcript?: string;
  created_at: string;
}

export type ProcessingStageId = 'audio' | 'transcribing' | 'moments' | 'rendering';

export interface ProcessingStageInfo {
  id: ProcessingStageId;
  label: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}
