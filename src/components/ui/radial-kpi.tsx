import { useId } from "react";

import { CHART_COLORS, gaugeArc, gaugePoint, meterOfTarget, meterReading, meterValueText, type ChartUnit } from "@/lib/chart";
import { cn } from "@/lib/cn";
import { formatInteger } from "@/lib/format";

import { StatDelta, type StatComparison } from "./stat";

// The arc's box: a half turn of radius 84 with its center at the bottom; the
// stroke width and the round caps fit inside it.
const W = 200;
const H = 112;
const CX = 100;
const CY = 100;
const R = 84;
const STROKE = 14;

/**
 * **One headline goal**: the large percentage in the center, and the arc
 * saying how much of the goal is already in. Never in a row, to compare
 * several goals — that is the [meter](./meter.tsx)'s bar, because length
 * compares at a glance and an angle does not.
 *
 * The math is the meter's: `meterReading` and `meterValueText`, never 100%
 * before getting there. Past the goal, the arc fills and a tick marks where
 * the goal sat. For listeners it is a `meter` with the same value text as the
 * bar.
 */
export function RadialKpi({
  title,
  description,
  value,
  target,
  unit,
  comparison,
  facts,
  className,
}: {
  title: string;
  /** What the goal is, in words: "the goal set for October". */
  description: string;
  value: number;
  /** The goal. Must be positive; without one, nothing renders. */
  target: number;
  unit: ChartUnit;
  comparison?: StatComparison;
  /** The numbers under the arc: "Goal 45 · Done 34 · Today 3". Up to three. */
  facts?: readonly { label: string; value: number }[];
  className?: string;
}) {
  const id = useId();
  const reading = meterReading(value, target);
  if (!reading) return null;

  // Past the goal: a tick crosses the track where the goal sat.
  const mark =
    reading.mark !== null
      ? { from: gaugePoint(reading.mark, CX, CY, R - STROKE), to: gaugePoint(reading.mark, CX, CY, R + STROKE) }
      : null;

  return (
    <div className={cn("flex w-full flex-col rounded-lg border border-border bg-surface", className)}>
      <div className="px-5 pt-5">
        <p id={id} className="text-base font-bold text-primary">
          {title}
        </p>
        <p className="mt-0.5 text-sm text-secondary">{description}</p>
      </div>

      <div className="flex-1 px-5 pb-4">
        <div className="relative mx-auto mt-4 max-w-64">
          <svg
            role="meter"
            aria-labelledby={id}
            aria-valuemin={0}
            aria-valuemax={Math.max(target, value)}
            aria-valuenow={Math.max(0, value)}
            aria-valuetext={meterValueText(value, target, unit, reading)}
            viewBox={`0 0 ${W} ${H}`}
            className="block h-auto w-full overflow-visible"
          >
            <path d={gaugeArc(1, CX, CY, R)} fill="none" stroke="var(--border)" strokeWidth={STROKE} strokeLinecap="round" />
            {reading.fill > 0 ? (
              <path
                d={gaugeArc(reading.fill, CX, CY, R)}
                fill="none"
                stroke={CHART_COLORS[0]}
                strokeWidth={STROKE}
                strokeLinecap="round"
              />
            ) : null}
            {mark ? (
              <line
                data-mark
                x1={mark.from.x}
                y1={mark.from.y}
                x2={mark.to.x}
                y2={mark.to.y}
                stroke="var(--surface-contrast)"
                strokeWidth={2}
                strokeLinecap="round"
              />
            ) : null}
          </svg>
          <p aria-hidden className="absolute inset-x-0 bottom-0 text-center text-4xl font-bold tabular-nums text-primary">
            {reading.percent}
          </p>
        </div>

        <p aria-hidden className="mt-3 text-center text-sm text-secondary">
          {meterOfTarget(value, target, unit)} · {reading.remark}
        </p>
        {comparison ? (
          <p className="mt-1 text-center text-sm">
            <StatDelta current={value} comparison={comparison} />
          </p>
        ) : null}
      </div>

      {facts?.length ? (
        <dl className="grid grid-cols-3 divide-x divide-border border-t border-border">
          {facts.slice(0, 3).map((f) => (
            <div key={f.label} className="px-2 py-3 text-center">
              <dt className="text-xs text-secondary">{f.label}</dt>
              <dd className="mt-0.5 text-base font-bold tabular-nums text-primary">{formatInteger(f.value)}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}
