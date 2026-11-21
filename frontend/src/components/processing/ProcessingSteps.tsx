import { CheckCircle2, Loader2, Circle, AlertCircle } from "lucide-react";
import { ProcessingStageInfo } from "@/src/types";
import { cn } from "@/src/lib/utils";

interface ProcessingStepsProps {
  stages: ProcessingStageInfo[];
}

export function ProcessingSteps({ stages }: ProcessingStepsProps) {
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
              "flex items-start gap-3 rounded-xl border p-4 transition-colors",
              isCurrent
                ? "border-white/30 bg-[#202020]"
                : "border-[#292929] bg-[#171717]"
            )}
          >
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
        );
      })}
    </div>
  );
}
