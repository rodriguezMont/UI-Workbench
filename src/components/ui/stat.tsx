import { Children, createContext, useContext, useId } from "react";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";

import { CHART_COLORS, deltaOf, sparkPoints } from "@/lib/chart";
import { cn } from "@/lib/cn";
import { formatInteger, formatPercent, formatThousandsFloor } from "@/lib/format";
import { messages } from "@/messages";

const m = messages.ui.stat;

/**
 * The headline number — **the number is the chart**.
 *
 * A single value against the previous period asks for no bar and no pie: it
 * asks for the big number, the change said in words and, when it fits, the
 * shape of the trend.
 *
 * ## The change is said, not just painted
 *
 * "12% higher than in October", with an arrow and with color — and color is
 * the last of the three: someone who cannot tell green from red reads "higher"
 * and "lower". Going up is only good when more is better, which is why the
 * caller says so (`higherIsBetter`).
 *
 * **Without a base, there is no percentage.** Zero to 40 is not "infinite
 * percent": the screen says "none recorded in October". And what moved less
 * than half a percent is "the same as in October" — a wobble is not news.
 *
 * ## No data is said in words; never shown as zero
 *
 * `value: null` means "not measured yet", and the screen writes that. Zero is
 * a fact and shows as zero; absence is not zero.
 *
 * ## The sparkline shows shape, not size
 *
 * It runs from the series' own minimum to its maximum, without an axis: the
 * size is the number written above it. So it has no point-by-point reading —
 * that belongs to the time series, the full chart. For listeners it is an
 * image with a name, and the name is required.
 */

export type StatComparison = {
  /** The previous period's value. `null` or `0`: there is no base for a percentage. */
  previous: number | null;
  /** With its preposition, because it changes: "in October", "in the previous 30 days". */
  to: string;
  /** For visitors, more is better; for response time, it is not. Defaults to more is better. */
  higherIsBetter?: boolean;
};

export type StatTrend = {
  values: readonly number[];
  /** The image's name for listeners: "Visitors per day in October, from 320 to 510". */
  label: string;
};

/**
 * `panel` is the dashboard number: label on top, change and trend. `showcase`
 * is the figure of a public page: the number on top, large, then the title and
 * a sentence that explains it — no change and no trend, because there the
 * number is a fact, not a comparison. The showcase card is always dark.
 */
export type StatVariant = "panel" | "showcase";

// Inside a stat group the variant comes from the group; in a panel, each card
// spans four rows of the parent grid (`subgrid`): label, value, change and
// trend line up across neighbors even when one label wraps onto two lines.
const InGroup = createContext<StatVariant | null>(null);

