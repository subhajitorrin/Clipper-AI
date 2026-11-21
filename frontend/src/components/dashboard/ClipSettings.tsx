"use client";

import React from "react";
import { Clock, Layers } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface ClipSettingsProps {
  duration: number;
  onDurationChange: (d: number) => void;
  count: number;
  onCountChange: (c: number) => void;
}

const DURATION_OPTIONS = [
  { value: 15, label: "15s", description: "Ultra-fast hooks" },
  { value: 30, label: "30s", description: "Quick punchy hooks" },
  { value: 45, label: "45s", description: "Standard Shorts / Reels" },
  { value: 60, label: "60s", description: "In-depth insights" },
];

const COUNT_OPTIONS = [
  { value: 1, label: "1 clip" },
  { value: 3, label: "3 clips" },
  { value: 5, label: "5 clips" },
  { value: 10, label: "10 clips" },
];

export function ClipSettings({
  duration,
  onDurationChange,
  count,
  onCountChange,
}: ClipSettingsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
      {/* Duration Selector */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-[#A3A3A3]">
          <Clock className="h-3.5 w-3.5" />
          <span>Clip Target Duration</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {DURATION_OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt.value}
              onClick={() => onDurationChange(opt.value)}
              className={cn(
                "flex flex-col items-center justify-center rounded-lg border py-2.5 px-2 text-center transition-all",
                duration === opt.value
                  ? "border-white bg-[#202020] text-white shadow-xs"
                  : "border-[#292929] bg-[#171717] text-[#A3A3A3] hover:border-[#404040] hover:text-white"
              )}
            >
              <span className="text-sm font-semibold">{opt.label}</span>
              <span className="text-[10px] text-[#737373] mt-0.5 hidden xs:inline">
                {opt.value} sec
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Quantity Selector */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-[#A3A3A3]">
          <Layers className="h-3.5 w-3.5" />
          <span>Number of Clips</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {COUNT_OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt.value}
              onClick={() => onCountChange(opt.value)}
              className={cn(
                "flex items-center justify-center rounded-lg border py-2.5 px-2 text-center transition-all",
                count === opt.value
                  ? "border-white bg-[#202020] text-white shadow-xs"
                  : "border-[#292929] bg-[#171717] text-[#A3A3A3] hover:border-[#404040] hover:text-white"
              )}
            >
              <span className="text-sm font-semibold">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
