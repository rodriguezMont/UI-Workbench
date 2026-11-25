import { ChartNumbers, useChartReading } from "@/components/chart/parts";
import { CHART_COLORS, CHART_SOFT, bandIndex, readingText, sortedDesc, type ChartItem, type ChartUnit } from "@/lib/chart";
import { cn } from "@/lib/cn";
import { formatInteger } from "@/lib/format";
import { messages } from "@/messages";

const m = messages.ui.chart;

/**
 * The comparison — **horizontal bars, largest first, with the value at the
 * tip**: one quantity across categories, such as signups per channel or
 * revenue per region.
 *
 * ## Length compares; the highlight points
 *
 * What says larger and smaller is the bar's **length** — a color per category
 * would say "these are different things" and send the eye to memorize a
 * legend. But all bars alike leave the screen without a focal point. The way
 * out is the **highlight**: one bar in full series 1 — the person's own team,
 * the channel that brought the most — while the others step back, and its name
 * goes bold, so the highlight does not rely on color alone.
 *
 * The others step back in one of two ways, the screen's choice:
 * - `soft` — series 1 receded (`--chart-1-soft`). The highlight reads by
 *   lightness.
 * - `second` — series 2. Two chart roles with meaning: this one, and the rest.
 *
 * **One color per bar is not offered.** With color following the category,
 * any pair can end up side by side, and many pairs of hues fail to separate
 * for people with color-vision deficiency. Two roles that differ in lightness
 * as well as hue always do.
 *
 * ## Horizontal, sorted, and the number at the tip
 *
 * Horizontal because the name is text, and text reads horizontally. Sorted
 * largest first; a tie keeps the caller's order. The value is written at the
 * tip of each bar, so there is no axis. **Zero is a fact and shows as zero**;
 * a category that does not exist does not enter the list.
 *
 * ## The whole row is the target
 *
 * The pointer reads the row it is on, and the others step back. With focus,
 * ↑/↓ move item by item and Home/End jump to the ends, announced to listeners
 * — the highlight is announced too. On phones the name sits above the bar.
 */
export function Comparison({
  title,
  items,
  valueLabel,
  unit,
  highlight,
  others = "soft",
  categoryHeader = m.categoryHeader,
  className,
}: {
  /** The chart's title — also the name of its table. */
  title: string;
  /** One series: each item is a category and its value. The caller's order only matters on a tie. */
  items: readonly ChartItem[];
  /** The value's name in the table: "Signups", "Visitors". */
  valueLabel: string;
  unit: ChartUnit;
  /** The label of the highlighted item. Without it, every bar in series 1. */
  highlight?: string;
  /** How the others step back when there is a highlight: series 1 receded, or series 2. */
  others?: "soft" | "second";
  /** The name of the table's first column: "Channel", "Region". */
  categoryHeader?: string;
  className?: string;
}) {
  const sorted = sortedDesc(items);
  const n = sorted.length;
  const { active, readIndex, handlers } = useChartReading(n, (f) => bandIndex(f, n), "vertical");

  const highest = Math.max(0, ...sorted.map((i) => i.value));
  const series = [{ label: valueLabel, values: sorted.map((i) => i.value) }] as const;
  const isHighlight = (item: ChartItem) => highlight !== undefined && item.label === highlight;
  const colorOf = (item: ChartItem) =>
    highlight === undefined || isHighlight(item) ? CHART_COLORS[0] : others === "second" ? CHART_COLORS[1] : CHART_SOFT;
  const reading =
    active === null
      ? ""
      : `${readingText(sorted[active]!.label, series, active, unit)}${isHighlight(sorted[active]!) ? m.highlighted : ""}`;

  return (
    <figure className={cn("w-full", className)}>
      <figcaption className="text-sm font-medium text-primary">{title}</figcaption>

      <div
        {...handlers}
        // Here the pointer is read row by row (`readIndex`), not from the
        // position in the box: a name that wraps onto two lines makes the
        // bands unequal.
        onPointerMove={undefined}
        onPointerDown={undefined}
        role="group"
        aria-roledescription={m.roleDescription}
        aria-label={m.readByItem(title)}
        className="mt-3 rounded-sm"
      >
        <ul aria-hidden className="space-y-3">
          {sorted.map((item, i) => {
            const pct = highest > 0 ? (item.value / highest) * 100 : 0;
            const emphasized = isHighlight(item);
            return (
              <li
                key={item.label}
                data-highlight={emphasized || undefined}
                onPointerEnter={() => readIndex(i)}
                onPointerDown={() => readIndex(i)}
                className={cn(
                  "grid gap-x-3 gap-y-1 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] sm:items-center",
                  "transition-opacity duration-[var(--motion-fast)] ease-[var(--motion-ease)]",
                  active !== null && active !== i ? "opacity-40" : "opacity-100",
                )}
              >
                <span className={cn("text-sm sm:text-right", emphasized ? "font-bold text-primary" : "text-secondary")}>
                  {item.label}
                </span>
                {/* The right padding is where the number at the tip lives. */}
                <div className="pr-12">
                  <div className="relative h-5">
                    <div className="h-full rounded-r-[4px]" style={{ width: `${pct}%`, background: colorOf(item) }} />
                    <span
                      className="absolute top-1/2 ml-2 -translate-y-1/2 whitespace-nowrap text-xs font-medium tabular-nums text-primary"
                      style={{ left: `${pct}%` }}
                    >
                      {formatInteger(item.value)}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <p aria-live="polite" className="sr-only">
        {reading}
      </p>

      <ChartNumbers
        title={title}
        categoryHeader={categoryHeader}
        categories={sorted.map((i) => i.label)}
        series={series}
      />
    </figure>
  );
}
