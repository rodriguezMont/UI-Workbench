import { locale, messages } from "@/messages";

import { daysInMonth, parseIsoDate, toIsoDate, type Ymd } from "./iso-date";

/**
 * Dates as reports and charts write them — the axis label, the reading of a
 * point, the month of a column — and the reporting periods with their
 * comparison window.
 *
 * **No time zone, on purpose.** A reporting day is a calendar day, not an
 * instant: `new Date("2026-09-17")` is midnight UTC, which is the day before
 * anywhere west of Greenwich. So nothing here hands text to the `Date`
 * constructor; dates are built with `Date.UTC` and formatted in UTC.
 *
 * Month names and the order of day, month and year come from `Intl` with the
 * interface's `locale`; the words that join two dates into a range live in the
 * messages, like every other string on screen.
 */

const ISO_MONTH = /^(\d{4})-(\d{2})$/;

function utc({ y, m, d }: Ymd): Date {
  return new Date(Date.UTC(y, m - 1, d));
}

const format = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" });

const axisFormat = format({ month: "short", day: "numeric" });
const dayFormat = format({ month: "long", day: "numeric" });
const dayYearFormat = format({ month: "long", day: "numeric", year: "numeric" });
const monthShortFormat = format({ month: "short" });
const monthLongFormat = format({ month: "long" });
const monthYearFormat = format({ month: "long", year: "numeric" });

/**
 * A date on a chart axis: "Sep 12". Short, because it shares the width with
 * its neighbors.
 */
export function isoToAxisLabel(iso: string): string {
  const ymd = parseIsoDate(iso);
  return ymd ? axisFormat.format(utc(ymd)) : "";
}

/** The date in full, for the reading of a point: "September 12". */
export function isoToLongLabel(iso: string): string {
  const ymd = parseIsoDate(iso);
  return ymd ? dayFormat.format(utc(ymd)) : "";
}

/**
 * The month of a monthly chart, from `YYYY-MM`: short on the axis ("Sep"), in
 * full on the reading ("September 2026"). The year only goes in the long form
 * — twelve "Sep" labels from different years do not fit an axis, and the
 * reading tells them apart.
 */
export function monthLabels(yearMonth: string): { short: string; long: string } {
  const r = ISO_MONTH.exec(yearMonth);
  const month = r ? Number(r[2]) : 0;
  if (!r || month < 1 || month > 12) return { short: "", long: "" };
  const date = utc({ y: Number(r[1]), m: month, d: 1 });
  return { short: monthShortFormat.format(date), long: monthYearFormat.format(date) };
}

// ── Reporting periods ──────────────────────────────────────────────────────

/** The three reporting periods: two windows of days and the year. */
export type ReportPeriod = "7d" | "30d" | "12m";

/** A closed range of days, in `YYYY-MM-DD`, both ends included. */
export type DateRange = { from: string; to: string };

// Days are added in UTC: this is calendar math, and no daylight-saving change
// may turn "one day earlier" into "the same day".
function shiftDays({ y, m, d }: Ymd, n: number): Ymd {
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

/** Month `m` (which may fall outside 1–12) normalized, with its year. */
function monthOf(y: number, m: number): { y: number; m: number } {
  const i = y * 12 + (m - 1);
  return { y: Math.floor(i / 12), m: (i % 12) + 1 };
}

/**
 * The period a report shows, and the previous one of the same length that
 * every change is compared against.
 *
 * **Closed days only.** Today is still happening: included, the last point of
 * every series would be a drop that did not happen. So "7 days" ends
 * yesterday, and "12 months" ends last month — with `today` on 10/01/2026, the
 * 30 days are September 1 to 30, and the 12 months run from October 2025 to
 * September 2026.
 *
 * `today` is the calendar date of whoever the report is for, in `YYYY-MM-DD`;
 * an invalid one returns `null`.
 */
export function reportRanges(period: ReportPeriod, today: string): { current: DateRange; previous: DateRange } | null {
  const now = parseIsoDate(today);
  if (!now) return null;

  if (period === "12m") {
    const end = monthOf(now.y, now.m - 1);
    const start = monthOf(end.y, end.m - 11);
    const range = (yearsBack: number): DateRange => ({
      from: toIsoDate({ y: start.y - yearsBack, m: start.m, d: 1 }),
      to: toIsoDate({ y: end.y - yearsBack, m: end.m, d: daysInMonth(end.y - yearsBack, end.m) }),
    });
    return { current: range(0), previous: range(1) };
  }

  const n = period === "7d" ? 7 : 30;
  const end = shiftDays(now, -1);
  const start = shiftDays(end, -(n - 1));
  const previousEnd = shiftDays(start, -1);
  return {
    current: { from: toIsoDate(start), to: toIsoDate(end) },
    previous: { from: toIsoDate(shiftDays(previousEnd, -(n - 1))), to: toIsoDate(previousEnd) },
  };
}

/**
 * The range as the screen writes it, **with the fewest words that leave no
 * doubt**: "September 24–30", "August 2 – September 1", and the year only when
 * it is not the one of `today` — "December 27, 2025 – January 2, 2026". With
 * `months`, the range is of whole months and always carries the year:
 * "October 2025 – September 2026".
 */
export function rangeLabel(range: DateRange, today: string, months = false): string {
  const a = parseIsoDate(range.from);
  const b = parseIsoDate(range.to);
  const now = parseIsoDate(today);
  if (!a || !b || !now) return "";
  const t = messages.ui.period;

  if (months) return t.range(monthYearFormat.format(utc(a)), monthYearFormat.format(utc(b)));
  if (a.y !== b.y) return t.range(dayYearFormat.format(utc(a)), dayYearFormat.format(utc(b)));

  const days =
    a.m === b.m
      ? t.sameMonth(monthLongFormat.format(utc(b)), a.d, b.d)
      : t.range(dayFormat.format(utc(a)), dayFormat.format(utc(b)));
  return b.y === now.y ? days : t.withYear(days, b.y);
}
