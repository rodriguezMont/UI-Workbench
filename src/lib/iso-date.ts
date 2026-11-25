/**
 * Calendar dates as `yyyy-mm-dd` text and as plain year, month and day — the
 * one parser both the form pickers (`date-time.ts`) and the reports
 * (`report-period.ts`) read dates with.
 *
 * **No `Date` here, on purpose.** A calendar day is not an instant, and
 * `new Date("2026-09-17")` is midnight UTC — the day before anywhere west of
 * Greenwich. Each caller turns a `Ymd` into the `Date` it needs: local
 * midnight for the calendar, UTC for the reports.
 */

/** A calendar day; `m` and `d` start at 1. */
export type Ymd = { y: number; m: number; d: number };

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** `7` → `"07"`; `size` 4 for years. */
export function pad(n: number, size = 2): string {
  return String(n).padStart(size, "0");
}

/** Days in month `m` of year `y`: 28 to 31, leap years included. */
export function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Does the day exist? February 31 never does; February 29 only in a leap year. */
export function dayExists({ y, m, d }: Ymd): boolean {
  if (y < 1 || m < 1 || m > 12 || d < 1) return false;
  return d <= daysInMonth(y, m);
}

/** `2026-09-17` → `{ y: 2026, m: 9, d: 17 }`. Malformed or nonexistent → `null`. */
export function parseIsoDate(iso: string): Ymd | null {
  const r = ISO_DATE.exec(iso);
  if (!r) return null;
  const ymd = { y: Number(r[1]), m: Number(r[2]), d: Number(r[3]) };
  return dayExists(ymd) ? ymd : null;
}

/** `{ y: 2026, m: 9, d: 17 }` → `2026-09-17`. */
export function toIsoDate({ y, m, d }: Ymd): string {
  return `${pad(y, 4)}-${pad(m)}-${pad(d)}`;
}
