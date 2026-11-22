import { supabase, isSupabaseConfigured } from "@/src/lib/supabase/client";
import { Database, JobStatus, PipelineStage } from "@/src/types/database.types";
import { ProjectJob, GeneratedClip } from "@/src/types";
import { MOCK_PROJECTS, MOCK_CLIPS } from "@/src/mock/projects";
import { getYouTubeThumbnail } from "@/src/lib/utils";

type JobRow = Database["public"]["Tables"]["jobs"]["Row"];
type ClipRow = Database["public"]["Tables"]["clips"]["Row"];

export class JobsService {
  /**
   * Fetch all projects (from Supabase if configured, falling back to mock data)
   */
  static async getAllJobs(): Promise<ProjectJob[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("jobs")
          .select("*, clips(count)")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((job: any) => ({
            id: job.id,
            title: job.title || job.video_url || job.video_path || "Untitled Project",
            video_url: job.video_url ?? undefined,
            video_path: job.video_path ?? undefined,
            thumbnail_url: job.thumbnail_url || (job.video_url ? getYouTubeThumbnail(job.video_url) : undefined),
            duration: job.duration ?? 1800,
            status: job.status as JobStatus,
            current_stage: (job.current_stage as PipelineStage) ?? "audio",
            stage_progress: job.stage_progress ?? 0,
            metadata: (job.metadata as Record<string, any>) ?? undefined,
            requested_clips: job.requested_clips,
            clip_duration: job.clip_duration,
            created_at: job.created_at,
            updated_at: job.updated_at,
            clip_count: job.clips?.[0]?.count ?? 0,
          }));
        }
      } catch {
        // Fall through to mock
      }
    }

    return MOCK_PROJECTS;
  }

  /**
   * Fetch a single job by its UUID
   */
  static async getJobById(id: string): Promise<ProjectJob | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("jobs")
          .select("*")
          .eq("id", id)
          .single();

        if (!error && data) {
          const row = data as JobRow;
          return {
            id: row.id,
            title: row.title,
            video_url: row.video_url ?? undefined,
            video_path: row.video_path ?? undefined,
            thumbnail_url: (row.thumbnail_url ?? undefined) || (row.video_url ? getYouTubeThumbnail(row.video_url) ?? undefined : undefined),
            duration: row.duration ?? 1800,
            status: row.status as JobStatus,
            current_stage: (row.current_stage as PipelineStage) ?? "audio",
            stage_progress: row.stage_progress ?? 0,
            metadata: (row.metadata as Record<string, any>) ?? undefined,
            error_message: row.error_message ?? undefined,
            requested_clips: row.requested_clips,
            clip_duration: row.clip_duration,
            created_at: row.created_at,
            updated_at: row.updated_at,
          };
        }
      } catch {
        // Fall through to mock
      }
    }

    return MOCK_PROJECTS.find((p) => p.id === id) || null;
  }

  /**
   * Create a new video clipping job
   */
  static async createJob(params: {
    title: string;
    videoUrl?: string;
    videoPath?: string;
    clipDuration: number;
    requestedClips: number;
  }): Promise<ProjectJob> {
    const sourceType = params.videoUrl ? "youtube" : "upload";
    const ytThumb = params.videoUrl ? getYouTubeThumbnail(params.videoUrl) : null;
    const initialThumb = ytThumb || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80";

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("jobs")
          .insert({
            title: params.title,
            source_type: sourceType,
            video_url: params.videoUrl ?? null,
            video_path: params.videoPath ?? null,
            clip_duration: params.clipDuration,
            requested_clips: params.requestedClips,
            status: "pending",
            current_stage: "audio",
            stage_progress: 0,
            thumbnail_url: initialThumb,
          })
          .select()
          .single();

        if (!error && data) {
          const row = data as JobRow;
          return {
            id: row.id,
            title: row.title,
            video_url: row.video_url ?? undefined,
            video_path: row.video_path ?? undefined,
            thumbnail_url: (row.thumbnail_url ?? undefined) || (row.video_url ? getYouTubeThumbnail(row.video_url) ?? undefined : undefined),
            duration: row.duration ?? 1800,
            status: row.status as JobStatus,
            current_stage: (row.current_stage as PipelineStage) ?? "audio",
            stage_progress: row.stage_progress ?? 0,
            metadata: (row.metadata as Record<string, any>) ?? undefined,
            requested_clips: row.requested_clips,
            clip_duration: row.clip_duration,
            created_at: row.created_at,
            updated_at: row.updated_at,
            clip_count: 0,
          };
        }
      } catch {
        // Fall through to session creation
      }
    }

    // Fallback: Generate ID for prototype/offline session
    const fallbackId = `cf-${Date.now().toString(36)}`;
    return {
      id: fallbackId,
      title: params.title,
      video_url: params.videoUrl,
      video_path: params.videoPath,
      thumbnail_url: initialThumb,
      duration: 1800,
      status: "processing",
      current_stage: "audio",
      stage_progress: 15,
      requested_clips: params.requestedClips,
      clip_duration: params.clipDuration,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      clip_count: 0,
    };
  }

  /**
   * Fetch clips generated for a specific job
   */
  static async getClipsByJobId(jobId: string): Promise<GeneratedClip[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("clips")
          .select("*")
          .eq("job_id", jobId)
          .order("start_time", { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map((clip: any) => ({
            id: clip.id,
            job_id: clip.job_id,
            title: clip.title,
            start_time: Number(clip.start_time),
            end_time: Number(clip.end_time),
            duration: Number(clip.duration || (clip.end_time - clip.start_time)),
            thumbnail_url: clip.thumbnail_url || undefined,
            output_url: clip.output_url,
            transcript: clip.transcript ?? undefined,
            created_at: clip.created_at,
          }));
        }
      } catch {
        // Fall through to mock
      }
    }

    return MOCK_CLIPS[jobId] || MOCK_CLIPS["proj-101"] || [];
  }
}
