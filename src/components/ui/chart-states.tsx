import { ChartNoAxesColumn } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/cn";
import { messages } from "@/messages";

import { Empty } from "./empty";
import { ErrorState } from "./error";
import { Loading, Skeleton } from "./loading";

const m = messages.ui.chartState;

/**
 * The shape of the chart a state stands in for: `plot` is the time series and
 * the columns (axis, plot area, dates and "See the numbers"); `bars`, the
 * comparison and the ranking, one row per item; `meter`, the meter.
 */
export type ChartShape = "plot" | "bars" | "meter";

type Base = {
  /** The title of the chart to come — it stays on screen in every state, and says what. */
  title: string;
  shape: ChartShape;
  className?: string;
};

type ChartStateProps = Base &
  (
    | {
        state: "loading";
        /** For bars, how many rows to reserve. Defaults to 4. */
        rows?: number;
      }
    | {
        state: "empty";
        /** The fact, in words: "No signups in October". */
        message: string;
        /** **Required**: why it is empty, and when it stops being empty. */
        description: string;
        icon?: LucideIcon;
        /** A way forward — switching the period, say. Never required. */
        children?: React.ReactNode;
      }
    | {
        state: "error";
        /** **Required**, as on the error state: what happened, without a technical message. */
        description: string;
        onRetry?: () => void;
        code?: string;
        /** `false` for showcases only — see the error state. */
        alive?: boolean;
      }
  );

/**
 * A chart's states — **loading in its shape, an empty state that explains,
 * and a human error**.
 *
 * They are not new pieces: they are [Loading](./loading.tsx),
 * [Empty](./empty.tsx) and [ErrorState](./error.tsx) from the States section,
 * **at the chart's measurements**. A copy of each would drift at the first fix.
 *
 * ## The title stays
 *
 * In every state, the chart's title stays on top, unchanged: it says what is
 * loading, what is empty and what failed. A dashboard with five "Couldn't
 * load" panels and no titles does not say which.
 *
 * ## Loading has the exact height
 *
 * In the `plot` shape, the skeleton has the time series' metrics — axis, a
 * 192px plot area (240 from `sm`), dates and the "See the numbers" line — so
 * the chart arrives without pushing anything. For bars, the number of rows
 * comes from the caller, the only one who knows how many items to expect.
 * Empty and error take the same height in the `plot` shape; only an error
 * with the copy-code button grows past it on phones, and the button stays: it
 * is the way to support.
 *
 * ## Empty is a fact, never a drawn zero
 *
 * A zero total over the period is not a chart: a line flat on the floor says
 * nothing the sentence does not say better. The empty state says **the fact
 * and the reason** — "No signups in October", and what makes one appear — and
 * may offer a way forward. The `description` is required for the same reason
 * as on the error: a state without an explanation is a dead screen.
 */
export function ChartState(props: ChartStateProps) {
  const { title, shape, className } = props;
  // In the `plot` shape the panel takes the chart's height and centers; its
  // vertical padding drops so the empty state fits that height on phones. The
  // meter reserves no height: the panel is taller than the meter, and that is
  // accepted — reserving a full panel for a meter that usually loads fine
  // would leave a hole in the common case.
  const panel =
    shape === "plot" ? "min-h-[270px] justify-center py-6 sm:min-h-[318px]" : shape === "meter" ? "py-5" : undefined;

  return (
    // A column, so a panel stretched by its row grows under its title.
    <figure className={cn("flex w-full flex-col", className)}>
      <figcaption className="text-sm font-medium text-primary">{title}</figcaption>

      {props.state === "loading" ? (
        <Loading label={m.loading(title)} className="mt-3 space-y-0">
          {shape === "plot" ? <PlotSkeleton /> : shape === "bars" ? <BarsSkeleton rows={props.rows ?? 4} /> : <MeterSkeleton />}
        </Loading>
      ) : props.state === "empty" ? (
        <Empty
          title={props.message}
          description={props.description}
          icon={props.icon ?? ChartNoAxesColumn}
          className={cn("mt-3 flex-1 justify-center", panel)}
        >
          {props.children}
        </Empty>
      ) : (
        <ErrorState
          title={m.errorTitle}
          description={props.description}
          onRetry={props.onRetry}
          code={props.code}
          alive={props.alive}
          className={cn("mt-3 flex-1", panel)}
        />
      )}
    </figure>
  );
}

// The time series' metrics with one series: a 36px axis beside the 192/240px
// plot area, the dates 6px below at 16px, and "See the numbers" 12px below at
// 44px.
function PlotSkeleton() {
  return (
    <>
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2">
        <div className="flex h-48 w-9 flex-col justify-between py-1 sm:h-60">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="ml-auto h-3 w-5" />
          ))}
        </div>
        <div className="pr-10">
          <Skeleton className="h-48 sm:h-60" />
          <div className="mt-1.5 flex h-4 items-center justify-between">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-3 w-10" />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex h-11 items-center">
        <Skeleton className="h-4 w-28" />
      </div>
    </>
  );
}

// One row per item, shaped like the ranking: the name and the number on top,
// the bar below — widths that fall, because the list arrives sorted.
function BarsSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i}>
          <div className="flex h-5 items-center justify-between">
            <Skeleton className="h-3 w-2/5" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="mt-1.5 h-1.5" style={{ width: `${90 - i * (60 / rows)}%` }} />
        </div>
      ))}
    </div>
  );
}

// The meter without data: the title already is its label, so the track and
// the line below remain — 8 + 10 + 6 + 20, the 44px it has under the label.
function MeterSkeleton() {
  return (
    <div className="-mt-1">
      <Skeleton className="h-2.5 rounded-full" />
      <div className="mt-1.5 flex h-5 items-center justify-between">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}
