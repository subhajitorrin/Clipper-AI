import { cn } from "@/src/lib/utils";

interface ProgressBarProps {
  progress: number; // 0 to 100
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({ progress, className, showLabel = true }: ProgressBarProps) {
  const clamped = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={cn("w-full space-y-1.5", className)}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs">
          <span className="text-[#737373]">Progress</span>
          <span className="font-mono font-medium text-white">{clamped}%</span>
        </div>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#202020] border border-[#292929]">
        <div
          className="h-full bg-white transition-all duration-300 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
