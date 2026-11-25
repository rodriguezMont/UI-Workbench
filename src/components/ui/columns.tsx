import { ChartLegend, ChartNumbers, ChartReading, useChartReading } from "@/components/chart/parts";
import {
  CHART_COLORS,
  bandIndex,
  readingText,
  tickIndices,
  yTicks,
  type ChartSeriesSet,
  type ChartUnit,
} from "@/lib/chart";
import { cn } from "@/lib/cn";
import { formatInteger } from "@/lib/format";
import { messages } from "@/messages";

const m = messages.ui.chart;

/**
 * Columns over time — **one bar per month, or per week**: for what adds up per
 * period, such as signups per month.
 *
 * ## HTML, not SVG — and still hand-drawn
 *
 * A bar is a rectangle, and in HTML it gets what a stretched SVG cannot give
 * without measuring: **a maximum thickness of 24px**, a 4px rounded top and a
 * square base.
 *
 * ## One series: the number on top; two: the axis
 *
 * With one series, each column carries its value written above it, and the
 * axis goes — every value is already said, and an axis repeating what is
 * written is surplus ink. With two, side-by-side values would clash: the axis
 * and its grid come back, and the value lives in the reading. The two bars of
 * one period sit 2px apart — the surface color separates them, never an
 * outline.
 *
 * ## The whole column is the target
 *
 * The pointer reads the band it is in, not the bar's pixels: a column for a
 * weak month is short, and hitting it would be luck. The column being read
 * stays full and the others step back. Arrows, Home and End move column by
 * column, and "See the numbers" has every value — the shared parts in
 * `components/chart`, the same as the time series.
 */
export function Columns({
  title,
  categories,
  series,
  unit,
  categoryHeader = m.monthHeader,
  className,
}: {
  /** The chart's title — also the name of its table. */
  title: string;
  /** Each column: short on the axis ("Sep"), in full on the reading ("September 2026"). */
  categories: readonly { short: string; long: string }[];
  /** One or two. A third does not fit the type. */
  series: ChartSeriesSet;
  unit: ChartUnit;
  /** The name of the table's first column. */
  categoryHeader?: string;
  className?: string;
}) {
  const n = categories.length;
  const { active, handlers } = useChartReading(n, (f) => bandIndex(f, n));

  const two = series.length === 2;
  const highest = Math.max(0, ...series.flatMap((s) => s.values));
  const { top, ticks } = yTicks(highest);
  const center = (i: number) => ((i + 0.5) / n) * 100;
  // On phones only these get a label: the others are invisible but keep their
  // place, so each label stays under its own column.
  const labeled = new Set(tickIndices(n, 6));
  const reading = active === null ? "" : readingText(categories[active]!.long, series, active, unit);

  return (
    <figure className={cn("w-full", className)}>
      <figcaption className="text-sm font-medium text-primary">{title}</figcaption>
      <ChartLegend series={series} mark="bar" />

      <div className={cn("mt-3 grid gap-x-2", two ? "grid-cols-[auto_minmax(0,1fr)]" : "grid-cols-1")}>
        {two ? (
          <div aria-hidden className="relative mt-5 h-43 w-9 sm:h-55">
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
        ) : null}

        <div>
          {/* The top padding belongs to the number written over the tallest column. */}
          <div
            {...handlers}
            role="group"
            aria-roledescription={m.roleDescription}
            aria-label={m.readByColumn(title)}
            className="relative h-48 touch-pan-y rounded-sm pt-5 sm:h-60"
          >
            <div className="absolute inset-x-0 top-5 bottom-0">
              {(two ? ticks : [0]).map((t) => (
                <span
                  key={t}
                  aria-hidden
                  className="absolute inset-x-0 h-px bg-border"
                  style={{ top: `${(1 - t / top) * 100}%` }}
                />
              ))}

              <div aria-hidden className="absolute inset-0 flex">
                {categories.map((c, i) => (
                  <div
                    key={c.long}
                    data-column=""
                    className={cn(
                      "flex min-w-0 flex-1 items-end justify-center gap-0.5 px-1",
                      "transition-opacity duration-[var(--motion-fast)] ease-[var(--motion-ease)]",
                      active !== null && active !== i ? "opacity-40" : "opacity-100",
                    )}
                  >
                    {series.map((s, k) => {
                      const v = s.values[i] ?? 0;
                      return (
                        <div
                          key={s.label}
                          className="relative w-full max-w-6 rounded-t-[4px]"
                          style={{ height: `${(v / top) * 100}%`, background: CHART_COLORS[k] }}
                        >
                          {!two ? (
                            <span className="absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap text-xs font-medium tabular-nums text-primary">
                              {formatInteger(v)}
                            </span>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {active !== null ? (
              <ChartReading
                heading={categories[active]!.long}
                series={series}
                index={active}
                unit={unit}
                leftPct={center(active)}
              />
            ) : null}
          </div>

          <div aria-hidden className="mt-1.5 flex">
            {categories.map((c, i) => (
              <span key={c.long} className={cn("flex-1 text-center text-xs text-subtle", !labeled.has(i) && "max-sm:invisible")}>
                {c.short}
              </span>
            ))}
          </div>
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {reading}
      </p>

      <ChartNumbers
        title={title}
        categoryHeader={categoryHeader}
        categories={categories.map((c) => c.long)}
        series={series}
      />
    </figure>
  );
}
