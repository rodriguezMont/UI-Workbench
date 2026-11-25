import { useId } from "react";

import { CHART_COLORS, meterOfTarget, meterReading, meterValueText, type ChartUnit, type MeterKind } from "@/lib/chart";
import { cn } from "@/lib/cn";

/**
 * The meter — **a value against a goal, as a bar**. Length compares at a
 * glance and an angle does not, so a row of goals is a row of bars; the arc is
 * kept for a single headline goal (the [radial KPI](./radial-kpi.tsx)).
 *
 * ## It is not the progress bar
 *
 * Progress says how much of a **task** is done, and goes away when it ends.
 * The meter says where a **number** stands against a reference, and stays.
 * So its role is `meter`, not `progressbar`, and a listener gets the number,
 * the reference and the phrase at once, through `aria-valuetext`.
 *
 * ## Goal or limit, the same color
 *
 * `kind` only swaps the phrase — "24 short of the goal", "2 left". Near the
 * limit it does not turn red: a state color is never a series, and the phrase
 * already says it. The number rules — never 100% before getting there, the
 * mark once past it — live in `meterReading`.
 *
 * Without a positive reference there is nothing to measure, and the meter
 * renders nothing.
 */
export function Meter({
  label,
  value,
  target,
  unit,
  kind = "goal",
  className,
}: {
  /** What is measured, and over which period: "Signups in October". */
  label: string;
  value: number;
  /** The goal or the limit. Must be positive. */
  target: number;
  /** The unit, agreeing with the reference: "96 of 120 signups", "1 of 5 seats". */
  unit: ChartUnit;
  kind?: MeterKind;
  className?: string;
}) {
  const id = useId();
  const reading = meterReading(value, target, kind);
  if (!reading) return null;

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <p id={id} className="min-w-0 text-sm font-medium text-primary">
          {label}
        </p>
        <span aria-hidden className="shrink-0 text-sm font-bold tabular-nums text-primary">
          {reading.percent}
        </span>
      </div>

      <div
        role="meter"
        aria-labelledby={id}
        aria-valuemin={0}
        aria-valuemax={Math.max(target, value)}
        aria-valuenow={Math.max(0, value)}
        aria-valuetext={meterValueText(value, target, unit, reading)}
        className="relative mt-2 h-2.5 rounded-full bg-border"
      >
        <div className="h-full rounded-full" style={{ width: `${reading.fill * 100}%`, background: CHART_COLORS[0] }} />
        {reading.mark !== null && (
          <span
            data-mark
            className="absolute -inset-y-1 w-0.5 rounded-full bg-surface-contrast"
            style={{ left: `calc(${reading.mark * 100}% - 1px)` }}
          />
        )}
      </div>

      <div aria-hidden className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-3 text-sm text-secondary">
        <span className="tabular-nums">{meterOfTarget(value, target, unit)}</span>
        <span>{reading.remark}</span>
      </div>
    </div>
  );
}
