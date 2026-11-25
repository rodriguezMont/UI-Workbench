import { cn } from "@/lib/cn";
import { rangeLabel, reportRanges, type ReportPeriod } from "@/lib/report-period";
import { messages } from "@/messages";

import { SegmentedControl, type SegmentedOption } from "./segmented-control";

const m = messages.ui.period;

/** Each period's name — the control and anything that cites the period say the same. */
export const PERIOD_LABEL: Readonly<Record<ReportPeriod, string>> = m.options;

const PERIOD_OPTIONS: SegmentedOption<ReportPeriod>[] = (Object.keys(PERIOD_LABEL) as ReportPeriod[]).map((value) => ({
  value,
  label: PERIOD_LABEL[value],
}));

/**
 * The reporting period — **one line above the charts**, and every chart below
 * follows it.
 *
 * ## The control says the choice; the sentence says the dates
 *
 * "30 days" does not answer "which ones?". Next to the control goes the range
 * in words — "September 1–30" — and **what it is compared with**: every stat's
 * change is against the previous period of the same length, and people need to
 * know which one that is. The sentence is `aria-live`: a listener switches the
 * period and hears the new dates without looking for them.
 *
 * ## Closed days only
 *
 * The period ends yesterday, and the 12-month one, last month — today is still
 * happening, and including it would make the last point of every chart drop.
 * The math lives in `reportRanges`, and `today` comes from whoever renders the
 * page: it is the calendar date of the person the report is for, and the
 * server and the browser must agree on it.
 *
 * The control is the [segmented control](./segmented-control.tsx), with a form
 * `name`: without script, the choice still travels in the URL.
 */
export function Period({
  value,
  onValueChange,
  today,
  name = "period",
  className,
}: {
  value: ReportPeriod;
  onValueChange: (period: ReportPeriod) => void;
  /** Today, as `YYYY-MM-DD`, in the calendar of the person the report is for. */
  today: string;
  /**
   * The field name that carries the choice in the URL. Two periods on one
   * page, outside a form, need different names — radios that share a name are
   * a single group.
   */
  name?: string;
  className?: string;
}) {
  const ranges = reportRanges(value, today);
  const months = value === "12m";

  return (
    // The sentence goes beside the control only when the period has room for
    // both — a full-width dashboard — and below it otherwise. The period's own
    // width decides, not the screen's: in a two-column grid, short dates fit
    // beside it and long ones did not, and neighbors fell out of line.
    <div className={cn("@container w-full", className)}>
      <div className="flex flex-col gap-2 @2xl:flex-row @2xl:items-center @2xl:gap-4">
        <SegmentedControl
          legend={m.legend}
          hiddenLegend
          name={name}
          options={PERIOD_OPTIONS}
          value={value}
          onValueChange={onValueChange}
        />
        {ranges ? (
          <p aria-live="polite" className="text-sm">
            <span className="block font-medium text-primary">{rangeLabel(ranges.current, today, months)}</span>
            <span className="block text-secondary">{m.comparedWith(rangeLabel(ranges.previous, today, months))}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
