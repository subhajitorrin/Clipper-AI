"use client";

import { useState } from "react";
import { GeneratedClip } from "@/src/types";
import { ClipCard } from "./ClipCard";
import { ClipPreview } from "./ClipPreview";
import { Download } from "lucide-react";

interface ClipGalleryProps {
  clips: GeneratedClip[];
  projectTitle: string;
}

export function ClipGallery({ clips, projectTitle }: ClipGalleryProps) {
  const [selectedClip, setSelectedClip] = useState<GeneratedClip | null>(null);

  const handleDownloadAll = () => {
    clips.forEach((clip, index) => {
      setTimeout(() => {
        const a = document.createElement("a");
        a.href = clip.output_url;
        a.download = `${clip.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }, index * 200);
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Meta Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#292929] pb-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-[#737373]">
            Generated Results
          </span>
          <p className="text-sm text-[#A3A3A3] mt-0.5">
            {clips.length} ready-to-post short-form vertical videos
          </p>
        </div>

        {clips.length > 0 && (
          <button
            type="button"
            onClick={handleDownloadAll}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-[#E5E5E5] transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download All ({clips.length})</span>
          </button>
        )}
      </div>

      {/* Grid of clips: 3 cols on desktop, 2 on tablet, 1 on mobile */}
      {clips.length === 0 ? (
        <div className="rounded-xl border border-[#292929] bg-[#171717] p-12 text-center text-xs text-[#737373]">
          No clips generated for this video yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {clips.map((clip) => (
            <ClipCard
              key={clip.id}
              clip={clip}
              onPreview={(c) => setSelectedClip(c)}
            />
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <ClipPreview
        clip={selectedClip}
        onClose={() => setSelectedClip(null)}
      />
    </div>
  );
}
