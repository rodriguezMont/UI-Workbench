import { monthLabels, reportRanges, type DateRange } from "@/lib/report-period";

/**
 * The Data section's demo world: a made-up SaaS, in September 2026.
 *
 * **"Today" is pinned to October 1, 2026**, so "the last 30 days" is always
 * September and the page never drifts with the calendar. **The numbers agree
 * across pieces**: the 96 signups on the stat card are the sum of the
 * channels in the comparison and of the regions in the ranking; the 1,206
 * visitors are the sum of the daily series and of the regions in the table.
 * A reviewer who adds them up finds the same totals everywhere.
 */
export const TODAY = "2026-10-01";

const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const utcMs = (iso: string) => Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));

/** Every day of a range, as ISO dates. */
function daysOf({ from, to }: DateRange): string[] {
  const days: string[] = [];
  for (let ms = utcMs(from); ms <= utcMs(to); ms += 86_400_000) days.push(isoDay(ms));
  return days;
}

/** Every month of a range, as `YYYY-MM`. */
function monthsOf({ from, to }: DateRange): string[] {
  const index = (iso: string) => Number(iso.slice(0, 4)) * 12 + Number(iso.slice(5, 7)) - 1;
  const months: string[] = [];
  for (let i = index(from); i <= index(to); i++) months.push(`${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`);
  return months;
}

/** A plausible, repeatable shape: a trend plus two waves. */
function curve(n: number, growth: number, amplitude: number, seed: number): number[] {
  return Array.from({ length: n }, (_, i) => Math.max(1, 100 + growth * i + amplitude * Math.sin(i * 0.9 + seed) + amplitude * 0.5 * Math.sin(i * 2.3 + seed * 2)));
}

/** Scales a shape to whole numbers that add up to exactly `total`. */
function scaleTo(shape: readonly number[], total: number): number[] {
  const sum = shape.reduce((a, v) => a + v, 0);
  const values = shape.map((v) => Math.floor((v / sum) * total));
  let missing = total - values.reduce((a, v) => a + v, 0);
  // The remainder goes to the largest fractions, one each, so no day jumps.
  const order = shape.map((v, i) => ({ i, rest: (v / sum) * total - values[i]! })).sort((a, b) => b.rest - a.rest);
  for (const { i } of order) {
    if (missing-- <= 0) break;
    values[i]! += 1;
  }
  return values;
}

const sum = (values: readonly number[]) => values.reduce((a, v) => a + v, 0);

// ── Time ───────────────────────────────────────────────────────────────────

/** September 1–30, 2026: the last 30 closed days. */
export const DAYS = daysOf(reportRanges("30d", TODAY)!.current);
/** January to September 2026. */
export const MONTHS_THIS_YEAR = monthsOf({ from: "2026-01-01", to: "2026-09-30" }).map(monthLabels);
/** October 2025 to September 2026: the last 12 closed months. */
export const MONTHS_12 = monthsOf(reportRanges("12m", TODAY)!.current).map(monthLabels);

// ── Totals for September, and August to compare ────────────────────────────

export const TOTALS = {
  visitors: { september: 1_206, august: 1_077 },
  signups: { september: 96, august: 104 },
  upgrades: { september: 60, august: 60 },
  demoRequests: { september: 34, august: 0 },
  tickets: { september: 86, august: 104 },
} as const;

// ── Regions: the same four everywhere ──────────────────────────────────────

export const REGION_VISITORS = [540, 312, 251, 103] as const;
export const REGION_SIGNUPS = [58, 23, 14, 1] as const;
export const REGION_DEMO_REQUESTS = [14, 9, 9, 2] as const;
export const REGION_REVENUE = [48_600, 21_250, 16_980, 4_105] as const;

// ── Daily series for September ─────────────────────────────────────────────

export const VISITORS = scaleTo(curve(DAYS.length, 1.2, 14, 1), TOTALS.visitors.september);
export const VISITORS_NORTH = scaleTo(curve(DAYS.length, 1.4, 16, 2), REGION_VISITORS[0]);
export const VISITORS_SOUTH = scaleTo(curve(DAYS.length, 0.6, 18, 4), REGION_VISITORS[1]);
export const SIGNUPS_DAILY = scaleTo(curve(DAYS.length, -0.4, 22, 3), TOTALS.signups.september);
export const UPGRADES_DAILY = scaleTo(curve(DAYS.length, 0.2, 25, 5), TOTALS.upgrades.september);
export const DEMO_DAILY = scaleTo(curve(DAYS.length, 1.8, 30, 6), TOTALS.demoRequests.september);
export const TICKETS_DAILY = scaleTo(curve(DAYS.length, -0.8, 20, 7), TOTALS.tickets.september);

// ── Monthly signups ────────────────────────────────────────────────────────

/** Last 12 months; August and September are the stat card's 104 and 96. */
export const SIGNUPS_12 = [41, 47, 39, 58, 63, 71, 69, 78, 85, 92, TOTALS.signups.august, TOTALS.signups.september];
export const SIGNUPS_THIS_YEAR = SIGNUPS_12.slice(-9);
export const SIGNUPS_PAID = SIGNUPS_THIS_YEAR.map((v) => Math.round(v * 0.4));
export const SIGNUPS_FREE = SIGNUPS_THIS_YEAR.map((v, i) => v - SIGNUPS_PAID[i]!);

// ── Channels and sources ───────────────────────────────────────────────────

/** Signups by channel, in the caller's (not sorted) order; they add up to 96. */
export const CHANNEL_SIGNUPS = [12, 41, 16, 27] as const;
/** Visitors by source, adding up to 1,206. */
export const SOURCE_VISITORS = [494, 290, 229, 116, 41, 24, 12] as const;
/** Visitors by source in the North region alone, adding up to its 540. */
export const NORTH_SOURCE_VISITORS = [230, 141, 98, 69, 2] as const;

// The invariants the copy promises: a wrong edit fails here, at load.
const check = (ok: boolean, what: string) => {
  if (!ok) throw new Error(`Data demo out of step: ${what}`);
};
check(sum(VISITORS) === TOTALS.visitors.september, "daily visitors");
check(sum(REGION_VISITORS) === TOTALS.visitors.september, "visitors by region");
check(sum(SOURCE_VISITORS) === TOTALS.visitors.september, "visitors by source");
check(sum(REGION_SIGNUPS) === TOTALS.signups.september, "signups by region");
check(sum(CHANNEL_SIGNUPS) === TOTALS.signups.september, "signups by channel");
check(sum(REGION_DEMO_REQUESTS) === TOTALS.demoRequests.september, "demo requests by region");
check(sum(NORTH_SOURCE_VISITORS) === REGION_VISITORS[0], "North visitors by source");
check(DAYS[0] === "2026-09-01" && DAYS.at(-1) === "2026-09-30", "September");
