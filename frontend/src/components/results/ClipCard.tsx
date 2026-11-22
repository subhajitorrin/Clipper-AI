"use client";

import { Play, Download, Clock, Scissors } from "lucide-react";
import { GeneratedClip } from "@/src/types";
import { formatTimestamp, cn } from "@/src/lib/utils";

interface ClipCardProps {
  clip: GeneratedClip;
  onPreview: (clip: GeneratedClip) => void;
}

export function ClipCard({ clip, onPreview }: ClipCardProps) {
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const a = document.createElement("a");
    a.href = clip.output_url;
    a.download = `${clip.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-[#292929] bg-[#171717] transition-all hover:border-[#404040]">
      {/* 9:16 Vertical Video Preview Container */}
      <div
        onClick={() => onPreview(clip)}
        className="relative aspect-[9/16] w-full overflow-hidden bg-[#090909] cursor-pointer"
      >
        {clip.thumbnail_url ? (
          <img
            src={clip.thumbnail_url}
            alt={clip.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              // Hide broken image so native video frame poster shows through
              e.currentTarget.style.display = "none";
            }}
          />
        ) : null}

        {/* Video poster snapshot for clips without or before custom thumbnail loads */}
        <video
          src={`${clip.output_url}#t=0.5`}
          preload="metadata"
          className={cn(
            "h-full w-full object-cover",
            clip.thumbnail_url ? "hidden" : "block"
          )}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Center Play Button on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-80 sm:opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-black shadow-lg backdrop-blur-xs transition-transform group-hover:scale-110">
            <Play className="h-5 w-5 fill-black ml-0.5" />
          </div>
        </div>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span className="rounded-md bg-black/80 px-2 py-0.5 text-[11px] font-mono text-white backdrop-blur-xs border border-white/10">
            {clip.duration}s
          </span>
          <span className="rounded-md bg-black/80 px-2 py-0.5 text-[11px] font-mono text-[#A3A3A3] backdrop-blur-xs border border-white/10">
            9:16 Short
          </span>
        </div>

        {/* Bottom Timestamp Overlay */}
        <div className="absolute bottom-3 left-3 right-3">
          <span className="inline-flex items-center gap-1 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-mono text-[#A3A3A3]">
            <Clock className="h-3 w-3" />
            <span>
              {formatTimestamp(clip.start_time)} – {formatTimestamp(clip.end_time)}
            </span>
          </span>
        </div>
      </div>

      {/* Card Info and Actions */}
      <div className="flex flex-col flex-1 p-4 justify-between space-y-3">
        <div>
          <h4 className="text-sm font-semibold text-white line-clamp-1">{clip.title}</h4>
          {clip.transcript && (
            <p className="text-xs text-[#737373] line-clamp-2 mt-1 leading-snug">
              "{clip.transcript}"
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-[#292929]">
          <button
            type="button"
            onClick={() => onPreview(clip)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#292929] bg-[#202020] py-2 text-xs font-medium text-white hover:border-[#404040] transition-colors cursor-pointer"
          >
            <Play className="h-3.5 w-3.5" />
            <span>Play Preview</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-[#292929] bg-[#171717] text-[#A3A3A3] hover:border-[#404040] hover:text-white transition-colors cursor-pointer"
            title="Download MP4"
            aria-label="Download MP4"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
