"use client";

import React from "react";
import { Clock, Layers, Sparkles } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface ClipSettingsProps {
  duration: number; // 0 for Auto, or 15, 30, 45, 60
  onDurationChange: (d: number) => void;
  count: number; // 0 for Auto, or 1, 3, 5, 10
  onCountChange: (c: number) => void;
}

const DURATION_OPTIONS = [
  { value: 0, label: "Auto", isAuto: true, description: "AI picks natural duration (18s-75s)" },
  { value: 15, label: "15s", isAuto: false, description: "Ultra-fast hooks" },
  { value: 30, label: "30s", isAuto: false, description: "Quick punchy hooks" },
  { value: 45, label: "45s", isAuto: false, description: "Standard Shorts / Reels" },
  { value: 60, label: "60s", isAuto: false, description: "In-depth insights" },
];

const COUNT_OPTIONS = [
  { value: 0, label: "Auto", isAuto: true, description: "Max viral moments scaled to video length" },
  { value: 1, label: "1 clip", isAuto: false },
  { value: 3, label: "3 clips", isAuto: false },
  { value: 5, label: "5 clips", isAuto: false },
  { value: 10, label: "10 clips", isAuto: false },
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
        <div className="flex items-center justify-between text-xs font-medium text-[#A3A3A3]">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>Clip Target Duration</span>
          </div>
          {duration === 0 && (
            <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5" /> Natural story length
            </span>
          )}
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {DURATION_OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt.value}
              onClick={() => onDurationChange(opt.value)}
              className={cn(
                "flex flex-col items-center justify-center rounded-lg border py-2 px-1 text-center transition-all cursor-pointer",
                duration === opt.value
                  ? opt.isAuto
                    ? "border-emerald-500/80 bg-emerald-950/30 text-emerald-300 shadow-xs ring-1 ring-emerald-500/50"
                    : "border-white bg-[#202020] text-white shadow-xs"
                  : "border-[#292929] bg-[#171717] text-[#A3A3A3] hover:border-[#404040] hover:text-white"
              )}
            >
              <div className="flex items-center gap-1 text-xs sm:text-sm font-semibold">
                {opt.isAuto && <Sparkles className="h-3 w-3 text-emerald-400 shrink-0" />}
                <span>{opt.label}</span>
              </div>
              <span className="text-[10px] text-[#737373] mt-0.5 truncate">
                {opt.isAuto ? "AI smart" : `${opt.value}s`}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Quantity Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-medium text-[#A3A3A3]">
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" />
            <span>Number of Clips</span>
          </div>
          {count === 0 && (
            <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5" /> Auto scaled to length
            </span>
          )}
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {COUNT_OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt.value}
              onClick={() => onCountChange(opt.value)}
              className={cn(
                "flex flex-col items-center justify-center rounded-lg border py-2 px-1 text-center transition-all cursor-pointer",
                count === opt.value
                  ? opt.isAuto
                    ? "border-emerald-500/80 bg-emerald-950/30 text-emerald-300 shadow-xs ring-1 ring-emerald-500/50"
                    : "border-white bg-[#202020] text-white shadow-xs"
                  : "border-[#292929] bg-[#171717] text-[#A3A3A3] hover:border-[#404040] hover:text-white"
              )}
            >
              <div className="flex items-center gap-1 text-xs sm:text-sm font-semibold">
                {opt.isAuto && <Sparkles className="h-3 w-3 text-emerald-400 shrink-0" />}
                <span>{opt.label}</span>
              </div>
              <span className="text-[10px] text-[#737373] mt-0.5 truncate">
                {opt.isAuto ? "Max viral" : `${opt.value} clip${opt.value > 1 ? "s" : ""}`}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
