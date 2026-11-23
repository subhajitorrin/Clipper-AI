import { supabase, isSupabaseConfigured } from "@/src/lib/supabase/client";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/src/lib/supabase/server";
import { Database, JobStatus, PipelineStage } from "@/src/types/database.types";
import { ProjectJob, GeneratedClip } from "@/src/types";
import { getYouTubeThumbnail } from "@/src/lib/utils";

type JobRow = Database["public"]["Tables"]["jobs"]["Row"];
type ClipRow = Database["public"]["Tables"]["clips"]["Row"];

function getDbClient() {
  if (isSupabaseAdminConfigured && supabaseAdmin) {
    return supabaseAdmin;
  }
  if (isSupabaseConfigured && supabase) {
    return supabase;
  }
  return null;
}

export class JobsService {
  /**
   * Fetch all projects from Supabase
   */
  static async getAllJobs(): Promise<ProjectJob[]> {
    const client = getDbClient();
    if (client) {
      try {
        const { data, error } = await client
          .from("jobs")
          .select("*, clips(count)")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching jobs from Supabase:", error);
          return [];
        }

        if (data) {
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
      } catch (err) {
        console.error("Failed to query jobs:", err);
      }
    }

    return [];
  }

  /**
   * Fetch a single job by its UUID
   */
  static async getJobById(id: string): Promise<ProjectJob | null> {
    const client = getDbClient();
    if (client) {
      try {
        const { data, error } = await client
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
      } catch (err) {
        console.error("Failed to fetch job by id:", err);
      }
    }

    return null;
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

    const client = getDbClient();
    if (client) {
      try {
        const { data, error } = await client
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

        if (error) {
          console.error("Error creating job in Supabase:", error);
          throw new Error(error.message);
        }

        if (data) {
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
      } catch (err: any) {
        console.error("Failed to insert job into database:", err);
        throw err;
      }
    }

    throw new Error("Supabase is not configured. Please check environment variables.");
  }

  /**
   * Fetch clips generated for a specific job
   */
  static async getClipsByJobId(jobId: string): Promise<GeneratedClip[]> {
    const client = getDbClient();
    if (client) {
      try {
        const { data, error } = await client
          .from("clips")
          .select("*")
          .eq("job_id", jobId)
          .order("start_time", { ascending: true });

        if (!error && data) {
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
      } catch (err) {
        console.error("Failed to fetch clips by job id:", err);
      }
    }

    return [];
  }
}
