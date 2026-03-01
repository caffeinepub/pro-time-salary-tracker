// Local storage keys
const RECORDS_KEY = "ptt_records";
const TIMER_STATE_KEY = "ptt_timer_state";
const ACCUMULATED_KEY = "ptt_accumulated_today";

export interface DailyRecord {
  date: string; // YYYYMMDD
  actualSecondsWorked: number;
  payableHours: number;
  dailyEarnings: number; // in paise/cents * 100 (stored as integer, e.g. 38460 = 384.60)
  isPaidLeave: boolean;
}

export interface TimerState {
  startedAt: number | null; // timestamp ms
  elapsed: number; // seconds accumulated in the CURRENT session only
  isRunning: boolean;
}

export interface AccumulatedState {
  date: string; // YYYYMMDD — the day these seconds belong to
  seconds: number; // sum of all completed sessions for that day
}

// ---- Record helpers ----

export function getAllRecords(): Record<string, DailyRecord> {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveRecord(record: DailyRecord): void {
  const all = getAllRecords();
  all[record.date] = record;
  localStorage.setItem(RECORDS_KEY, JSON.stringify(all));
}

export function deleteRecord(date: string): void {
  const all = getAllRecords();
  delete all[date];
  localStorage.setItem(RECORDS_KEY, JSON.stringify(all));
}

export function getRecord(date: string): DailyRecord | null {
  const all = getAllRecords();
  return all[date] ?? null;
}

export function getMonthRecords(yearMonth: string): DailyRecord[] {
  // yearMonth: YYYYMM or YYYY-MM
  const prefix = yearMonth.replace("-", "");
  const all = getAllRecords();
  return Object.values(all).filter((r) => r.date.startsWith(prefix));
}

export function getLast6MonthsRecords(): DailyRecord[] {
  const all = getAllRecords();
  const now = new Date();
  const cutoff = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const cutoffStr = formatDateKey(cutoff);
  return Object.values(all)
    .filter((r) => r.date >= cutoffStr)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getPaidLeaveCount(yearMonth: string): number {
  return getMonthRecords(yearMonth).filter((r) => r.isPaidLeave).length;
}

export function deleteMonthRecords(yearMonth: string): void {
  const prefix = yearMonth.replace("-", "");
  const all = getAllRecords();
  for (const date of Object.keys(all)) {
    if (date.startsWith(prefix)) delete all[date];
  }
  localStorage.setItem(RECORDS_KEY, JSON.stringify(all));
}

// ---- Timer state helpers ----

export function getTimerState(): TimerState {
  try {
    const raw = localStorage.getItem(TIMER_STATE_KEY);
    return raw
      ? JSON.parse(raw)
      : { startedAt: null, elapsed: 0, isRunning: false };
  } catch {
    return { startedAt: null, elapsed: 0, isRunning: false };
  }
}

export function saveTimerState(state: TimerState): void {
  localStorage.setItem(TIMER_STATE_KEY, JSON.stringify(state));
}

export function clearTimerState(): void {
  localStorage.setItem(
    TIMER_STATE_KEY,
    JSON.stringify({ startedAt: null, elapsed: 0, isRunning: false }),
  );
}

// ---- Accumulated seconds helpers (sum of all completed sessions today) ----

export function getAccumulatedState(): AccumulatedState {
  try {
    const raw = localStorage.getItem(ACCUMULATED_KEY);
    if (!raw) return { date: "", seconds: 0 };
    return JSON.parse(raw) as AccumulatedState;
  } catch {
    return { date: "", seconds: 0 };
  }
}

/**
 * Returns accumulated seconds for today only. If the stored date differs from
 * today, returns 0 (a new day has started).
 */
export function getAccumulatedSecondsForToday(): number {
  const state = getAccumulatedState();
  const today = todayKey();
  if (state.date !== today) return 0;
  return state.seconds;
}

/**
 * Adds `seconds` to the accumulated total for today, resetting if the date
 * has changed.
 */
export function addToAccumulatedSeconds(seconds: number): void {
  const today = todayKey();
  const state = getAccumulatedState();
  const base = state.date === today ? state.seconds : 0;
  localStorage.setItem(
    ACCUMULATED_KEY,
    JSON.stringify({ date: today, seconds: base + seconds }),
  );
}

/**
 * Resets accumulated seconds (e.g. after a full reset of today's data).
 */
export function clearAccumulatedSeconds(): void {
  localStorage.setItem(
    ACCUMULATED_KEY,
    JSON.stringify({ date: todayKey(), seconds: 0 }),
  );
}

// ---- Date helpers ----

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

export function todayKey(): string {
  return formatDateKey(new Date());
}

export function currentYearMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}${m}`;
}

// ---- Business logic ----

export const HOURLY_RATE = 64.1;
export const THRESHOLD_SECONDS = 19800; // 5.5 hours
export const FULL_DAY_SECONDS = 21600; // 6 hours

export function calculatePayableHours(seconds: number): number {
  if (seconds >= THRESHOLD_SECONDS) return 6;
  return seconds / 3600;
}

export function calculateDailyEarnings(seconds: number): number {
  const payable = calculatePayableHours(seconds);
  return payable * HOURLY_RATE;
}

export function calculateLiveEarnings(elapsed: number): number {
  if (elapsed >= THRESHOLD_SECONDS) return 6 * HOURLY_RATE;
  return (elapsed / 3600) * HOURLY_RATE;
}
