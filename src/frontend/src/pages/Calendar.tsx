import { DayDetailModal } from "@/components/Calendar/DayDetailModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  useApplyPaidLeave,
  useMonthRecords,
  usePaidLeaveCount,
  useSaveDailyRecord,
} from "@/hooks/useQueries";
import {
  type CalendarDay,
  type DayStatus,
  buildCalendarGrid,
  getMonthBounds,
  nextMonth,
  prevMonth,
} from "@/lib/calendarHelpers";
import {
  formatCurrency,
  formatMonthYear,
  secondsToHHMM,
} from "@/lib/dateFormatters";
import { type DailyRecord, currentYearMonth, todayKey } from "@/lib/storage";
import { cn } from "@/lib/utils";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getStatusStyle(status: DayStatus): string {
  const base = "rounded-lg transition-colors cursor-pointer select-none";
  switch (status) {
    case "full":
      return cn(
        base,
        "bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/30 hover:bg-green-500/30",
      );
    case "partial":
      return cn(
        base,
        "bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/30",
      );
    case "sunday":
      return cn(
        base,
        "bg-destructive/10 text-destructive/70 border border-destructive/20 cursor-default",
      );
    case "leave":
      return cn(
        base,
        "bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30",
      );
    case "future":
      return cn(base, "text-muted-foreground/40 cursor-default");
    default:
      return cn(
        base,
        "text-muted-foreground/60 border border-dashed border-muted-foreground/20 hover:bg-secondary/50 hover:border-muted-foreground/40",
      );
  }
}

function DateCell({
  day,
  onClick,
}: { day: CalendarDay; onClick: (day: CalendarDay) => void }) {
  if (!day.isCurrentMonth) {
    return <div className="aspect-square" />;
  }

  // All current-month days are clickable (including empty weekdays for paid leave)
  const isClickable = day.status !== "sunday" && day.status !== "future";

  return (
    <div
      className={cn(
        "aspect-square flex flex-col items-center justify-center text-xs font-medium p-0.5",
        getStatusStyle(day.status),
        day.isToday &&
          "ring-2 ring-primary ring-offset-1 ring-offset-background",
      )}
      onClick={() => isClickable && onClick(day)}
      onKeyDown={(e) =>
        (e.key === "Enter" || e.key === " ") && isClickable && onClick(day)
      }
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      <span
        className={cn(
          "text-sm font-semibold leading-tight",
          day.isToday && "font-extrabold",
        )}
      >
        {day.dayNumber}
      </span>
      {/* Status label below day number */}
      {day.status === "sunday" && (
        <span className="text-[7px] leading-none mt-0.5 opacity-70">Off</span>
      )}
      {day.status === "leave" && (
        <span className="text-[7px] leading-none mt-0.5">Leave</span>
      )}
      {(day.status === "full" || day.status === "partial") && day.record && (
        <span className="text-[7px] leading-none mt-0.5 font-mono">
          {secondsToHHMM(day.record.actualSecondsWorked)}
        </span>
      )}
    </div>
  );
}

