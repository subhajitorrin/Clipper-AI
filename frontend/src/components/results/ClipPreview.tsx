"use client";

import { useEffect, useRef } from "react";
import { X, Download, Play, Pause, Clock } from "lucide-react";
import { GeneratedClip } from "@/src/types";
import { formatTimestamp } from "@/src/lib/utils";

interface ClipPreviewProps {
  clip: GeneratedClip | null;
  onClose: () => void;
}

export function ClipPreview({ clip, onClose }: ClipPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!clip) return null;

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = clip.output_url;
    a.download = `${clip.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[#292929] bg-[#0D0D0D] shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#292929] px-5 py-4">
          <div className="min-w-0 pr-4">
            <h3 className="truncate text-sm font-semibold text-white">{clip.title}</h3>
            <p className="text-xs text-[#737373] mt-0.5">
              Timestamp: {formatTimestamp(clip.start_time)} – {formatTimestamp(clip.end_time)} ({clip.duration}s)
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#292929] text-[#737373] hover:border-[#404040] hover:text-white transition-colors"
            aria-label="Close preview"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Video Player (9:16 Aspect ratio container) */}
        <div className="relative bg-[#090909] flex items-center justify-center p-4 flex-1 overflow-hidden min-h-[360px] max-h-[500px]">
          <video
            ref={videoRef}
            src={clip.output_url}
            controls
            autoPlay
            playsInline
            className="h-full max-h-[480px] w-auto aspect-[9/16] rounded-xl object-contain bg-black border border-[#292929]"
          />
        </div>

        {/* Transcript & Details */}
        {clip.transcript && (
          <div className="border-t border-[#292929] px-5 py-3 bg-[#171717]/60">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#737373]">
              Highlighted Transcript
            </span>
            <p className="text-xs text-[#A3A3A3] mt-1 leading-relaxed italic line-clamp-3">
              "{clip.transcript}"
            </p>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-[#292929] p-4 bg-[#0D0D0D]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#292929] px-4 py-2 text-xs font-medium text-[#A3A3A3] hover:border-[#404040] hover:text-white transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-[#E5E5E5] transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download MP4</span>
          </button>
        </div>
      </div>
    </div>
  );
}
