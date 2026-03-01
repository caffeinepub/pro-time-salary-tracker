export function formatDateDisplay(dateKey: string): string {
  // YYYYMMDD -> "Mon, 25 Feb 2026"
  const y = Number.parseInt(dateKey.slice(0, 4));
  const m = Number.parseInt(dateKey.slice(4, 6)) - 1;
  const d = Number.parseInt(dateKey.slice(6, 8));
  const date = new Date(y, m, d);
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateShort(dateKey: string): string {
  // YYYYMMDD -> "25 Feb"
  const y = Number.parseInt(dateKey.slice(0, 4));
  const m = Number.parseInt(dateKey.slice(4, 6)) - 1;
  const d = Number.parseInt(dateKey.slice(6, 8));
  const date = new Date(y, m, d);
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function formatMonthYear(yearMonth: string): string {
  // YYYYMM -> "February 2026"
  const y = Number.parseInt(yearMonth.slice(0, 4));
  const m = Number.parseInt(yearMonth.slice(4, 6)) - 1;
  const date = new Date(y, m, 1);
  return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export function formatMonthYearDash(yearMonth: string): string {
  // YYYY-MM -> "February 2026"
  const [y, m] = yearMonth.split("-").map(Number);
  const date = new Date(y, m - 1, 1);
  return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export function secondsToHHMM(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function secondsToHHMMSS(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatPayableHours(payableHours: number): string {
  const h = Math.floor(payableHours);
  const m = Math.round((payableHours - h) * 60);
  if (m === 0) return `${h}h 0m`;
  return `${h}h ${m}m`;
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toFixed(2)}`;
}

export function formatCurrencyInt(amountCents: number): string {
  // amountCents is stored as integer * 100 (e.g. 38460 = 384.60)
  return `₹${(amountCents / 100).toFixed(2)}`;
}

export function isSunday(dateKey: string): boolean {
  const y = Number.parseInt(dateKey.slice(0, 4));
  const m = Number.parseInt(dateKey.slice(4, 6)) - 1;
  const d = Number.parseInt(dateKey.slice(6, 8));
  return new Date(y, m, d).getDay() === 0;
}

export function getYearMonthFromKey(dateKey: string): string {
  return dateKey.slice(0, 6); // YYYYMM
}

export function groupRecordsByMonth<T extends { date: string }>(
  records: T[],
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const r of records) {
    const ym = getYearMonthFromKey(r.date);
    if (!map.has(ym)) map.set(ym, []);
    map.get(ym)!.push(r);
  }
  return map;
}

export function getLast6Months(): string[] {
  // Returns array of YYYYMM strings for last 6 months (most recent first)
  const result: string[] = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    result.push(`${y}${m}`);
  }
  return result;
}

export function dateKeyToDate(dateKey: string): Date {
  const y = Number.parseInt(dateKey.slice(0, 4));
  const m = Number.parseInt(dateKey.slice(4, 6)) - 1;
  const d = Number.parseInt(dateKey.slice(6, 8));
  return new Date(y, m, d);
}