function CalendarLegend() {
  const items = [
    {
      color: "bg-green-500/20 border border-green-500/30",
      label: "Full Day (≥5.5h)",
    },
    {
      color: "bg-amber-500/20 border border-amber-500/30",
      label: "Partial (<5.5h)",
    },
    { color: "bg-cyan-500/20 border border-cyan-500/30", label: "Paid Leave" },
    {
      color: "bg-destructive/10 border border-destructive/20",
      label: "Sunday (Off)",
    },
  ];

  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1.5">
      {items.map(({ color, label }) => (
        <div key={label} className="flex items-center gap-1.5">
          <div className={cn("w-3 h-3 rounded-sm", color)} />
          <span className="text-[10px] text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  );
}

export function Calendar() {
  const [yearMonth, setYearMonth] = useState(currentYearMonth());
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const { data: records = [] } = useMonthRecords(yearMonth);
  const { data: paidLeaveCount = 0 } = usePaidLeaveCount(yearMonth);
  const applyPaidLeaveMutation = useApplyPaidLeave();
  const saveDailyRecordMutation = useSaveDailyRecord();
  const bounds = getMonthBounds();

  const recordMap = new Map<string, DailyRecord>(
    records.map((r) => [r.date, r]),
  );
  const weeks = buildCalendarGrid(yearMonth, recordMap);

  const canGoPrev = yearMonth > bounds.min;
  const canGoNext = yearMonth < bounds.max;

  const handleDayClick = (day: CalendarDay) => {
    setSelectedDay(day);
  };

  const handleCloseModal = () => {
    setSelectedDay(null);
  };

  // Derive modal props from selected day
  const selectedRecord = selectedDay?.record ?? null;
  const selectedIsSunday = selectedDay
    ? selectedDay.status === "sunday"
    : false;
  const selectedIsPaidLeave = selectedDay
    ? selectedDay.status === "leave"
    : false;
  const selectedIsToday = selectedDay
    ? selectedDay.dateKey === todayKey()
    : false;
  // Past empty = non-sunday, non-future, no record, not paid leave
  const selectedIsPastEmpty = selectedDay
    ? selectedDay.status === "empty" && selectedDay.isCurrentMonth
    : false;

  return (
    <div className="p-4 space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setYearMonth(prevMonth(yearMonth))}
          disabled={!canGoPrev}
          className="h-9 w-9"
        >
          <ChevronLeft size={18} />
        </Button>
        <div className="flex items-center gap-2">
          <CalendarIcon size={16} className="text-primary" />
          <h2 className="text-base font-bold">{formatMonthYear(yearMonth)}</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setYearMonth(nextMonth(yearMonth))}
          disabled={!canGoNext}
          className="h-9 w-9"
        >
          <ChevronRight size={18} />
        </Button>
      </div>

      {/* Paid leave counter */}
      <div className="flex items-center justify-end">
        <span className="text-xs text-muted-foreground">
          Leaves Used:{" "}
          <span
            className={cn(
              "font-bold",
              paidLeaveCount >= 2 ? "text-destructive" : "text-cyan-500",
            )}
          >
            {paidLeaveCount} / 2
          </span>
        </span>
      </div>

      {/* Calendar grid */}
      <Card className="border-border overflow-hidden">
        <CardContent className="p-3">
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAY_HEADERS.map((d) => (
              <div
                key={d}
                className={cn(
                  "text-center text-[10px] font-semibold py-1",
                  d === "Sun" ? "text-destructive/70" : "text-muted-foreground",
                )}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Weeks */}
          <div className="space-y-1">
            {weeks.map((week, wi) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: calendar weeks are stable positional data
              <div key={wi} className="grid grid-cols-7 gap-1">
                {week.map((day, di) => (
                  <DateCell
                    // biome-ignore lint/suspicious/noArrayIndexKey: calendar cells are stable positional data
                    key={`${wi}-${di}`}
                    day={day}
                    onClick={handleDayClick}
                  />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="border-border">
        <CardContent className="p-3">
          <CalendarLegend />
        </CardContent>
      </Card>

      {/* Month summary */}
      {records.length > 0 && (
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Days Worked</p>
                <p className="text-xl font-bold text-foreground">
                  {records.filter((r) => !r.isPaidLeave).length}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Paid Leave</p>
                <p className="text-xl font-bold text-cyan-500">
                  {paidLeaveCount}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Earned</p>
                <p className="text-xl font-bold text-primary earnings-display">
                  {formatCurrency(
                    records.reduce((s, r) => s + r.dailyEarnings / 100, 0),
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Day detail modal */}
      <DayDetailModal
        dateKey={selectedDay?.dateKey ?? null}
        record={selectedRecord}
        isSunday={selectedIsSunday}
        isPaidLeave={selectedIsPaidLeave}
        isToday={selectedIsToday}
        isPastEmpty={selectedIsPastEmpty}
        paidLeaveCount={paidLeaveCount}
        applyPaidLeaveMutation={applyPaidLeaveMutation}
        saveDailyRecordMutation={saveDailyRecordMutation}
        onClose={handleCloseModal}
      />
    </div>
  );
}
