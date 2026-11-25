import { ChartLegend, ChartNumbers, ChartReading, useChartReading } from "@/components/chart/parts";
import {
  CHART_COLORS,
  PLOT_H,
  PLOT_W,
  areaPath,
  linePath,
  nearestIndex,
  plotPoints,
  readingText,
  tickIndices,
  yTicks,
  type ChartSeriesSet,
  type ChartUnit,
} from "@/lib/chart";
import { cn } from "@/lib/cn";
import { formatInteger } from "@/lib/format";
import { isoToAxisLabel, isoToLongLabel } from "@/lib/report-period";
import { messages } from "@/messages";

const m = messages.ui.chart;

/**
 * The time series — **a line, or an area when there is only one**. Visitors
 * per day, signups per day.
 *
 * ## SVG that stretches, text that does not
 *
 * The line and the area are SVG in a 1000 × 100 box that stretches to the real
 * width; the axis text, the end dot and the reading are HTML positioned in
 * percentages of the same box. The chart renders without measuring any width,
 * and the letters never distort with the stretch.
 *
 * ## One or two series, and the type refuses a third
 *
 * Series 1 and series 2 each have a chart role. A third gets no color: it
 * becomes another chart. With two, the legend appears — color alone is never
 * the identity —; with one, the title already says what it is. **An area only
 * with one series**: two overlapping areas hide each other.
 *
 * ## The axis starts at zero
 *
 * These are counts. An axis starting at 27 would turn 31 to 52 into a
 * tenfold leap — the shape would lie about the size. The steps are clean
 * (0, 20, 40, 60), never 0, 13, 26, 39.
 *
 * ## The reading is never the only way in
 *
 * The pointer reads the nearest day — people aim at a date, not at a 2px line
 * — with the day in full and the value before the name. **With the arrow keys,
 * the same**, announced to listeners. And every value is also under "See the
 * numbers", the table: the chart is for the shape, the table for reading the
 * number. Legend, reading, keyboard and numbers are the shared parts in
 * `components/chart`.
 */

// Two line ends closer than this (in % of the height) would put their labels
// on top of each other: then the legend and the reading tell the values.
const COLLISION = 12;

