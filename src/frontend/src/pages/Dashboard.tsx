import { EarningsDisplay } from "@/components/Dashboard/EarningsDisplay";
import { ProgressBar } from "@/components/Dashboard/ProgressBar";
import { TimerConfirmDialog } from "@/components/Dashboard/TimerConfirmDialog";
import { XeroxExpressCard } from "@/components/Dashboard/XeroxExpressCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  useMonthlyTotal,
  useSaveDailyRecord,
  useTodayRecord,
} from "@/hooks/useQueries";
import { useTimer } from "@/hooks/useTimer";
import {
  formatCurrency,
  formatDateDisplay,
  secondsToHHMMSS,
} from "@/lib/dateFormatters";
import {
  THRESHOLD_SECONDS,
  calculateLiveEarnings,
  currentYearMonth,
  todayKey,
} from "@/lib/storage";
import { cn } from "@/lib/utils";
import { Calendar, Clock, Play, Square } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type ConfirmDialog = "start" | "stop" | null;

export function Dashboard() {
  const { currentSessionElapsed, accumulatedSeconds, isRunning, start, stop } =
    useTimer();
  const saveMutation = useSaveDailyRecord();
  const { data: monthlyTotal = 0 } = useMonthlyTotal(currentYearMonth());
  const { data: todayRecord } = useTodayRecord();
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>(null);

  const today = todayKey();

  // Cumulative total = all saved sessions today + current running session
  const cumulativeTotalSeconds = accumulatedSeconds + currentSessionElapsed;
  const isFullDay = cumulativeTotalSeconds >= THRESHOLD_SECONDS;

  const handleStartClick = () => {
    setConfirmDialog("start");
  };

  const handleStopClick = () => {
    setConfirmDialog("stop");
  };

  const handleConfirmStart = () => {
    setConfirmDialog(null);
    start();
  };

  const handleConfirmStop = async () => {
    setConfirmDialog(null);
    // stop() returns the current session's elapsed seconds and updates accumulated
    const sessionSeconds = stop();
    if (sessionSeconds === 0) {
      toast.error("No time recorded to save.");
      return;
    }
    try {
      // Save only the incremental seconds from this session
      await saveMutation.mutateAsync({
        date: today,
        additionalSecondsWorked: sessionSeconds,
      });
      toast.success("Session saved successfully!");
    } catch {
      toast.error("Failed to save session.");
    }
  };

  const handleCancel = () => {
    setConfirmDialog(null);
  };

  const isSunday = new Date().getDay() === 0;

  // Today's card value: use saved record earnings if available, otherwise live cumulative
  const todayCardValue = (() => {
    if (todayRecord?.isPaidLeave) return "🌴 Leave";
    // Saved record total + any live running session on top
    const savedSeconds = todayRecord ? todayRecord.actualSecondsWorked : 0;
    const liveTotal = isRunning
      ? savedSeconds + currentSessionElapsed
      : savedSeconds;
    if (liveTotal > 0) return formatCurrency(calculateLiveEarnings(liveTotal));
    return "—";
  })();

  return (
    <div className="p-4 space-y-4">
      {/* Xerox Express Task List */}
      <XeroxExpressCard />

      {/* Date header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar size={12} />
            {formatDateDisplay(today)}
          </p>
          {isSunday && (
            <Badge variant="destructive" className="mt-1 text-xs">
              Sunday – Rest Day
            </Badge>
          )}
        </div>
        {todayRecord && (
          <Badge variant="outline" className="text-xs">
            {todayRecord.isPaidLeave ? "🌴 Paid Leave" : "✓ Saved"}
          </Badge>
        )}
      </div>

      {/* Timer Card */}
      <Card className="border-border shadow-card-dark overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-6">
            {/* Timer display — shows current session only, resets to 0:00:00 on each new session */}
            <div className="relative">
              <div
                className={cn(
                  "timer-display text-6xl font-bold tabular-nums transition-colors",
                  isRunning
                    ? "text-primary animate-pulse-glow"
                    : "text-foreground",
                  isFullDay && "text-green-500",
                )}
              >
                {secondsToHHMMSS(currentSessionElapsed)}
              </div>
              {isRunning && (
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
              )}
            </div>

            {/* Accumulated sessions indicator */}
            {accumulatedSeconds > 0 && (
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock size={11} />
                <span>
                  Previous sessions today: {secondsToHHMMSS(accumulatedSeconds)}
                </span>
              </div>
            )}

            {/* Progress bar — uses cumulative total */}
            <div className="w-full">
              <ProgressBar cumulativeTotalSeconds={cumulativeTotalSeconds} />
            </div>

            {/* Start/Stop button */}
            <button
              type="button"
              onClick={isRunning ? handleStopClick : handleStartClick}
              disabled={!!todayRecord?.isPaidLeave || saveMutation.isPending}
              className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg",
                "border-4 font-bold text-sm",
                isRunning
                  ? "bg-destructive border-destructive/50 text-destructive-foreground hover:bg-destructive/90 animate-pulse-glow"
                  : "bg-primary border-primary/50 text-primary-foreground hover:bg-primary/90",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            >
              {saveMutation.isPending ? (
                <div className="w-8 h-8 border-4 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : isRunning ? (
                <div className="flex flex-col items-center gap-1">
                  <Square size={24} fill="currentColor" />
                  <span className="text-[10px]">STOP</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <Play size={24} fill="currentColor" />
                  <span className="text-[10px]">START</span>
                </div>
              )}
            </button>

            {/* Today's earnings — cumulative total (all sessions + live) */}
            <EarningsDisplay cumulativeTotalSeconds={cumulativeTotalSeconds} />
          </div>
        </CardContent>
      </Card>

      {/* Monthly summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={14} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Monthly Total
              </span>
            </div>
            <div className="text-2xl font-bold text-primary earnings-display">
              {formatCurrency(monthlyTotal)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={14} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Today</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {todayCardValue}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation dialogs */}
      <TimerConfirmDialog
        open={confirmDialog === "start"}
        title="Start New Session?"
        description={
          accumulatedSeconds > 0
            ? `You've already tracked ${secondsToHHMMSS(accumulatedSeconds)} today. The timer will reset to 0:00:00 for this new session.`
            : "This will begin recording your work session for today."
        }
        confirmLabel="Start"
        onConfirm={handleConfirmStart}
        onCancel={handleCancel}
      />
      <TimerConfirmDialog
        open={confirmDialog === "stop"}
        title="Stop & Save Session?"
        description={`This session of ${secondsToHHMMSS(currentSessionElapsed)} will be added to today's total (${secondsToHHMMSS(cumulativeTotalSeconds)} cumulative).`}
        confirmLabel="Stop & Save"
        confirmVariant="destructive"
        onConfirm={handleConfirmStop}
        onCancel={handleCancel}
      />
    </div>
  );
}
