import type { DailyRecord } from "./storage";
import { THRESHOLD_SECONDS } from "./storage";

export type DayStatus =
  | "full"
  | "partial"
  | "sunday"
  | "leave"
  | "future"
  | "empty";

export interface CalendarDay {
  dateKey: string; // YYYYMMDD
  dayNumber: number;
  dayOfWeek: number; // 0=Sun, 6=Sat
  status: DayStatus;
  record: DailyRecord | null;
  isToday: boolean;
  isCurrentMonth: boolean;
}

export function buildCalendarGrid(
  yearMonth: string, // YYYYMM
  records: Map<string, DailyRecord>,
): CalendarDay[][] {
  const year = Number.parseInt(yearMonth.slice(0, 4));
  const month = Number.parseInt(yearMonth.slice(4, 6)) - 1;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start from Monday (adjust Sunday=0 to be 6, Mon=1 to be 0)
  let startDow = firstDay.getDay(); // 0=Sun
  // Convert to Mon-based: Mon=0, Tue=1, ..., Sun=6
  startDow = startDow === 0 ? 6 : startDow - 1;

  const weeks: CalendarDay[][] = [];
  let currentWeek: CalendarDay[] = [];

  // Fill leading empty cells
  for (let i = 0; i < startDow; i++) {
    currentWeek.push({
      dateKey: "",
      dayNumber: 0,
      dayOfWeek: i,
      status: "empty",
      record: null,
      isToday: false,
      isCurrentMonth: false,
    });
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d);
    const dow = date.getDay(); // 0=Sun
    const monDow = dow === 0 ? 6 : dow - 1;

    const y = year;
    const m = String(month + 1).padStart(2, "0");
    const day = String(d).padStart(2, "0");
    const dateKey = `${y}${m}${day}`;

    const record = records.get(dateKey) ?? null;
    const isToday = date.getTime() === today.getTime();
    const isFuture = date > today;

    let status: DayStatus;
    if (dow === 0) {
      status = "sunday";
    } else if (isFuture) {
      status = "future";
    } else if (record?.isPaidLeave) {
      status = "leave";
    } else if (record && record.actualSecondsWorked >= THRESHOLD_SECONDS) {
      status = "full";
    } else if (record && record.actualSecondsWorked > 0) {
      status = "partial";
    } else {
      status = "empty";
    }

    currentWeek.push({
      dateKey,
      dayNumber: d,
      dayOfWeek: monDow,
      status,
      record,
      isToday,
      isCurrentMonth: true,
    });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Fill trailing empty cells
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({
        dateKey: "",
        dayNumber: 0,
        dayOfWeek: currentWeek.length,
        status: "empty",
        record: null,
        isToday: false,
        isCurrentMonth: false,
      });
    }
    weeks.push(currentWeek);
  }

  return weeks;
}

export function getMonthBounds(): { min: string; max: string } {
  const now = new Date();
  const maxYear = now.getFullYear();
  const maxMonth = now.getMonth() + 1;
  const minDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const minYear = minDate.getFullYear();
  const minMonth = minDate.getMonth() + 1;
  return {
    min: `${minYear}${String(minMonth).padStart(2, "0")}`,
    max: `${maxYear}${String(maxMonth).padStart(2, "0")}`,
  };
}

export function prevMonth(yearMonth: string): string {
  const year = Number.parseInt(yearMonth.slice(0, 4));
  const month = Number.parseInt(yearMonth.slice(4, 6));
  const d = new Date(year, month - 2, 1);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function nextMonth(yearMonth: string): string {
  const year = Number.parseInt(yearMonth.slice(0, 4));
  const month = Number.parseInt(yearMonth.slice(4, 6));
  const d = new Date(year, month, 1);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
}