function Sparkline({ values, label }: StatTrend) {
  const W = 120;
  const H = 32;
  const points = sparkPoints(values, W, H);
  if (!points) return null;
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="block h-8 w-full overflow-visible"
    >
      <polyline
        points={points}
        fill="none"
        stroke={CHART_COLORS[0]}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        // The box stretches with the card; without this the line would thicken with it.
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/**
 * The trend's place when there is no data: a dashed line that breaks and
 * fades at both ends. Decoration only — the sentence above says it.
 */
function UnavailableLine() {
  const id = useId();
  const W = 120;
  const H = 32;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block h-8 w-full overflow-visible">
      <defs>
        <linearGradient id={id} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="var(--border-strong)" stopOpacity="0" />
          <stop offset="0.25" stopColor="var(--border-strong)" />
          <stop offset="0.75" stopColor="var(--border-strong)" />
          <stop offset="1" stopColor="var(--border-strong)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Two segments with a gap between them: a line that broke. */}
      <polyline
        points="0,20 18,14 34,22 50,12"
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth={2}
        strokeDasharray="4 5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <polyline
        points="68,18 84,24 100,13 120,19"
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth={2}
        strokeDasharray="4 5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/**
 * The change said in words — "12% higher than in October" — with the color
 * of good and bad. Exported because the radial KPI says its change the same
 * way: two copies would drift at the first fix.
 */
export function StatDelta({ current, comparison }: { current: number; comparison: StatComparison }) {
  const delta = deltaOf(current, comparison.previous);
  const betterUp = comparison.higherIsBetter ?? true;

  if (delta.kind === "none") {
    // `null` is "the previous period was not measured": nothing to say. Zero
    // is a fact: "none recorded in October".
    if (comparison.previous === null) return null;
    return <span className="text-secondary">{m.noBase(comparison.to)}</span>;
  }

  if (delta.kind === "flat") {
    return (
      <span className="text-secondary">
        <Minus size={16} aria-hidden className={DELTA_ICON} />
        {m.flat(comparison.to)}
      </span>
    );
  }

  const up = delta.kind === "up";
  const good = up === betterUp;
  const Icon = up ? TrendingUp : TrendingDown;
  const percent = formatPercent(delta.ratio);
  return (
    <span className={good ? "text-success" : "text-error"}>
      <Icon size={16} aria-hidden className={DELTA_ICON} />
      {up ? m.up(percent, comparison.to) : m.down(percent, comparison.to)}
    </span>
  );
}

/**
 * The trend glyph sits in the line of text, not in a flex box beside it: when
 * the phrase wraps — a narrow card, a centered readout — the glyph stays at the
 * start of the first line instead of being stranded at the container's edge.
 */
const DELTA_ICON = "mr-1 inline-block align-[-0.2em]";

export function Stat({
  label,
  value,
  comparison,
  trend,
  variant,
  rounding,
  detail,
  className,
}: {
  label: string;
  /**
   * **A count** — visitors, signups, orders — written as an integer with
   * grouped thousands. A score or a rate with a decimal is not this: "4.6"
   * would become "5". `null` = not recorded yet; never use `0` to say "not
   * measured".
   */
  value: number | null;
  comparison?: StatComparison;
  /**
   * The line under the number. **With `value` null, a trend still passed
   * draws as unavailable** — a broken dashed line in the place of the data —
   * so the card keeps the height of its neighbors in a row of trends.
   */
  trend?: StatTrend;
  /** Without it, the surrounding group's; on its own, the panel. */
  variant?: StatVariant;
  /** Showcase only: "69K+" instead of "69,842" (`formatThousandsFloor`). */
  rounding?: "thousands";
  /** Showcase only: the sentence that explains the number, under the title (`label`). */
  detail?: string;
  className?: string;
}) {
  const group = useContext(InGroup);

  if ((variant ?? group) === "showcase") {
    return (
      // The number on top, large, in the figure role; below it the title and
      // the sentence. The label comes first in the HTML — a listener hears
      // "Countries, 23" — and the screen moves it down (`order`). **The card is
      // dark on any page**: `data-theme` forces the scheme for its subtree.
      <dl
        data-theme="dark"
        className={cn("relative flex h-full flex-col rounded-lg border border-border bg-surface-feature p-5 lg:p-7", className)}
      >
        <dt className="order-2 mt-6 text-xl font-bold text-on-feature lg:mt-10">{label}</dt>
        {value === null ? (
          <dd className="order-1 text-base text-on-feature-muted">{m.noData}</dd>
        ) : (
          <dd className="order-1 text-4xl leading-none font-bold tracking-tight text-figure lg:text-5xl xl:text-6xl">
            {rounding === "thousands" ? formatThousandsFloor(value) : formatInteger(value)}
          </dd>
        )}
        {detail ? <dd className="order-3 mt-2 text-base font-medium text-on-feature-muted">{detail}</dd> : null}
      </dl>
    );
  }

  return (
    <dl
      className={cn(
        "grid content-start gap-y-1 rounded-lg border border-border bg-surface p-4",
        group === "panel" ? "row-span-4 grid-rows-subgrid" : "grid-rows-[auto_auto_auto_auto]",
        className,
      )}
    >
      <dt className="row-start-1 text-sm text-secondary">{label}</dt>
      {value === null ? (
        <>
          {/* The four rows stay: a dash where the number goes, the sentence
              where the change goes, and a broken line where the trend goes —
              the card says "nothing here yet" in the shape of the data. */}
          <dd aria-hidden className="row-start-2 text-3xl font-bold text-subtle">
            —
          </dd>
          <dd className="row-start-3 text-sm text-secondary">{m.noData}</dd>
          {trend ? (
            <dd aria-hidden className="row-start-4 pt-2">
              <UnavailableLine />
            </dd>
          ) : null}
        </>
      ) : (
        <>
          {/* Proportional digits: a large number standing alone. `tabular-nums`
              gives every digit the width of a zero, and "1,206" at 30px looks
              loose — it is for columns of numbers that must line up. */}
          <dd className="row-start-2 text-3xl font-bold text-primary">{formatInteger(value)}</dd>
          {comparison ? (
            <dd className="row-start-3 text-sm">
              <StatDelta current={value} comparison={comparison} />
            </dd>
          ) : null}
          {trend ? (
            <dd className="row-start-4 pt-2">
              <Sparkline {...trend} />
            </dd>
          ) : null}
        </>
      )}
    </dl>
  );
}

/**
 * A row of stats. **In a panel**, the top of a dashboard: one per line on
 * phones, two from `sm`, up to four from `lg` — and neighbors line up by
 * structure, never by the luck of label length. **As a showcase**, one per line
 * on phones, two from `sm` and four from `lg`: with a title and a sentence,
 * the card needs width so the sentence does not turn into a column.
 */
export function StatGroup({
  label,
  variant = "panel",
  children,
  className,
}: {
  /** What the row sums up, for listeners: "October summary". */
  label: string;
  variant?: StatVariant;
  children: React.ReactNode;
  className?: string;
}) {
  const count = Children.count(children);
  const showcase = variant === "showcase";
  return (
    <InGroup.Provider value={variant}>
      <ul
        aria-label={label}
        className={cn(
          showcase ? "grid gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4" : "grid gap-4 sm:grid-cols-2",
          !showcase && (count >= 4 ? "lg:grid-cols-4" : count === 3 ? "lg:grid-cols-3" : ""),
          className,
        )}
      >
        {Children.map(children, (child) => (
          <li className={showcase ? undefined : "row-span-4 grid grid-rows-subgrid"}>{child}</li>
        ))}
      </ul>
    </InGroup.Provider>
  );
}
