// ADR operates in the Texoma Corridor — everything renders in Central time.
export const BROKERAGE_TZ = "America/Chicago";

const dayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: BROKERAGE_TZ });

// UTC instant of local midnight for a YYYY-MM-DD date in the brokerage
// timezone. Chicago is only ever UTC-5 or UTC-6: guess CST, then correct.
function localMidnightUtc(dateStr: string): Date {
  const guess = new Date(`${dateStr}T00:00:00-06:00`);
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: BROKERAGE_TZ,
      hour: "numeric",
      hourCycle: "h23",
    }).format(guess),
  );
  if (hour === 1) return new Date(guess.getTime() - 3_600_000);
  if (hour === 23) return new Date(guess.getTime() + 3_600_000);
  return guess;
}

export function todayBounds(now = new Date()): { start: Date; end: Date } {
  const today = dayFmt.format(now);
  const start = localMidnightUtc(today);
  const nextDay = dayFmt.format(new Date(start.getTime() + 26 * 3_600_000));
  return { start, end: localMidnightUtc(nextDay) };
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: BROKERAGE_TZ,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatDayDate(now = new Date()): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: BROKERAGE_TZ,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(now);
}

export function daysAgo(iso: string, now = new Date()): number {
  return Math.floor(
    (now.getTime() - new Date(iso).getTime()) / (24 * 3_600_000),
  );
}

// "3 days ago", "today", "18 days ago" — for last-contact lines.
export function relativeDays(iso: string, now = new Date()): string {
  const d = daysAgo(iso, now);
  if (d <= 0) return "today";
  if (d === 1) return "yesterday";
  return `${d} days ago`;
}

// Compact overdue label: "2d overdue", "3h overdue".
export function overdueLabel(iso: string, now = new Date()): string {
  const ms = now.getTime() - new Date(iso).getTime();
  if (ms <= 0) return "";
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) return "overdue";
  if (hours < 24) return `${hours}h overdue`;
  return `${Math.floor(hours / 24)}d overdue`;
}
