import { FULL_DAY_SECONDS, THRESHOLD_SECONDS } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

interface ProgressBarProps {
  /** Cumulative total seconds: all saved sessions + current running session */
  cumulativeTotalSeconds: number;
}

export function ProgressBar({ cumulativeTotalSeconds }: ProgressBarProps) {
  const isFullDay = cumulativeTotalSeconds >= THRESHOLD_SECONDS;
  const progress = Math.min(
    (cumulativeTotalSeconds / FULL_DAY_SECONDS) * 100,
    100,
  );
  const thresholdPercent = (THRESHOLD_SECONDS / FULL_DAY_SECONDS) * 100; // 91.67%

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Daily Progress</span>
        <span>
          {Math.floor(cumulativeTotalSeconds / 3600)}h{" "}
          {Math.floor((cumulativeTotalSeconds % 3600) / 60)}m / 6h target
        </span>
      </div>

      <div className="relative h-3 bg-secondary rounded-full overflow-hidden">
        {/* Threshold marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-foreground/20 z-10"
          style={{ left: `${thresholdPercent}%` }}
        />
        {/* Progress fill */}
        <div
          className={cn(
            "h-full rounded-full transition-all duration-1000 ease-out",
            isFullDay
              ? "bg-green-500"
              : cumulativeTotalSeconds > 0
                ? "bg-primary"
                : "bg-secondary",
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      {isFullDay && (
        <div className="flex items-center gap-1.5 text-green-500 text-xs font-semibold animate-in fade-in slide-in-from-bottom-1">
          <CheckCircle2 size={14} />
          <span>Full Day Earned ✓</span>
        </div>
      )}

      {!isFullDay && cumulativeTotalSeconds > 0 && (
        <div className="text-xs text-muted-foreground">
          {cumulativeTotalSeconds < THRESHOLD_SECONDS && (
            <span>
              {Math.floor((THRESHOLD_SECONDS - cumulativeTotalSeconds) / 60)}m
              until full day credit
            </span>
          )}
        </div>
      )}
    </div>
  );
}
