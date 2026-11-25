import { messages } from "@/messages";

import { formatInteger, formatWholePercent } from "./format";

/**
 * The math behind the charts, **as pure, tested functions**. The charts are
 * hand-drawn SVG and HTML, with no charting library: the hard part a library
 * would do — scales and paths — lives here, under test, so the components only
 * draw.
 */

const m = messages.ui.chart;

/**
 * How a number moved against the previous period.
 *
 * - `none`: there is no base — the previous period is missing or zero. Going
 *   from zero to 40 is not "infinite percent": it is a start, and the screen
 *   has to say so in words.
 * - `flat`: it moved less than half a percent. "0.2% higher" about a number
 *   that wobbles is noise dressed as news.
 */
export type Delta = { kind: "up" | "down"; ratio: number } | { kind: "flat" } | { kind: "none" };

export function deltaOf(current: number, previous: number | null | undefined): Delta {
  if (previous === null || previous === undefined || previous === 0) return { kind: "none" };
  const ratio = (current - previous) / Math.abs(previous);
  if (Math.abs(ratio) < 0.005) return { kind: "flat" };
  return { kind: ratio > 0 ? "up" : "down", ratio: Math.abs(ratio) };
}

/**
 * The points of a sparkline, as `<polyline points>`, inside a `width × height`
 * box. The vertical axis runs from the series' own minimum to its maximum: a
 * sparkline shows shape, not size — the size is the number written next to it.
 *
 * A constant series is a straight line in the middle, not on the floor: on the
 * floor it would say "zero". Fewer than two points is not a line, and returns
 * an empty string.
 */
export function sparkPoints(values: readonly number[], width: number, height: number, pad = 2): string {
  if (values.length < 2) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const usable = height - pad * 2;
  const step = width / (values.length - 1);
  return values
    .map((v, i) => {
      const x = i * step;
      const y = max === min ? height / 2 : pad + usable - ((v - min) / (max - min)) * usable;
      return `${round(x)},${round(y)}`;
    })
    .join(" ");
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}

// ── Series over time ───────────────────────────────────────────────────────

/**
 * The plot box in our own units: 1000 wide, 100 tall. The SVG stretches to the
 * real width (`preserveAspectRatio="none"`), and whatever needs true
 * proportions — text, the end dot — is HTML positioned in percentages of the
 * same box. The chart renders without measuring any width, on the server too.
 */
export const PLOT_W = 1000;
export const PLOT_H = 100;

/**
 * The vertical axis: it starts at zero — these are counts, and a bar or an
 * area that does not start at zero lies about size — and climbs in clean
 * steps (1, 2, 2.5 or 5 times a power of ten). 52 gives 0, 20, 40, 60; never
 * 0, 13, 26, 39, 52.
 *
 * **Among the clean steps, the one with the lowest top** that still gives 3 to
 * 5 intervals: 104 goes to 125, not 150, which would leave a third of the
 * chart empty above the data. A tie on the top goes to fewer intervals — less
 * ink. A count never gets a fractional step; when no whole step gives three
 * intervals (a maximum of 2, say), the step is 1.
 */
export function yTicks(max: number): { top: number; ticks: number[] } {
  if (!(max > 0)) return { top: 1, ticks: [0, 1] };
  const magnitude = 10 ** Math.floor(Math.log10(max));
  const candidates = [magnitude / 10, magnitude, magnitude * 10]
    .flatMap((g) => [1, 2, 2.5, 5].map((f) => f * g))
    .filter((s) => s >= 1 && Number.isInteger(s));
  let best: { step: number; top: number } | null = null;
  for (const step of candidates) {
    const top = Math.ceil(max / step) * step;
    const intervals = top / step;
    if (intervals < 3 || intervals > 5) continue;
    if (!best || top < best.top || (top === best.top && step > best.step)) best = { step, top };
  }
  const step = best?.step ?? 1;
  const top = best?.top ?? Math.ceil(max);
  const ticks: number[] = [];
  for (let t = 0; t <= top + step / 2; t += step) ticks.push(t);
  return { top, ticks };
}

export type PlotPoint = { x: number; y: number };

/** Each value in the 1000 × 100 box. A single point sits in the middle of the width. */
export function plotPoints(values: readonly number[], top: number): PlotPoint[] {
  const n = values.length;
  return values.map((v, i) => ({
    x: n === 1 ? PLOT_W / 2 : (i / (n - 1)) * PLOT_W,
    y: PLOT_H - (Math.max(0, v) / top) * PLOT_H,
  }));
}

