import { CheckCircle2, Loader2, Circle, AlertCircle, Film, Scissors } from "lucide-react";
import { ProcessingStageInfo, ProjectJob } from "@/src/types";
import { cn } from "@/src/lib/utils";

interface ProcessingStepsProps {
  stages: ProcessingStageInfo[];
  project?: ProjectJob;
}

export function ProcessingSteps({ stages, project }: ProcessingStepsProps) {
  const metadata = project?.metadata;
  const currentClipIndex = metadata?.current_clip_index;
  const totalClips = metadata?.total_clips || project?.requested_clips;
  const currentClipTitle = metadata?.current_clip_title;
  const stepDescription = metadata?.step_description;

  return (
    <div className="space-y-3">
      {stages.map((stage, idx) => {
        const isDone = stage.status === "completed";
        const isCurrent = stage.status === "processing";
        const isFailed = stage.status === "failed";
        const isPending = stage.status === "pending";

        return (
          <div
            key={stage.id}
            className={cn(
              "flex flex-col gap-2 rounded-xl border p-4 transition-colors",
              isCurrent
                ? "border-white/30 bg-[#202020]"
                : "border-[#292929] bg-[#171717]"
            )}
          >
            <div className="flex items-start gap-3">
              {/* Step Number or Status Icon */}
              <div className="flex h-6 w-6 shrink-0 items-center justify-center pt-0.5">
                {isDone && <CheckCircle2 className="h-5 w-5 text-white" />}
                {isCurrent && <Loader2 className="h-5 w-5 animate-spin text-white" />}
                {isFailed && <AlertCircle className="h-5 w-5 text-[#A3A3A3]" />}
                {isPending && <Circle className="h-4 w-4 text-[#737373]" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4
                    className={cn(
                      "text-sm font-medium",
                      isCurrent || isDone ? "text-white" : "text-[#737373]"
                    )}
                  >
                    <span className="font-mono text-xs mr-2 text-[#737373]">0{idx + 1}.</span>
                    {stage.label}
                  </h4>

                  <span
                    className={cn(
                      "text-[11px] font-mono capitalize",
                      isDone && "text-[#A3A3A3]",
                      isCurrent && "text-white font-semibold",
                      isPending && "text-[#737373]",
                      isFailed && "text-[#A3A3A3]"
                    )}
                  >
                    {stage.status}
                  </span>
                </div>
                <p className="text-xs text-[#737373] mt-1">{stage.description}</p>
              </div>
            </div>

            {/* In-depth progress details for rendering / moment generation */}
            {isCurrent && stage.id === "rendering" && (
              <div className="ml-9 mt-1 rounded-lg border border-[#333333] bg-[#141414] p-3 text-xs space-y-2">
                <div className="flex items-center justify-between text-[#A3A3A3]">
                  <span className="flex items-center gap-1.5 font-medium text-white">
                    <Scissors className="h-3.5 w-3.5 text-white" />
                    {currentClipIndex && totalClips
                      ? `Working on Clip ${currentClipIndex} of ${totalClips}`
                      : `Processing clips...`}
                  </span>
                  {totalClips && currentClipIndex ? (
                    <span className="font-mono text-[11px] text-[#737373]">
                      {Math.round(((currentClipIndex - 0.5) / totalClips) * 100)}%
                    </span>
                  ) : null}
                </div>

                {currentClipTitle && (
                  <p className="text-white font-medium truncate flex items-center gap-1.5">
                    <Film className="h-3 w-3 text-[#737373] shrink-0" />
                    <span>&ldquo;{currentClipTitle}&rdquo;</span>
                  </p>
                )}

                <div className="flex items-center justify-between text-[11px] text-[#737373] pt-1 border-t border-[#252525]">
                  <span>{stepDescription || "Cutting and reframing 9:16 vertical shorts..."}</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
