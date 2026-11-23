"use client";

import Link from "next/link";
import { Film, ArrowUpRight, Clock, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { ProjectJob } from "@/src/types";
import { formatDuration, getYouTubeThumbnail } from "@/src/lib/utils";

interface ProjectRowProps {
  project: ProjectJob;
}

export function ProjectRow({ project }: ProjectRowProps) {
  const isCompleted = project.status === "completed";
  const isProcessing = project.status === "processing" || project.status === "pending";
  const isFailed = project.status === "failed";

  const href = isCompleted
    ? `/results/${project.id}`
    : `/processing/${project.id}`;

  const formattedDate = new Date(project.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link
      href={href}
      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-[#292929] bg-[#171717] p-4 transition-all hover:border-[#404040] hover:bg-[#202020]/60"
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Thumbnail Placeholder */}
        <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-[#202020] border border-[#292929]">
          {project.thumbnail_url || getYouTubeThumbnail(project.video_url) ? (
            <img
              src={project.thumbnail_url || getYouTubeThumbnail(project.video_url)!}
              alt={project.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[#737373]">
              <Film className="h-5 w-5" />
            </div>
          )}
          {project.duration && (
            <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[9px] font-mono text-white">
              {formatDuration(project.duration)}
            </span>
          )}
        </div>

        {/* Project Info */}
        <div className="min-w-0">
          <h4 className="truncate text-sm font-medium text-white group-hover:text-white">
            {project.title}
          </h4>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#737373] mt-1">
            <span>{formattedDate}</span>
            <span>•</span>
            <span>
              {project.clip_count ?? (project.requested_clips === 0 ? "Auto" : project.requested_clips)} clips
            </span>
            <span>•</span>
            <span>
              {project.clip_duration === 0 ? "Auto duration" : `${project.clip_duration}s target`}
            </span>
          </div>
        </div>
      </div>

      {/* Status & CTA */}
      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t border-[#292929]/50 sm:border-t-0">
        <div className="flex items-center gap-1.5 text-xs">
          {isCompleted && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#292929] bg-[#202020] px-2.5 py-0.5 text-[#A3A3A3]">
              <CheckCircle2 className="h-3 w-3 text-white" />
              <span>Completed</span>
            </span>
          )}
          {isProcessing && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#292929] bg-[#202020] px-2.5 py-0.5 text-[#A3A3A3]">
              <Loader2 className="h-3 w-3 animate-spin text-white" />
              <span>Processing</span>
            </span>
          )}
          {isFailed && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#292929] bg-[#202020] px-2.5 py-0.5 text-[#A3A3A3]">
              <AlertTriangle className="h-3 w-3 text-[#A3A3A3]" />
              <span>Failed</span>
            </span>
          )}
        </div>

        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-[#737373] transition-colors group-hover:border-[#292929] group-hover:text-white">
          <ArrowUpRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
}
