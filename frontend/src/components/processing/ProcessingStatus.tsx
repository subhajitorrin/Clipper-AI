"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectJob, ProcessingStageInfo, ProcessingStageId } from "@/src/types";
import { ProcessingSteps } from "./ProcessingSteps";
import { ProgressBar } from "./ProgressBar";
import { formatDuration } from "@/src/lib/utils";
import { Film, AlertCircle, RefreshCw, XCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { fetchProjectById, updateSessionProjectStage } from "@/src/lib/api";
import { cn } from "@/src/lib/utils";

interface ProcessingStatusProps {
  initialProject: ProjectJob;
}

const DEFAULT_STAGES: { id: ProcessingStageId; label: string; description: string }[] = [
  {
    id: "audio",
    label: "Extracting audio",
    description: "Isolating high-fidelity audio stream from video source",
  },
  {
    id: "transcribing",
    label: "Transcribing video",
    description: "Deepgram multi-speaker transcription and word-level timestamps",
  },
  {
    id: "moments",
    label: "Finding interesting moments",
    description: "AI evaluation for viral hooks, retention curve & story structure",
  },
  {
    id: "rendering",
    label: "Generating vertical clips",
    description: "FFmpeg 9:16 vertical crop, motion re-framing and audio normalization",
  },
];

export function ProcessingStatus({ initialProject }: ProcessingStatusProps) {
  const router = useRouter();
  const [project, setProject] = useState<ProjectJob>(initialProject);
  const [isRetrying, setIsRetrying] = useState(false);

  // Poll / Listen for updates (supports mock transitions and live backend)
  useEffect(() => {
    if (project.status === "completed") {
      const timer = setTimeout(() => {
        router.push(`/results/${project.id}`);
      }, 1500);
      return () => clearTimeout(timer);
    }

    if (project.status === "failed") {
      return;
    }

    // Progression updates: poll the real job status from Supabase
    const interval = setInterval(async () => {
      if (!project?.id) return;

      const fresh = await fetchProjectById(project.id);
      if (fresh) {
        setProject(fresh);
        if (fresh.status === "completed") {
          clearInterval(interval);
          router.push(`/results/${fresh.id}`);
          return;
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [project.id, router]);

  // Compute stage statuses based on current state
  const stageOrder: ProcessingStageId[] = ["audio", "transcribing", "moments", "rendering"];
  const currentStageIndex = stageOrder.indexOf(project.current_stage || "audio");

  const stagesWithStatus: ProcessingStageInfo[] = DEFAULT_STAGES.map((s, idx) => {
    if (project.status === "completed") {
      return { ...s, status: "completed" };
    }
    if (project.status === "failed") {
      if (idx < currentStageIndex) return { ...s, status: "completed" };
      if (idx === currentStageIndex) return { ...s, status: "failed" };
      return { ...s, status: "pending" };
    }
    // Processing / Pending
    if (idx < currentStageIndex) return { ...s, status: "completed" };
    if (idx === currentStageIndex) return { ...s, status: "processing" };
    return { ...s, status: "pending" };
  });

  const overallProgress =
    project.status === "completed"
      ? 100
      : project.status === "failed"
      ? Math.max(15, Math.round(((currentStageIndex) / stageOrder.length) * 100))
      : Math.max(15, Math.round(((currentStageIndex + 0.6) / stageOrder.length) * 100));

  const handleRetry = async () => {
    setIsRetrying(true);
    const updated = updateSessionProjectStage(project.id, {
      status: "processing",
      current_stage: "audio",
      error_message: undefined,
    });
    if (updated) setProject({ ...updated });
    setTimeout(() => setIsRetrying(false), 800);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Navigation */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-medium text-[#737373] hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Screen Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Processing Your Video</h2>
        <p className="text-sm text-[#737373] mt-1">
          ClipForge is analyzing transcripts, identifying viral segments and generating 9:16 vertical shorts.
        </p>
      </div>

      {/* Video Details Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-[#292929] bg-[#171717] p-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative h-14 w-22 shrink-0 overflow-hidden rounded-lg bg-[#202020] border border-[#292929]">
            {project.thumbnail_url ? (
              <img
                src={project.thumbnail_url}
                alt={project.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[#737373]">
                <Film className="h-5 w-5" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-white">{project.title}</h3>
            <div className="flex items-center gap-2 text-xs text-[#737373] mt-1">
              <span>{formatDuration(project.duration || 1800)} total length</span>
              <span>•</span>
              <span>{project.requested_clips} clips requested</span>
              <span>•</span>
              <span>{project.clip_duration}s duration</span>
            </div>
          </div>
        </div>

        {project.status === "completed" && (
          <Link
            href={`/results/${project.id}`}
            className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-[#E5E5E5] transition-colors shrink-0 text-center"
          >
            View Results
          </Link>
        )}
      </div>

      {/* Progress Bar */}
      <div className="rounded-xl border border-[#292929] bg-[#171717] p-5 space-y-4">
        <ProgressBar progress={overallProgress} />

        {project.status === "processing" && (
          <p className="text-xs text-[#737373] flex items-center justify-between">
            <span>Current stage: <strong className="text-white capitalize">{stagesWithStatus.find(s => s.status === 'processing')?.label || 'Preparing'}</strong></span>
            <span>Estimated time remaining: ~2 mins</span>
          </p>
        )}

        {project.status === "completed" && (
          <p className="text-xs text-[#A3A3A3]">
            All stages completed successfully. Redirecting to clips gallery...
          </p>
        )}

        {project.status === "failed" && (
          <div className="rounded-lg border border-[#292929] bg-[#202020] p-3 text-xs text-[#A3A3A3] space-y-2">
            <div className="flex items-center gap-2 text-white font-medium">
              <AlertCircle className="h-4 w-4" />
              <span>Processing encountered an error</span>
            </div>
            <p className="text-[#737373]">
              {project.error_message || "The video processing pipeline encountered an unexpected error."}
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={handleRetry}
                disabled={isRetrying}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-[#E5E5E5] transition-colors cursor-pointer"
              >
                <RefreshCw className={cn("h-3 w-3", isRetrying && "animate-spin")} />
                <span>Retry Job</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Processing Pipeline Stages */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white">Pipeline Stages</h3>
        <ProcessingSteps stages={stagesWithStatus} />
      </div>
    </div>
  );
}
