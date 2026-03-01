import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  useApplyPaidLeave,
  useMonthRecords,
  usePaidLeaveCount,
} from "@/hooks/useQueries";
import { formatDateDisplay, formatMonthYear } from "@/lib/dateFormatters";
import { currentYearMonth, todayKey } from "@/lib/storage";
import { formatDateKey } from "@/lib/storage";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Info,
  Palmtree,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function Leave() {
  const ym = currentYearMonth();
  const { data: leaveCount = 0, refetch: refetchCount } = usePaidLeaveCount(ym);
  const { data: monthRecords = [], refetch: refetchRecords } =
    useMonthRecords(ym);
  const applyMutation = useApplyPaidLeave();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const quotaReached = leaveCount >= 2;
  const leaveRecords = monthRecords.filter((r) => r.isPaidLeave);

  const handleApplyClick = () => {
    setSelectedDate(undefined);
    setDialogOpen(true);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const handleConfirm = () => {
    if (!selectedDate) return;
    setDialogOpen(false);
    setConfirmOpen(true);
  };

  const handleFinalConfirm = async () => {
    if (!selectedDate) return;
    const dateKey = formatDateKey(selectedDate);
    try {
      await applyMutation.mutateAsync(dateKey);
      refetchCount();
      refetchRecords();
      toast.success(`Paid leave applied for ${formatDateDisplay(dateKey)}`);
      setConfirmOpen(false);
      setSelectedDate(undefined);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to apply paid leave";
      toast.error(msg);
      setConfirmOpen(false);
    }
  };

  // Disable Sundays and future dates beyond today, and already-leave dates
  const leaveSet = new Set(leaveRecords.map((r) => r.date));
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const isDateDisabled = (date: Date) => {
    if (date > today) return true;
    if (date.getDay() === 0) return true; // Sunday
    const key = formatDateKey(date);
    if (leaveSet.has(key)) return true;
    return false;
  };

  // Only allow dates within last 6 months
  const minDate = new Date();
  minDate.setMonth(minDate.getMonth() - 5);
  minDate.setDate(1);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Palmtree size={18} className="text-primary" />
        <h2 className="text-lg font-bold">Leave Management</h2>
      </div>

      {/* Quota card */}
      <Card
        className={cn(
          "border-2 overflow-hidden",
          quotaReached ? "border-destructive/40" : "border-primary/30",
        )}
      >
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                {formatMonthYear(ym)} · Paid Leave Quota
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-foreground">
                  {leaveCount}
                </span>
                <span className="text-xl text-muted-foreground font-medium">
                  / 2
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {quotaReached
                  ? "Monthly quota reached"
                  : `${2 - leaveCount} day${2 - leaveCount !== 1 ? "s" : ""} remaining`}
              </p>
            </div>
            <div
              className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center",
                quotaReached ? "bg-destructive/10" : "bg-primary/10",
              )}
            >
              {quotaReached ? (
                <AlertCircle size={28} className="text-destructive" />
              ) : (
                <Palmtree size={28} className="text-primary" />
              )}
            </div>
          </div>

          {/* Quota dots */}
          <div className="flex gap-2 mt-4">
            {[0, 1].map((i) => (
              <div
                key={i}
                className={cn(
                  "h-2 flex-1 rounded-full transition-colors",
                  i < leaveCount ? "bg-primary" : "bg-secondary",
                )}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Apply button */}
      <Button
        onClick={handleApplyClick}
        disabled={quotaReached || applyMutation.isPending}
        className="w-full h-12 text-base font-semibold gap-2"
        size="lg"
      >
        {applyMutation.isPending ? (
          <>
            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            Applying...
          </>
        ) : (
          <>
            <CalendarDays size={18} />
            Apply Paid Leave
          </>
        )}
      </Button>

      {quotaReached && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
          <Info size={14} className="text-destructive shrink-0" />
          <p className="text-xs text-destructive">
            You've used all 2 paid leave days for this month. Quota resets next
            month.
          </p>
        </div>
      )}

      {/* Leave records this month */}
      {leaveRecords.length > 0 && (
        <Card className="border-border">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-semibold">
              Applied Leaves This Month
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border px-4">
              {leaveRecords.map((r) => (
                <div
                  key={r.date}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-primary" />
                    <span className="text-sm">{formatDateDisplay(r.date)}</span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-xs bg-primary/10 text-primary border-primary/20"
                  >
                    ₹384.60
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info card */}
      <Card className="border-border bg-secondary/20">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Info size={16} className="text-muted-foreground shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-foreground">
                Paid Leave Policy
              </p>
              <p className="text-xs text-muted-foreground">
                Each paid leave day credits 6 hours (₹384.60) to your monthly
                earnings. Maximum 2 paid leave days per calendar month.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Date picker dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Select Leave Date</DialogTitle>
            <DialogDescription>
              Choose a working day to apply paid leave. Sundays and future dates
              are not allowed.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-2">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={isDateDisabled}
              fromDate={minDate}
              toDate={new Date()}
              className="rounded-lg border border-border"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={!selectedDate}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Paid Leave</DialogTitle>
            <DialogDescription>
              {selectedDate && (
                <>
                  Apply paid leave for{" "}
                  <strong>
                    {formatDateDisplay(formatDateKey(selectedDate))}
                  </strong>
                  ? This will credit ₹384.60 to your monthly earnings.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleFinalConfirm}
              disabled={applyMutation.isPending}
            >
              {applyMutation.isPending ? "Applying..." : "Apply Leave"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