export function TimeSeries({
  title,
  dates,
  series,
  unit,
  area = false,
  className,
}: {
  /** The chart's title — also the name of its table. */
  title: string;
  /** ISO dates, one per point. */
  dates: readonly string[];
  /** One or two. A third does not fit the type. */
  series: ChartSeriesSet;
  /** How a value reads: `{ one: "visitor", other: "visitors" }`. */
  unit: ChartUnit;
  /** Fills under the line. Only with one series. */
  area?: boolean;
  className?: string;
}) {
  const n = dates.length;
  const { active, handlers } = useChartReading(n, (f) => nearestIndex(f, n));

  const highest = Math.max(0, ...series.flatMap((s) => s.values));
  const { top, ticks } = yTicks(highest);
  const lines = series.map((s) => plotPoints(s.values, top));
  const xPct = (i: number) => (n <= 1 ? 50 : (i / (n - 1)) * 100);
  const yPct = (y: number) => (y / PLOT_H) * 100;
  const two = series.length === 2;
  const reading = active === null ? "" : readingText(isoToLongLabel(dates[active]!), series, active, unit);

  // The ends: the value written at the end of each line. With two series very
  // close, the labels would collide — then they go, and the legend and the
  // reading say it.
  const ends = lines.map((pts) => yPct(pts[pts.length - 1]?.y ?? PLOT_H));
  const labelEnds = !two || Math.abs(ends[0]! - ends[1]!) >= COLLISION;

  return (
    <figure className={cn("w-full", className)}>
      <figcaption className="text-sm font-medium text-primary">{title}</figcaption>
      <ChartLegend series={series} mark="line" />

      <div className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-2">
        {/* The vertical axis: only the clean steps, in the quietest tone. */}
        <div aria-hidden className="relative h-48 w-9 sm:h-60">
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute right-0 -translate-y-1/2 text-xs tabular-nums text-subtle"
              style={{ top: `${(1 - t / top) * 100}%` }}
            >
              {formatInteger(t)}
            </span>
          ))}
        </div>

        {/* The right padding is where the value at the end of the line lives. */}
        <div className="pr-10">
          <div
            {...handlers}
            role="group"
            aria-roledescription={m.roleDescription}
            aria-label={m.readByDay(title)}
            className="relative h-48 touch-pan-y rounded-sm sm:h-60"
          >
            <svg
              aria-hidden
              viewBox={`0 0 ${PLOT_W} ${PLOT_H}`}
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full overflow-visible"
            >
              {ticks.map((t) => {
                const y = PLOT_H - (t / top) * PLOT_H;
                return (
                  <line
                    key={t}
                    x1={0}
                    x2={PLOT_W}
                    y1={y}
                    y2={y}
                    stroke="var(--border)"
                    strokeWidth={1}
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
              {area && !two ? <path d={areaPath(lines[0]!)} fill={CHART_COLORS[0]} fillOpacity={0.1} /> : null}
              {lines.map((pts, k) => (
                <path
                  key={series[k]!.label}
                  d={linePath(pts)}
                  fill="none"
                  stroke={CHART_COLORS[k]}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>

            {/* The line that finds the date. */}
            {active !== null ? (
              <span aria-hidden className="absolute inset-y-0 w-px bg-border-strong" style={{ left: `${xPct(active)}%` }} />
            ) : null}

            {/* The dots: the end one always, the reading's when there is one.
                HTML, so they stay round in a box that stretches. A ring in the
                surface color separates them from the line they cross. */}
            {lines.map((pts, k) =>
              // No repeats: reading the last day, the reading's dot is the end one.
              [...new Set([pts.length - 1, active])]
                .filter((i): i is number => i !== null && i >= 0)
                .map((i) => (
                  <span
                    key={`${k}-${i}`}
                    aria-hidden
                    className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-[var(--surface)]"
                    style={{ left: `${xPct(i)}%`, top: `${yPct(pts[i]!.y)}%`, background: CHART_COLORS[k] }}
                  />
                )),
            )}

            {labelEnds
              ? series.map((s, k) => (
                  <span
                    key={s.label}
                    aria-hidden
                    className="absolute left-full ml-2 -translate-y-1/2 whitespace-nowrap text-xs font-medium tabular-nums text-primary"
                    style={{ top: `${ends[k]}%` }}
                  >
                    {formatInteger(s.values[s.values.length - 1] ?? 0)}
                  </span>
                ))
              : null}

            {active !== null ? (
              <ChartReading
                heading={isoToLongLabel(dates[active]!)}
                series={series}
                index={active}
                unit={unit}
                leftPct={xPct(active)}
              />
            ) : null}
          </div>

          {/* The date axis: the first label hugs the left, the last the right,
              the middle ones center on their day. Two layers, and CSS picks:
              three labels fit on phones, six from `sm` — six overlapped at
              375. No width is measured, so the server sends the right HTML. */}
          <div aria-hidden className="relative mt-1.5 h-4">
            {[
              { max: 3, where: "sm:hidden" },
              { max: 6, where: "max-sm:hidden" },
            ].flatMap(({ max, where }) =>
              tickIndices(n, max).map((i, k, all) => (
                <span
                  key={`${max}-${i}`}
                  className={cn("absolute whitespace-nowrap text-xs text-subtle", where)}
                  style={{
                    left: `${xPct(i)}%`,
                    transform: k === 0 ? "none" : k === all.length - 1 ? "translateX(-100%)" : "translateX(-50%)",
                  }}
                >
                  {isoToAxisLabel(dates[i]!)}
                </span>
              )),
            )}
          </div>
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {reading}
      </p>

      <ChartNumbers title={title} categoryHeader={m.dateHeader} categories={dates.map(isoToLongLabel)} series={series} />
    </figure>
  );
}
