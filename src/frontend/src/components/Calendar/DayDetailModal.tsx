import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatCurrency,
  formatDateDisplay,
  formatPayableHours,
  secondsToHHMM,
} from "@/lib/dateFormatters";
import type { DailyRecord } from "@/lib/storage";
import type { UseMutationResult } from "@tanstack/react-query";
import { Clock, DollarSign, Palmtree, PlusCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface DayDetailModalProps {
  dateKey: string | null;
  record: DailyRecord | null;
  isSunday: boolean;
  isPaidLeave: boolean;
  isToday: boolean;
  isPastEmpty: boolean; // true if past weekday with no record and no leave
  paidLeaveCount: number;
  applyPaidLeaveMutation: UseMutationResult<
    DailyRecord,
    Error,
    string,
    unknown
  >;
  saveDailyRecordMutation: UseMutationResult<
    DailyRecord,
    Error,
    { date: string; additionalSecondsWorked: number },
    unknown
  >;
  onClose: () => void;
}

export function DayDetailModal({
  dateKey,
  record,
  isSunday,
  isPaidLeave,
  isToday,
  isPastEmpty,
  paidLeaveCount,
  applyPaidLeaveMutation,
  saveDailyRecordMutation,
  onClose,
}: DayDetailModalProps) {
  const isOpen = !!dateKey;

  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  const MANUAL_ENTRY_PASSWORD = "9215";

  const canApplyLeave =
    !record && !isSunday && !isPaidLeave && paidLeaveCount < 2;

  const handleApplyLeave = async () => {
    if (!dateKey) return;
    try {
      await applyPaidLeaveMutation.mutateAsync(dateKey);
      toast.success("Paid leave applied successfully! 🌴");
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to apply paid leave.";
      toast.error(msg);
    }
  };

  const handleAddTime = async () => {
    if (!dateKey) return;
    const h = Number.parseInt(hours || "0", 10);
    const m = Number.parseInt(minutes || "0", 10);
    if (Number.isNaN(h) || Number.isNaN(m) || (h === 0 && m === 0)) {
      toast.error("Please enter a valid time (at least 1 minute).");
      return;
    }
    if (h > 23 || m > 59) {
      toast.error("Invalid time: hours must be 0-23 and minutes 0-59.");
      return;
    }
    const additionalSeconds = h * 3600 + m * 60;
    try {
      await saveDailyRecordMutation.mutateAsync({
        date: dateKey,
        additionalSecondsWorked: additionalSeconds,
      });
      toast.success("Working time added successfully!");
      setHours("");
      setMinutes("");
      setShowAddForm(false);
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to save working time.";
      toast.error(msg);
    }
  };

  const handleClose = () => {
    setHours("");
    setMinutes("");
    setShowAddForm(false);
    setShowPasswordPrompt(false);
    setPasswordInput("");
    setPasswordError(false);
    onClose();
  };

  const handleRequestAddForm = () => {
    setPasswordInput("");
    setPasswordError(false);
    setShowPasswordPrompt(true);
  };

  const handlePasswordSubmit = () => {
    if (passwordInput === MANUAL_ENTRY_PASSWORD) {
      setShowPasswordPrompt(false);
      setPasswordInput("");
      setPasswordError(false);
      setShowAddForm(true);
    } else {
      setPasswordError(true);
      setPasswordInput("");
    }
  };

  // Show "Add Working Time" option for:
  // - past empty days (no record, not sunday, not paid leave, not future)
  // - today even if it already has a record (can add more sessions via manual entry)
  // - today if empty
  const canAddWorkingTime =
    !isSunday && !isPaidLeave && (isPastEmpty || isToday);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">
            {dateKey ? formatDateDisplay(dateKey) : ""}
          </DialogTitle>
          <DialogDescription>
            {isPaidLeave
              ? "🌴 Paid Leave Day"
              : isSunday
                ? "😴 Sunday – Rest Day"
                : record
                  ? "Work Session Details"
                  : "No record for this day"}
          </DialogDescription>
        </DialogHeader>

        {record && (
          <div className="grid grid-cols-3 gap-3 py-2">
            <div className="flex flex-col items-center gap-1 p-3 bg-secondary/50 rounded-xl">
              <Clock size={16} className="text-muted-foreground" />
              <p className="text-[10px] text-muted-foreground text-center">
                Actual Time
              </p>
              <p className="text-base font-bold font-mono">
                {secondsToHHMM(record.actualSecondsWorked)}
              </p>
            </div>
            <div className="flex flex-col items-center gap-1 p-3 bg-secondary/50 rounded-xl">
              <Clock size={16} className="text-muted-foreground" />
              <p className="text-[10px] text-muted-foreground text-center">
                Payable
              </p>
              <p className="text-base font-bold font-mono">
                {formatPayableHours(record.payableHours)}
              </p>
            </div>
            <div className="flex flex-col items-center gap-1 p-3 bg-primary/10 rounded-xl">
              <DollarSign size={16} className="text-primary" />
              <p className="text-[10px] text-muted-foreground text-center">
                Earned
              </p>
              <p className="text-base font-bold text-primary earnings-display">
                {formatCurrency(record.dailyEarnings / 100)}
              </p>
            </div>
          </div>
        )}

        {/* Add Working Time — for past missed days or today */}
        {canAddWorkingTime && !showAddForm && !showPasswordPrompt && (
          <div className="pt-1">
            <Button
              variant="outline"
              onClick={handleRequestAddForm}
              className="w-full gap-2 border-dashed"
            >
              <PlusCircle size={16} />
              {record ? "Add More Working Time" : "Add Working Time"}
            </Button>
            {isPastEmpty && !record && (
              <p className="text-[10px] text-muted-foreground text-center mt-1.5">
                Missed logging this day? Enter your hours manually.
              </p>
            )}
          </div>
        )}

        {/* Password prompt for manual time entry */}
        {canAddWorkingTime && showPasswordPrompt && (
          <div className="pt-2 space-y-3">
            <p className="text-xs text-center text-muted-foreground">
              Enter password to add working time manually.
            </p>
            <div>
              <Input
                type="password"
                placeholder="Enter password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError(false);
                }}
                onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
                className={`text-center font-mono text-lg h-11 ${passwordError ? "border-destructive" : ""}`}
                autoFocus
              />
              {passwordError && (
                <p className="text-xs text-destructive text-center mt-1.5">
                  Incorrect password. Please try again.
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPasswordPrompt(false);
                  setPasswordInput("");
                  setPasswordError(false);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePasswordSubmit}
                className="flex-1"
                disabled={!passwordInput}
              >
                Confirm
              </Button>
            </div>
          </div>
        )}

        {canAddWorkingTime && showAddForm && (
          <div className="pt-2 space-y-3">
            <p className="text-xs text-muted-foreground text-center">
              {record
                ? "Enter additional time to add to this day's total."
                : "Enter the total time you worked on this day."}
            </p>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label htmlFor="hours-input" className="text-xs mb-1.5 block">
                  Hours
                </Label>
                <Input
                  id="hours-input"
                  type="number"
                  min="0"
                  max="23"
                  placeholder="0"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="text-center font-mono text-lg h-11"
                />
              </div>
              <span className="text-2xl font-bold text-muted-foreground pb-2">
                :
              </span>
              <div className="flex-1">
                <Label htmlFor="minutes-input" className="text-xs mb-1.5 block">
                  Minutes
                </Label>
                <Input
                  id="minutes-input"
                  type="number"
                  min="0"
                  max="59"
                  placeholder="0"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  className="text-center font-mono text-lg h-11"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setHours("");
                  setMinutes("");
                }}
                className="flex-1"
                disabled={saveDailyRecordMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddTime}
                disabled={saveDailyRecordMutation.isPending}
                className="flex-1 gap-2"
              >
                {saveDailyRecordMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Time"
                )}
              </Button>
            </div>
          </div>
        )}

        {canApplyLeave && !showAddForm && (
          <div className="pt-1">
            <p className="text-xs text-muted-foreground mb-2 text-center">
              You have {2 - paidLeaveCount} paid leave(s) remaining this month.
            </p>
            <Button
              onClick={handleApplyLeave}
              disabled={applyPaidLeaveMutation.isPending}
              className="w-full gap-2 bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              {applyPaidLeaveMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <Palmtree size={16} />
                  Apply Paid Leave
                </>
              )}
            </Button>
          </div>
        )}

        {!record &&
          !canApplyLeave &&
          !isSunday &&
          paidLeaveCount >= 2 &&
          !canAddWorkingTime && (
            <p className="text-xs text-muted-foreground text-center py-2">
              Monthly paid leave quota (2/2) already used.
            </p>
          )}
      </DialogContent>
    </Dialog>
  );
}
