import { CHART_COLORS, CHART_SOFT, rankingRows, shareLabel, unitWord, type ChartItem, type ChartUnit } from "@/lib/chart";
import { cn } from "@/lib/cn";
import { formatInteger } from "@/lib/format";
import { messages } from "@/messages";

const m = messages.ui.ranking;

/**
 * The ranking — **who comes first, and how much each one weighs in the
 * whole**: signups per region, visitors per source.
 *
 * ## The bar is the share of the whole, not the size against the leader
 *
 * That is what sets it apart from the comparison. There, the largest bar fills
 * the width and the others measure against it; here **the whole track is
 * 100%**, and the bar is each one's slice — 60% fills 60% of the track. That
 * is why the track shows, and why the bar is thin: it accompanies the number,
 * it does not replace it.
 *
 * ## Everything is written, so there is no pointer reading
 *
 * Position, name, value and percentage are on the row, and the ranking is a
 * real ordered list — a listener reads it item by item with no shortcut. A
 * hover tip would repeat what is already on screen, so there is none, and no
 * "See the numbers" either: the list is the numbers.
 *
 * ## Ties, the tail and rounding
 *
 * A tie shares the position (1, 2, 2, 4). With `limit`, the tail folds into a
 * single row at the end, with no position and in the receded series color —
 * "3 more" — because it does not compete for a place. Each percentage is the
 * nearest to its own value — the sum may be 99 or 101 — and a value that
 * rounds to zero shows as "< 1%" (the rules live in `rankingRows`).
 *
 * A zero total is not a ranking: the empty screen is the
 * [chart state](./chart-states.tsx), in the `bars` shape.
 */
export function Ranking({
  title,
  items,
  unit,
  limit,
  othersLabel = m.others,
  className,
}: {
  /** The ranking's title — says what is counted, and over which period. */
  title: string;
  /** Each item is a name and its value. The caller's order only matters on a tie. */
  items: readonly ChartItem[];
  /** The unit a listener hears with the number: "signup", "signups". */
  unit: ChartUnit;
  /** How many get a position; the rest fold into one row. Without it, all show. */
  limit?: number;
  /** The name of the row that folds the tail. */
  othersLabel?: (n: number) => string;
  className?: string;
}) {
  const rows = rankingRows(items, limit);

  return (
    <figure className={cn("w-full", className)}>
      <figcaption className="text-sm font-medium text-primary">{title}</figcaption>

      <ol className="mt-3 space-y-3">
        {rows.map((row) => {
          const tail = row.position === null;
          const name = tail ? othersLabel(row.folded) : row.label;
          return (
            <li key={tail ? "__tail" : row.label} data-tail={tail || undefined} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-2">
              <span aria-hidden className="text-sm tabular-nums text-subtle">
                {row.position ?? ""}
              </span>
              <div className="min-w-0">
                <div className="flex items-baseline justify-between gap-3">
                  <span className={cn("min-w-0 text-sm", tail ? "text-secondary" : "text-primary")}>
                    {row.position !== null && <span className="sr-only">{m.rank(row.position)}</span>}
                    {name}
                  </span>
                  <span className="flex shrink-0 items-baseline gap-2 text-sm tabular-nums">
                    <span className="font-medium text-primary">
                      {formatInteger(row.value)}
                      <span className="sr-only"> {unitWord(row.value, unit)},</span>
                    </span>
                    <span className="w-11 text-right text-secondary">{shareLabel(row)}</span>
                  </span>
                </div>
                <div aria-hidden className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${row.ratio * 100}%`, background: tail ? CHART_SOFT : CHART_COLORS[0] }}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </figure>
  );
}
