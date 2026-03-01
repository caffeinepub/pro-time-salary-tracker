import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type DailyRecord,
  THRESHOLD_SECONDS,
  calculateDailyEarnings,
  calculatePayableHours,
  currentYearMonth,
  deleteMonthRecords,
  deleteRecord,
  getAllRecords,
  getLast6MonthsRecords,
  getMonthRecords,
  getPaidLeaveCount,
  getRecord,
  saveRecord,
  todayKey,
} from "../lib/storage";
import { useActor } from "./useActor";

// ---- Query Keys ----
export const QUERY_KEYS = {
  allRecords: ["allRecords"],
  monthRecords: (ym: string) => ["monthRecords", ym],
  last6Months: ["last6MonthsRecords"],
  paidLeaveCount: (ym: string) => ["paidLeaveCount", ym],
  todayRecord: ["todayRecord"],
};

// ---- Queries ----

export function useMonthRecords(yearMonth: string) {
  return useQuery({
    queryKey: QUERY_KEYS.monthRecords(yearMonth),
    queryFn: () => getMonthRecords(yearMonth),
    staleTime: 0,
  });
}

export function useLast6MonthsRecords() {
  return useQuery({
    queryKey: QUERY_KEYS.last6Months,
    queryFn: () => getLast6MonthsRecords(),
    staleTime: 0,
  });
}

export function usePaidLeaveCount(yearMonth: string) {
  return useQuery({
    queryKey: QUERY_KEYS.paidLeaveCount(yearMonth),
    queryFn: () => getPaidLeaveCount(yearMonth),
    staleTime: 0,
  });
}

export function useTodayRecord() {
  return useQuery({
    queryKey: QUERY_KEYS.todayRecord,
    queryFn: () => getRecord(todayKey()),
    staleTime: 0,
  });
}

export function useMonthlyTotal(yearMonth: string) {
  return useQuery({
    queryKey: ["monthlyTotal", yearMonth],
    queryFn: () => {
      const records = getMonthRecords(yearMonth);
      return records.reduce((sum, r) => sum + r.dailyEarnings / 100, 0);
    },
    staleTime: 0,
  });
}

// ---- Mutations ----

/**
 * Saves an incremental session to the day's record.
 * `additionalSecondsWorked` is the seconds from the just-completed session only.
 * The mutation adds these to any existing record for that date.
 */
export function useSaveDailyRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      date,
      additionalSecondsWorked,
    }: { date: string; additionalSecondsWorked: number }) => {
      // Get existing record for this date (if any)
      const existing = getRecord(date);
      const existingSeconds =
        existing && !existing.isPaidLeave ? existing.actualSecondsWorked : 0;

      // Cumulative total for this day
      const totalSeconds = existingSeconds + additionalSecondsWorked;

      // Recalculate payable hours and earnings on the cumulative total
      const payableHours = calculatePayableHours(totalSeconds);
      const dailyEarningsFloat = calculateDailyEarnings(totalSeconds);
      const dailyEarnings = Math.round(dailyEarningsFloat * 100); // store as integer cents

      const record: DailyRecord = {
        date,
        actualSecondsWorked: totalSeconds,
        payableHours,
        dailyEarnings,
        isPaidLeave: false,
      };

      // Save locally first
      saveRecord(record);

      // Sync to backend — pass only the incremental seconds; backend adds to existing
      if (actor) {
        try {
          await actor.saveDailyRecord(date, BigInt(additionalSecondsWorked));
        } catch (err) {
          console.warn("Backend sync failed:", err);
        }
      }

      return record;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allRecords });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.last6Months });
      queryClient.invalidateQueries({ queryKey: ["monthlyTotal"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todayRecord });
      const ym = currentYearMonth();
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.monthRecords(ym) });
    },
  });
}

export function useApplyPaidLeave() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (date: string) => {
      const ym = date.slice(0, 6);
      const currentCount = getPaidLeaveCount(ym);

      if (currentCount >= 2) {
        throw new Error("Monthly paid leave quota (2 days) already reached.");
      }

      const existing = getRecord(date);
      if (existing?.isPaidLeave) {
        throw new Error("Paid leave already applied for this date.");
      }

      const record: DailyRecord = {
        date,
        actualSecondsWorked: 21600,
        payableHours: 6,
        dailyEarnings: 38460, // 384.60 * 100
        isPaidLeave: true,
      };

      saveRecord(record);

      if (actor) {
        try {
          await actor.applyPaidLeave(date);
        } catch (err) {
          console.warn("Backend sync failed:", err);
        }
      }

      return record;
    },
    onSuccess: (_data, date) => {
      const ym = date.slice(0, 6);
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.paidLeaveCount(ym),
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.monthRecords(ym) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.last6Months });
      queryClient.invalidateQueries({ queryKey: ["monthlyTotal"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todayRecord });
    },
  });
}

export function useResetMonthData() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (yearMonth: string) => {
      // Delete locally
      deleteMonthRecords(yearMonth);

      // Sync to backend
      if (actor) {
        try {
          await actor.resetMonthData(yearMonth);
        } catch (err) {
          console.warn("Backend sync failed:", err);
        }
      }
    },
    onSuccess: (_data, yearMonth) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.monthRecords(yearMonth),
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.last6Months });
      queryClient.invalidateQueries({ queryKey: ["monthlyTotal"] });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.paidLeaveCount(yearMonth),
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todayRecord });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allRecords });
    },
  });
}
