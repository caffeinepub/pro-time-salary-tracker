import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useLast6MonthsRecords } from "@/hooks/useQueries";
import {
  formatCurrency,
  formatDateDisplay,
  formatMonthYear,
  formatPayableHours,
  getLast6Months,
  groupRecordsByMonth,
  secondsToHHMM,
} from "@/lib/dateFormatters";
import type { DailyRecord } from "@/lib/storage";
import { Clock, History as HistoryIcon, TrendingUp } from "lucide-react";

function RecordRow({ record }: { record: DailyRecord }) {
  return (
    <div className="flex items-center justify-between py-3 px-1">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground truncate">
            {formatDateDisplay(record.date)}
          </p>
          {record.isPaidLeave && (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 bg-cal-leave/20 text-cal-leave border-cal-leave/30"
            >
              🌴 Paid Leave
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-muted-foreground font-mono">
            {secondsToHHMM(record.actualSecondsWorked)} actual
          </span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">
            {formatPayableHours(record.payableHours)} payable
          </span>
        </div>
      </div>
      <div className="text-right ml-3">
        <p className="text-sm font-bold text-primary earnings-display">
          {formatCurrency(record.dailyEarnings / 100)}
        </p>
      </div>
    </div>
  );
}

function MonthGroup({
  yearMonth,
  records,
}: { yearMonth: string; records: DailyRecord[] }) {
  const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));
  const total = records.reduce((sum, r) => sum + r.dailyEarnings / 100, 0);
  const workDays = records.filter((r) => !r.isPaidLeave).length;
  const leaveDays = records.filter((r) => r.isPaidLeave).length;

  return (
    <Card className="border-border shadow-xs overflow-hidden">
      <CardHeader className="py-3 px-4 bg-secondary/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-foreground">
            {formatMonthYear(yearMonth)}
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {workDays}d worked
            </span>
            {leaveDays > 0 && (
              <span className="text-xs text-cal-leave">{leaveDays} leave</span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border px-4">
          {sorted.map((record) => (
            <RecordRow key={record.date} record={record} />
          ))}
        </div>
        <Separator />
        <div className="flex items-center justify-between px-4 py-3 bg-primary/5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <TrendingUp size={12} />
            Monthly Total
          </div>
          <p className="text-base font-bold text-primary earnings-display">
            {formatCurrency(total)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function History() {
  const { data: records = [], isLoading } = useLast6MonthsRecords();

  const grouped = groupRecordsByMonth(records);
  const last6 = getLast6Months();

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <HistoryIcon size={18} className="text-primary" />
        <h2 className="text-lg font-bold">Work History</h2>
        <span className="text-xs text-muted-foreground ml-auto">
          Last 6 months
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <Card className="border-border">
          <CardContent className="p-8 text-center">
            <Clock size={32} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              No records yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Start tracking your work time on the Dashboard
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {last6.map((ym) => {
            const monthRecords = grouped.get(ym);
            if (!monthRecords || monthRecords.length === 0) return null;
            return (
              <MonthGroup key={ym} yearMonth={ym} records={monthRecords} />
            );
          })}
        </div>
      )}
    </div>
  );
}
