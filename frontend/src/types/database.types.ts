export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type PipelineStage = 'audio' | 'transcribing' | 'moments' | 'rendering';
export type VideoSourceType = 'youtube' | 'upload';

export interface Database {
  public: {
    Tables: {
      jobs: {
        Row: {
          id: string;
          user_id: string | null;
          title: string;
          source_type: VideoSourceType;
          video_url: string | null;
          video_path: string | null;
          thumbnail_url: string | null;
          duration: number | null;
          clip_duration: number;
          requested_clips: number;
          status: JobStatus;
          current_stage: PipelineStage | null;
          stage_progress: number | null;
          error_message: string | null;
          claimed_at: string | null;
          worker_id: string | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          title: string;
          source_type?: VideoSourceType;
          video_url?: string | null;
          video_path?: string | null;
          thumbnail_url?: string | null;
          duration?: number | null;
          clip_duration?: number;
          requested_clips?: number;
          status?: JobStatus;
          current_stage?: PipelineStage | null;
          stage_progress?: number | null;
          error_message?: string | null;
          claimed_at?: string | null;
          worker_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          title?: string;
          source_type?: VideoSourceType;
          video_url?: string | null;
          video_path?: string | null;
          thumbnail_url?: string | null;
          duration?: number | null;
          clip_duration?: number;
          requested_clips?: number;
          status?: JobStatus;
          current_stage?: PipelineStage | null;
          stage_progress?: number | null;
          error_message?: string | null;
          claimed_at?: string | null;
          worker_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      clips: {
        Row: {
          id: string;
          job_id: string;
          title: string;
          start_time: number;
          end_time: number;
          duration: number;
          thumbnail_url: string | null;
          output_url: string;
          transcript: string | null;
          aspect_ratio: string;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          title: string;
          start_time: number;
          end_time: number;
          thumbnail_url?: string | null;
          output_url: string;
          transcript?: string | null;
          aspect_ratio?: string;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          title?: string;
          start_time?: number;
          end_time?: number;
          thumbnail_url?: string | null;
          output_url?: string;
          transcript?: string | null;
          aspect_ratio?: string;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Functions: {
      claim_next_job: {
        Args: {
          worker_name?: string;
        };
        Returns: Database['public']['Tables']['jobs']['Row'][];
      };
    };
  };
}
