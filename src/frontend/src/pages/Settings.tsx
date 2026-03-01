import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useResetMonthData } from "@/hooks/useQueries";
import { getLast6Months } from "@/lib/dateFormatters";
import { formatMonthYear } from "@/lib/dateFormatters";
import { currentYearMonth } from "@/lib/storage";
import {
  AlertTriangle,
  Info,
  RefreshCw,
  Settings as SettingsIcon,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function Settings() {
  const [selectedMonth, setSelectedMonth] = useState(currentYearMonth());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const resetMutation = useResetMonthData();
  const months = getLast6Months();

  const handleReset = async () => {
    try {
      await resetMutation.mutateAsync(selectedMonth);
      toast.success(
        `All records for ${formatMonthYear(selectedMonth)} have been deleted.`,
      );
      setConfirmOpen(false);
    } catch {
      toast.error("Failed to reset month data. Please try again.");
      setConfirmOpen(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <SettingsIcon size={18} className="text-primary" />
        <h2 className="text-lg font-bold">Settings</h2>
      </div>

      {/* App info */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <img
              src="/assets/generated/app-logo.dim_256x256.png"
              alt="App Logo"
              className="w-12 h-12 rounded-xl object-cover"
            />
            <div>
              <p className="font-bold text-foreground">
                Pro Time & Salary Tracker
              </p>
              <p className="text-xs text-muted-foreground">
                ₹10,000/month · 26 working days · 6 days/week
              </p>
              <p className="text-xs text-muted-foreground">
                Hourly rate: ₹64.10 · 5h30m threshold
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payroll info */}
      <Card className="border-border">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Info size={14} className="text-primary" />
            Payroll Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {[
              { label: "Monthly Base Salary", value: "₹10,000" },
              { label: "Working Days/Month", value: "26 days" },
              { label: "Work Week", value: "6 days (Mon–Sat)" },
              { label: "Daily Target", value: "6 hours" },
              { label: "Full Day Threshold", value: "5h 30m" },
              { label: "Hourly Rate", value: "₹64.10" },
              { label: "Full Day Earnings", value: "₹384.60" },
              { label: "Paid Leave Quota", value: "2 days/month" },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex items-center justify-between px-4 py-2.5"
              >
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-xs font-semibold text-foreground">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Reset section */}
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-semibold text-destructive flex items-center gap-2">
            <AlertTriangle size={14} />
            Danger Zone
          </CardTitle>
          <CardDescription className="text-xs">
            Permanently delete all records for a selected month. This action
            cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
          <div className="space-y-1.5">
            <label
              htmlFor="month-reset-select"
              className="text-xs font-medium text-muted-foreground"
            >
              Select Month to Reset
            </label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((ym) => (
                  <SelectItem key={ym} value={ym}>
                    {formatMonthYear(ym)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
            disabled={resetMutation.isPending}
            className="w-full gap-2"
          >
            {resetMutation.isPending ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Resetting...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Reset Month Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Confirmation dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-destructive" />
              Confirm Reset
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all records for{" "}
              <strong>{formatMonthYear(selectedMonth)}</strong>? This cannot be
              undone. All work sessions and leave records for this month will be
              permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete All Records
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Footer */}
      <footer className="text-center py-4">
        <p className="text-[10px] text-muted-foreground">
          Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>{" "}
          · © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