export function linePath(points: readonly PlotPoint[]): string {
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${round(p.x)} ${round(p.y)}`).join(" ");
}

/** The line closed down to the floor — the area is the same drawing, filled. */
export function areaPath(points: readonly PlotPoint[]): string {
  if (points.length === 0) return "";
  const first = points[0]!;
  const last = points[points.length - 1]!;
  return `${linePath(points)} L${round(last.x)} ${PLOT_H} L${round(first.x)} ${PLOT_H} Z`;
}

/**
 * Which point the pointer is reading. People aim at a date, never at a 2px
 * line: `fraction` is the horizontal position from 0 to 1, and the point is
 * the nearest one.
 */
export function nearestIndex(fraction: number, n: number): number {
  if (n <= 1) return 0;
  return Math.min(n - 1, Math.max(0, Math.round(fraction * (n - 1))));
}

/**
 * Which dates get a label on the axis: the first, the last, and at most `max`
 * in all, at an even step. The one before the last drops out when it would sit
 * against the last — two overlapping labels say neither.
 */
export function tickIndices(n: number, max = 6): number[] {
  if (n <= 0) return [];
  if (n <= max) return Array.from({ length: n }, (_, i) => i);
  const step = Math.ceil((n - 1) / (max - 1));
  const indices: number[] = [];
  for (let i = 0; i < n - 1; i += step) indices.push(i);
  if (n - 1 - indices[indices.length - 1]! < step / 2) indices.pop();
  indices.push(n - 1);
  return indices;
}

// ── Shared by every chart ──────────────────────────────────────────────────

/** A series: its name and one value per category (day, month, channel). */
export type ChartSeries = { label: string; values: readonly number[] };

/** One or two — a third does not fit the type: it becomes another chart. */
export type ChartSeriesSet = readonly [ChartSeries] | readonly [ChartSeries, ChartSeries];

/** How a value reads: `{ one: "visitor", other: "visitors" }`. */
export type ChartUnit = { one: string; other: string };

/**
 * The color follows the series, never its position on screen: the first is
 * always series 1, the second always series 2. A filter that removes the first
 * does not repaint the second in the first one's color.
 */
export const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)"] as const;

/** Series 1 receded, for the bars that step back behind a highlight. */
export const CHART_SOFT = "var(--chart-1-soft)";

/** The unit's word for a value: "visitor" for 1, "visitors" otherwise. */
export function unitWord(value: number, unit: ChartUnit): string {
  return value === 1 ? unit.one : unit.other;
}

/** "45 visitors" · "1 visitor" · "1,206 visitors". */
export function formatWithUnit(value: number, unit: ChartUnit): string {
  return `${formatInteger(value)} ${unitWord(value, unit)}`;
}

/**
 * What a listener hears when a point is read: "September 16: 45 visitors",
 * and with two series, "…: 52 visitors (North); 38 visitors (South)". The same
 * text feeds the reading on screen, so the screen and the screen reader never
 * disagree.
 */
export function readingText(when: string, series: ChartSeriesSet, i: number, unit: ChartUnit): string {
  const two = series.length === 2;
  const parts = series.map((s) => {
    const value = formatWithUnit(s.values[i] ?? 0, unit);
    return two ? m.seriesValue(value, s.label) : value;
  });
  return m.reading(when, parts.join("; "));
}

/**
 * In columns, the pointer reads the band it is in — the whole column is the
 * target, not the painted pixels of the bar. `fraction` runs from 0 to 1.
 */
export function bandIndex(fraction: number, n: number): number {
  if (n <= 1) return 0;
  return Math.min(n - 1, Math.max(0, Math.floor(fraction * n)));
}

// ── Comparison ─────────────────────────────────────────────────────────────

export type ChartItem = { label: string; value: number };

/**
 * The comparison's order: **largest first**, because that is what the eye
 * wants to know — who leads, and by how much. A tie keeps the caller's order
 * (the sort is stable), so items never swap places between renders.
 */
export function sortedDesc(items: readonly ChartItem[]): ChartItem[] {
  return items
    .map((item, i) => ({ item, i }))
    .sort((a, b) => b.item.value - a.item.value || a.i - b.i)
    .map(({ item }) => item);
}

// ── Ranking ────────────────────────────────────────────────────────────────

/**
 * One ranking row. `position` is `null` on the row that folds the tail
 * (`folded` counts how many it holds). `share` is the whole percentage
 * written on screen; `ratio`, the exact fraction the bar draws.
 */
export type RankingRow = {
  label: string;
  value: number;
  position: number | null;
  folded: number;
  ratio: number;
  share: number;
};

/**
 * The ranking: **largest first, and how much each one weighs in the whole**.
 *
 * - **A tie shares the position**: 14, 9, 9, 2 are 1, 2, 2 and 4 — the third
 *   did not lose to the second, it only came later in the list.
 * - **The tail folds** past `limit`: the first ones stay, the rest become a
 *   single row with no position, at the end. Folding a single item saves no
 *   row, so it shows in full.
 * - **Each percentage is the nearest to its own value**, rounded alone.
 *   Forcing the sum to 100 (largest remainder) would give two different
 *   percentages to a tie, and the same value would round one way in one view
 *   and the other way in another. The sum may be 99 or 101; a wrong number on
 *   a row is worse.
 */
export function rankingRows(items: readonly ChartItem[], limit?: number): RankingRow[] {
  const sorted = sortedDesc(items);
  const total = sorted.reduce((a, i) => a + i.value, 0);

  let position = 0;
  const rows: Omit<RankingRow, "share">[] = sorted.map((item, i) => {
    if (i === 0 || item.value !== sorted[i - 1]!.value) position = i + 1;
    return { ...item, position, folded: 0, ratio: total > 0 ? item.value / total : 0 };
  });

  const fold = limit !== undefined && rows.length > limit + 1;
  const visible = fold ? rows.slice(0, limit) : rows;
  if (fold) {
    const tail = rows.slice(limit);
    const value = tail.reduce((a, r) => a + r.value, 0);
    visible.push({ label: "", value, position: null, folded: tail.length, ratio: total > 0 ? value / total : 0 });
  }

  return visible.map((r) => ({ ...r, share: Math.round(r.ratio * 100) }));
}

/**
 * "60%" — and "< 1%" for a row that has a value but rounds to zero: "0%" next
 * to 3 signups would say nothing arrived.
 */
export function shareLabel(row: Pick<RankingRow, "share" | "value">): string {
  return row.share === 0 && row.value > 0 ? m.belowOnePercent : formatWholePercent(row.share / 100);
}

// ── Meter ──────────────────────────────────────────────────────────────────

/**
 * What the meter's reference is: a **goal**, something to reach, or a
 * **limit**, something a plan allows. Only the phrase changes — the color
 * stays, because a state color is never a series: someone near the limit
 * reads "2 left", not a red bar.
 */
export type MeterKind = "goal" | "limit";

export type MeterReading = {
  /** How much of the track the bar fills, from 0 to 1. */
  fill: number;
  /** Where the reference sits on the track once the value has passed it; otherwise `null`. */
  mark: number | null;
  /** "80%" · "99%" · "< 1%" · "110%". */
  percent: string;
  /** "24 short of the goal" · "goal reached" · "2 left" · "at the limit". */
  remark: string;
};

/**
 * A value against a reference.
 *
 * - **The track is the reference** while the value is below it. Once past it,
 *   the track becomes the value, the bar fills, and the reference turns into
 *   a mark where it sits — 132 against 120 puts the mark at 91%. Cutting the
 *   bar at the reference would hide how far past it went.
 * - **Never 100% before getting there**: 239 of 240 is 99%, not 100% — people
 *   would read "done". For the same reason, a value that rounds to zero is
 *   "< 1%", as in the ranking.
 * - **Without a positive reference there is no meter**, and it returns
 *   `null`: either the screen states a fact, or it says nothing.
 */
export function meterReading(value: number, target: number, kind: MeterKind = "goal"): MeterReading | null {
  if (!(target > 0)) return null;
  const v = Math.max(0, value);
  const rounded = Math.round((v / target) * 100);
  const whole = v < target ? Math.min(99, rounded) : rounded;
  const percent = v > 0 && rounded === 0 ? m.belowOnePercent : formatWholePercent(whole / 100);

  const gap = formatInteger(Math.abs(target - v));
  const remark =
    v < target
      ? kind === "goal"
        ? m.remark.goalShort(gap)
        : m.remark.limitLeft(gap)
      : v === target
        ? kind === "goal"
          ? m.remark.goalMet
          : m.remark.limitAt
        : kind === "goal"
          ? m.remark.goalAbove(gap)
          : m.remark.limitOver(gap);

  return { fill: v < target ? v / target : 1, mark: v > target ? target / v : null, percent, remark };
}

/** "96 of 120 signups" — the value against its reference, in the reference's unit. */
export function meterOfTarget(value: number, target: number, unit: ChartUnit): string {
  return m.ofTarget(formatInteger(Math.max(0, value)), formatWithUnit(target, unit));
}

/**
 * What a listener hears from a meter, as a bar or as an arc: "96 of 120
 * signups, 80%; 24 short of the goal". One text, so the two shapes never say
 * the same number in different ways.
 */
export function meterValueText(value: number, target: number, unit: ChartUnit, reading: MeterReading): string {
  return m.meterText(meterOfTarget(value, target, unit), reading.percent, reading.remark);
}

// ── Arc ────────────────────────────────────────────────────────────────────

/**
 * The point `fraction` (0 to 1) along a half-turn arc — from the left, over the
 * top, to the right — in SVG coordinates (y grows downward).
 */
export function gaugePoint(fraction: number, cx: number, cy: number, r: number): PlotPoint {
  const angle = Math.PI - Math.min(1, Math.max(0, fraction)) * Math.PI;
  return { x: round(cx + r * Math.cos(angle)), y: round(cy - r * Math.sin(angle)) };
}

/**
 * The path of the arc covering `fraction` of the half turn. Center at
 * `(cx, cy)`, radius `r`. Zero is no arc, and returns an empty string.
 */
export function gaugeArc(fraction: number, cx: number, cy: number, r: number): string {
  if (!(fraction > 0)) return "";
  const a = gaugePoint(0, cx, cy, r);
  const b = gaugePoint(fraction, cx, cy, r);
  return `M${a.x} ${a.y} A${r} ${r} 0 0 1 ${b.x} ${b.y}`;
}
