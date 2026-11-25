import { useState } from "react";

import { Table, type TableColumn } from "@/components/ui/table";
import { CHART_COLORS, formatWithUnit, type ChartSeriesSet, type ChartUnit } from "@/lib/chart";
import { formatInteger } from "@/lib/format";
import { messages } from "@/messages";

const m = messages.ui.chart;

/**
 * The parts every chart shares. **They are not workbench pieces** — nobody
 * builds a screen "using a chart legend" — so they live outside
 * `components/ui`. They exist so the time series, the columns and whatever
 * comes next say the legend, the reading and the numbers the same way: two
 * copies would drift at the first fix.
 */

/**
 * The legend, only with two series — with one, the title already says what it
 * is. The legend's mark mirrors the chart's: a line for a line, a square for a
 * bar.
 */
export function ChartLegend({ series, mark }: { series: ChartSeriesSet; mark: "line" | "bar" }) {
  if (series.length < 2) return null;
  return (
    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-secondary">
      {series.map((s, k) => (
        <li key={s.label} className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className={mark === "line" ? "h-0.5 w-4 rounded-full" : "size-2.5 rounded-[2px]"}
            style={{ background: CHART_COLORS[k] }}
          />
          {s.label}
        </li>
      ))}
    </ul>
  );
}

/**
 * The reading box: when on top, and each series with **the value first and the
 * name after** — people already know the series and want the number. Each
 * row's mark is a dash, not a square: at a reading's density, a filled square
 * is data ink doing a label's job. It flips inward near the right edge, so it
 * never leaves the chart.
 */
export function ChartReading({
  heading,
  series,
  index,
  unit,
  leftPct,
}: {
  heading: string;
  series: ChartSeriesSet;
  index: number;
  unit: ChartUnit;
  /** Where the reading points, in % of the chart's width. */
  leftPct: number;
}) {
  const two = series.length === 2;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute top-1 z-10 min-w-32 rounded-md border border-border bg-surface-raised px-3 py-2 text-xs shadow-md"
      style={{
        left: `${leftPct}%`,
        transform: leftPct > 60 ? "translateX(calc(-100% - 8px))" : "translateX(8px)",
      }}
    >
      <p className="text-secondary">{heading}</p>
      <ul className="mt-1 space-y-0.5">
        {series.map((s, k) => (
          <li key={s.label} className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="h-0.5 w-3 shrink-0 rounded-full" style={{ background: CHART_COLORS[k] }} />
            <strong className="font-bold text-primary">{formatWithUnit(s.values[index] ?? 0, unit)}</strong>
            {two ? <span className="text-secondary">{s.label}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * "See the numbers": the [table](../ui/table.tsx) with every value of the
 * chart. **The reading decorates, it never locks**: whatever it shows on hover
 * can also be read here — without a pointer, without sight and without hurry.
 */
export function ChartNumbers({
  title,
  categoryHeader,
  categories,
  series,
}: {
  title: string;
  /** The first column's name: "Date", "Month". */
  categoryHeader: string;
  /** Each category's full label, in the values' order. */
  categories: readonly string[];
  series: ChartSeriesSet;
}) {
  const columns: TableColumn<number>[] = [
    { id: "category", header: categoryHeader, primary: true, cell: (i) => categories[i] },
    ...series.map(
      (s, k): TableColumn<number> => ({
        id: `series-${k}`,
        header: s.label,
        align: "end",
        cell: (i) => formatInteger(s.values[i] ?? 0),
      }),
    ),
  ];
  return (
    <details className="mt-3">
      <summary
        className="inline-flex cursor-pointer items-center text-sm text-link underline underline-offset-2"
        style={{ minHeight: "var(--tap-target)" }}
      >
        {m.seeNumbers}
      </summary>
      <div className="mt-2">
        <Table caption={title} hiddenCaption columns={columns} rows={categories.map((_, i) => i)} rowKey={(i) => `${i}`} />
      </div>
    </details>
  );
}

/**
 * Reading a chart point by point — **by pointer, by touch and by the arrow
 * keys**. The pointer reads whichever category `indexAt` returns (the nearest
 * on a line; the band on columns): people aim at a date, never at a 2px line.
 * With focus, ←/→ step and Home/End jump to the ends; on focus it starts at
 * the last, the most recent. Leaving with the pointer only clears the reading
 * when focus is not on the chart.
 *
 * **Vertically** — horizontal bars stacked one under the other — the keys are
 * ↑/↓ and focus starts at the first, the largest. There the pointer is not
 * computed from the height: a long name wraps onto two lines and the bands
 * stop being equal. Each row calls `readIndex` when the pointer enters it.
 */
export function useChartReading(
  n: number,
  indexAt: (fraction: number) => number,
  orientation: "horizontal" | "vertical" = "horizontal",
) {
  const [active, setActive] = useState<number | null>(null);
  const vertical = orientation === "vertical";

  function readAt(e: React.PointerEvent<HTMLElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    if (box.width > 0) setActive(indexAt((e.clientX - box.left) / box.width));
  }

  function step(e: React.KeyboardEvent<HTMLElement>) {
    const current = active ?? (vertical ? 0 : n - 1);
    const next =
      e.key === (vertical ? "ArrowDown" : "ArrowRight")
        ? Math.min(n - 1, current + 1)
        : e.key === (vertical ? "ArrowUp" : "ArrowLeft")
          ? Math.max(0, current - 1)
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? n - 1
              : null;
    if (next === null) return;
    e.preventDefault();
    setActive(next);
  }

  return {
    active,
    /** Reads an item by index — for the row that reports when the pointer enters it. */
    readIndex: setActive,
    handlers: {
      tabIndex: 0,
      onPointerMove: readAt,
      onPointerDown: readAt,
      onPointerLeave: (e: React.PointerEvent<HTMLElement>) => {
        if (document.activeElement !== e.currentTarget) setActive(null);
      },
      onFocus: () => setActive((a) => a ?? (vertical ? 0 : n - 1)),
      onBlur: () => setActive(null),
      onKeyDown: step,
    },
  };
}
