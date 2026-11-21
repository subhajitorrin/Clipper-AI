"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Video, Upload, Sparkles, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { UploadZone } from "./UploadZone";
import { ClipSettings } from "./ClipSettings";
import { createProjectJob } from "@/src/lib/api";

export function VideoInput() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"youtube" | "upload">("youtube");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<number>(45);
  const [clipCount, setClipCount] = useState<number>(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  const isValidYoutubeUrl = (url: string) => {
    if (!url.trim()) return false;
    const regExp = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    return regExp.test(url.trim());
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setYoutubeUrl(val);
    if (val.trim() && !isValidYoutubeUrl(val)) {
      setUrlError("Please enter a valid YouTube link (e.g. https://www.youtube.com/watch?v=...)");
    } else {
      setUrlError(null);
    }
  };

  const canSubmit =
    activeTab === "youtube"
      ? isValidYoutubeUrl(youtubeUrl) && !isSubmitting
      : selectedFile !== null && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: activeTab === "youtube" ? youtubeUrl.trim() : undefined,
          videoPath: activeTab === "upload" && selectedFile ? selectedFile.name : undefined,
          clipDuration: duration,
          requestedClips: clipCount,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to create project job");
      }

      router.push(`/processing/${json.data.id}`);
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-[#292929] bg-[#171717] p-5 sm:p-6 shadow-sm">
      {/* Tab Switcher */}
      <div className="flex border-b border-[#292929] pb-4 mb-5">
        <div className="inline-flex rounded-lg bg-[#090909] p-1 border border-[#292929]">
          <button
            type="button"
            onClick={() => setActiveTab("youtube")}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-2 text-xs sm:text-sm font-medium transition-all",
              activeTab === "youtube"
                ? "bg-[#202020] text-white shadow-xs"
                : "text-[#A3A3A3] hover:text-white"
            )}
          >
            <Video className="h-4 w-4" />
            <span>YouTube URL</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-2 text-xs sm:text-sm font-medium transition-all",
              activeTab === "upload"
                ? "bg-[#202020] text-white shadow-xs"
                : "text-[#A3A3A3] hover:text-white"
            )}
          >
            <Upload className="h-4 w-4" />
            <span>Upload Video</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tab 1: YouTube URL */}
        {activeTab === "youtube" && (
          <div className="space-y-2">
            <label htmlFor="youtube-url" className="text-xs font-medium text-[#A3A3A3]">
              Video URL
            </label>
            <div className="relative">
              <input
                id="youtube-url"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={handleUrlChange}
                className={cn(
                  "w-full rounded-xl border bg-[#090909] px-4 py-3 text-sm text-white placeholder-[#737373] outline-none transition-colors focus:border-white",
                  urlError ? "border-[#737373]" : "border-[#292929]"
                )}
              />
            </div>
            {urlError ? (
              <p className="flex items-center gap-1.5 text-xs text-[#A3A3A3]">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{urlError}</span>
              </p>
            ) : (
              <p className="text-xs text-[#737373]">
                Paste any public YouTube video link. Podcasts, interviews, keynotes and lectures work best.
              </p>
            )}
          </div>
        )}

        {/* Tab 2: Upload Zone */}
        {activeTab === "upload" && (
          <UploadZone
            selectedFile={selectedFile}
            onFileSelect={setSelectedFile}
          />
        )}

        {/* Clip Settings */}
        <div className="border-t border-[#292929] pt-5">
          <ClipSettings
            duration={duration}
            onDurationChange={setDuration}
            count={clipCount}
            onCountChange={setClipCount}
          />
        </div>

        {/* Submit Action */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={!canSubmit}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-semibold transition-all",
              canSubmit
                ? "bg-white text-black hover:bg-[#E5E5E5] active:scale-[0.99] cursor-pointer"
                : "bg-[#202020] text-[#737373] cursor-not-allowed border border-[#292929]"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-black" />
                <span>Initializing Processing...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Generate Shorts</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
