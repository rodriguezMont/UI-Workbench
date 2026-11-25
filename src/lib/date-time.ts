import { locale, messages } from "@/messages";

import { dayExists, pad, parseIsoDate, toIsoDate } from "./iso-date";

/**
 * Dates and times for the form pickers — what is typed, what is shown and
 * what is submitted (en-US).
 *
 * **Three formats, each with one job:**
 * - **on screen**, `MM/DD/YYYY` and a 12-hour time ("2:30 PM") — how the US
 *   writes them;
 * - **in the submission**, `yyyy-mm-dd`, `HH:mm` and `yyyy-mm-ddTHH:mm` — the
 *   formats of `<input type="date">`, `"time"` and `"datetime-local"`, which a
 *   server reads without guessing the order of month and day;
 * - **in the calendar**, a local `Date` at midnight.
 *
 * **No time zones, on purpose.** Opening hours or a meeting slot are wall-clock
 * time: 9:00 AM is 9:00 AM wherever the reader is, not an instant.
 * `new Date("2026-09-17")` would be midnight UTC — the previous day anywhere
 * west of Greenwich — so nothing here ever hands text to the `Date`
 * constructor.
 *
 * Pure functions: the three pickers read from here, and so do the tests.
 */

/** The first and last accepted dates, both `yyyy-mm-dd` and both inclusive. */
export type DateBounds = { min?: string; max?: string };

const m = messages.ui.datePicker;

const DISPLAY_DATE = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** `09/17/2026` → `2026-09-17`. Incomplete or nonexistent → `null`. */
export function displayToIso(text: string): string | null {
  const r = DISPLAY_DATE.exec(text);
  if (!r) return null;
  const ymd = { y: Number(r[3]), m: Number(r[1]), d: Number(r[2]) };
  return dayExists(ymd) ? toIsoDate(ymd) : null;
}

/** `2026-09-17` → `09/17/2026`. Invalid → empty text. */
export function isoToDisplay(iso: string): string {
  const ymd = parseIsoDate(iso);
  return ymd ? `${pad(ymd.m)}/${pad(ymd.d)}/${pad(ymd.y, 4)}` : "";
}

/** The local `Date`, at midnight, that the calendar works with. */
export function isoToDate(iso: string): Date | undefined {
  const ymd = parseIsoDate(iso);
  return ymd ? new Date(ymd.y, ymd.m - 1, ymd.d) : undefined;
}

/** The calendar's `Date` back to `yyyy-mm-dd`, by its local day. */
export function dateToIso(date: Date): string {
  return toIsoDate({ y: date.getFullYear(), m: date.getMonth() + 1, d: date.getDate() });
}

/**
 * The error sentence for a typed date, or `null`. Empty is not an error here —
 * whether the field is required is the form's call.
 *
 * `min` and `max` are `yyyy-mm-dd`: the format sorts as text, so comparing
 * strings is enough.
 */
export function checkDate(text: string, { min, max }: DateBounds = {}): string | null {
  if (text === "") return null;
  if (!DISPLAY_DATE.test(text)) return m.incomplete;
  const iso = displayToIso(text);
  if (!iso) return m.doesNotExist(text);
  if (min && iso < min) return m.tooEarly(isoToDisplay(min));
  if (max && iso > max) return m.tooLate(isoToDisplay(max));
  return null;
}

function minutes(hhmm: string): number | null {
  const r = HHMM.exec(hhmm);
  return r ? Number(r[1]) * 60 + Number(r[2]) : null;
}

/**
 * The times on offer, every `step` minutes from `min` to `max`, both ends
 * included. The step is what makes the list pickable: one per minute would be
 * 1,440 options.
 *
 * A bad range or step is the caller's bug, so it throws instead of returning
 * an empty list that would look like "no times available".
 */
export function timeSlots({ step = 30, min = "00:00", max = "23:59" }: { step?: number; min?: string; max?: string } = {}): string[] {
  const start = minutes(min);
  const end = minutes(max);
  if (start === null || end === null || step <= 0 || !Number.isInteger(step)) {
    throw new Error(`Invalid time range: ${min}–${max} every ${step} min.`);
  }
  const out: string[] = [];
  for (let t = start; t <= end; t += step) {
    out.push(`${pad(Math.floor(t / 60))}:${pad(t % 60)}`);
  }
  return out;
}

// Formatted in UTC from a UTC instant: the wall-clock time goes in and comes
// out unchanged, whatever the reader's zone or daylight saving.
const clock = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC" });

/** `14:30` → `2:30 PM`, as the screen writes it. Invalid → empty text. */
export function formatTime(hhmm: string): string {
  const total = minutes(hhmm);
  return total === null ? "" : clock.format(new Date(Date.UTC(1970, 0, 1, 0, total)));
}

/** Date and time together in the submitted format; one missing, no value. */
export function joinDateTime(date: string, time: string): string {
  return parseIsoDate(date) && HHMM.test(time) ? `${date}T${time}` : "";
}

/** The reverse: `2026-09-17T14:30` → both parts, each dropped if invalid. */
export function splitDateTime(value: string): { date: string; time: string } {
  const [date = "", time = ""] = value.split("T");
  return {
    date: parseIsoDate(date) ? date : "",
    time: HHMM.test(time) ? time : "",
  };
}

const monthName = new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" });

/** The twelve month names in the interface's language, January first. */
export const MONTH_NAMES: readonly string[] = Array.from({ length: 12 }, (_, i) => monthName.format(new Date(Date.UTC(2000, i, 1))));

/** The page of twelve years that holds the year: 2026 is on 2016–2027. */
export function yearPageStart(year: number): number {
  return Math.floor(year / 12) * 12;
}

/** Does any day of the month (`month` from 0 to 11) fall inside the bounds? */
export function monthAllowed(year: number, month: number, { min, max }: DateBounds = {}): boolean {
  const ym = `${pad(year, 4)}-${pad(month + 1)}`;
  return (!min || ym >= min.slice(0, 7)) && (!max || ym <= max.slice(0, 7));
}

/** Does any day of the year fall inside the bounds? */
export function yearAllowed(year: number, { min, max }: DateBounds = {}): boolean {
  return (!min || year >= Number(min.slice(0, 4))) && (!max || year <= Number(max.slice(0, 4)));
}
