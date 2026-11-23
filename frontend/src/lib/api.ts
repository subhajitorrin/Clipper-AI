import { ProjectJob, GeneratedClip } from "@/src/types";
import { supabase, isSupabaseConfigured } from "@/src/lib/supabase/client";
import { getYouTubeThumbnail } from "@/src/lib/utils";

// In-memory store for newly created projects during the current session
const sessionProjects: Map<string, ProjectJob> = new Map();

export async function fetchProjects(): Promise<ProjectJob[]> {
  // Always attempt fetching through server API first (which has full DB access)
  try {
    const res = await fetch("/api/jobs", { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data;
      }
    }
  } catch (err) {
    console.error("fetchProjects via API error:", err);
  }

  // Fallback to direct client-side Supabase if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*, clips(count)")
        .order("created_at", { ascending: false });

      if (!error && data) {
        return data.map((job: any) => ({
          id: job.id,
          title: job.title || job.video_url || job.video_path || "Untitled Video",
          video_url: job.video_url,
          video_path: job.video_path,
          thumbnail_url: job.thumbnail_url || (job.video_url ? getYouTubeThumbnail(job.video_url) : undefined),
          status: job.status,
          current_stage: job.current_stage || "audio",
          stage_progress: job.stage_progress ?? 0,
          duration: job.duration || 1800,
          requested_clips: job.requested_clips || 3,
          clip_duration: job.clip_duration || 30,
          created_at: job.created_at,
          updated_at: job.updated_at,
          clip_count: job.clips?.[0]?.count || 0,
        }));
      }
    } catch {
      // Ignore
    }
  }

  return Array.from(sessionProjects.values());
}

export async function fetchProjectById(id: string): Promise<ProjectJob | null> {
  // Check API route first for real Supabase job
  try {
    const res = await fetch(`/api/jobs/${id}`, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data.job || json.data;
      }
    }
  } catch {
    // Fall through
  }

  // Check session memory
  if (sessionProjects.has(id)) {
    return sessionProjects.get(id)!;
  }

  // Check Supabase if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", id)
        .single();

      if (!error && data) {
        return {
          id: data.id,
          title: data.title || data.video_url || data.video_path || "Untitled Project",
          video_url: data.video_url,
          video_path: data.video_path,
          thumbnail_url: data.thumbnail_url || (data.video_url ? getYouTubeThumbnail(data.video_url) : undefined),
          status: data.status,
          current_stage: data.current_stage || data.metadata?.current_stage || "audio",
          stage_progress: data.stage_progress ?? data.metadata?.stage_progress ?? 0,
          metadata: data.metadata,
          requested_clips: data.requested_clips || data.metadata?.requested_clips || 3,
          clip_duration: data.clip_duration || data.metadata?.clip_duration || 30,
          duration: data.duration || data.metadata?.duration || 1800,
          created_at: data.created_at,
          updated_at: data.updated_at,
          error_message: data.error_message,
        };
      }
    } catch {
      // Fall through
    }
  }

  return null;
}

export async function fetchClipsByJobId(jobId: string): Promise<GeneratedClip[]> {
  try {
    const res = await fetch(`/api/jobs/${jobId}`, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data && json.data.clips) {
        return json.data.clips;
      }
    }
  } catch {
    // Fall through
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("clips")
        .select("*")
        .eq("job_id", jobId)
        .order("start_time", { ascending: true });

      if (!error && data) {
        return data.map((c) => ({
          id: c.id,
          job_id: c.job_id,
          title: c.title || "Untitled Clip",
          duration: Math.round(Number(c.end_time) - Number(c.start_time)),
          start_time: Number(c.start_time),
          end_time: Number(c.end_time),
          thumbnail_url: c.thumbnail_url || undefined,
          output_url: c.output_url,
          transcript: c.transcript,
          created_at: c.created_at,
        }));
      }
    } catch {
      // Fall through
    }
  }

  return [];
}

export async function createProjectJob(params: {
  videoUrl?: string;
  videoPath?: string;
  clipDuration: number;
  requestedClips: number;
}): Promise<ProjectJob> {
  const newId = `cf-${Date.now().toString(36)}`;
  const title = params.videoUrl
    ? `YouTube: ${params.videoUrl.replace(/^https?:\/\/(www\.)?/, "")}`
    : params.videoPath
    ? `Upload: ${params.videoPath}`
    : "New Video Clip Project";

  const newProject: ProjectJob = {
    id: newId,
    title,
    video_url: params.videoUrl,
    video_path: params.videoPath,
    thumbnail_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
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

  sessionProjects.set(newId, newProject);

  // If Supabase is connected, insert record
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("jobs").insert({
        id: newId,
        video_url: params.videoUrl,
        video_path: params.videoPath,
        status: "pending",
        metadata: {
          clip_duration: params.clipDuration,
          requested_clips: params.requestedClips,
        },
      });
    } catch {
      // Session project fallback already active
    }
  }

  return newProject;
}

export function updateSessionProjectStage(
  id: string,
  updates: Partial<ProjectJob>
): ProjectJob | null {
  const current = sessionProjects.get(id);
  if (!current) return null;
  const updated = { ...current, ...updates, updated_at: new Date().toISOString() };
  sessionProjects.set(id, updated);
  return updated;
}
