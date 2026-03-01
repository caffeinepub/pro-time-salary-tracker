import { formatCurrency } from "@/lib/dateFormatters";
import { calculateLiveEarnings } from "@/lib/storage";
import { TrendingUp } from "lucide-react";

interface EarningsDisplayProps {
  /** Cumulative total seconds: all saved sessions + current running session */
  cumulativeTotalSeconds: number;
  label?: string;
  size?: "sm" | "lg";
}

export function EarningsDisplay({
  cumulativeTotalSeconds,
  label = "Today's Earnings",
  size = "lg",
}: EarningsDisplayProps) {
  const earnings = calculateLiveEarnings(cumulativeTotalSeconds);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
        <TrendingUp size={12} />
        <span>{label}</span>
      </div>
      <div
        className={`earnings-display font-bold text-primary tabular-nums ${size === "lg" ? "text-4xl" : "text-2xl"}`}
      >
        {formatCurrency(earnings)}
      </div>
    </div>
  );
}
