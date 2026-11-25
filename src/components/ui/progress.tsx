import { useEffect, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/cn";
import { messages } from "@/messages";

/**
 * Progress indicators, from the shortest wait to the longest.
 *
 * - `ProgressBar` — **for work of known size**, such as a file upload whose
 *   total the browser knows. A bar that fills on a timer, measuring nothing,
 *   lies to the person. Content that is arriving gets a skeleton
 *   (`loading.tsx`) instead: it says what is coming.
 * - `Spinner` — the short wait of an action, inside the control that was
 *   touched: saving, looking something up, cropping.
 * - `PageSpinner` — a long wait for a whole screen, always with words beside it.
 * - `RouteProgress` — the bar across the top while an in-app navigation runs.
 */

/**
 * **Screen readers get the number, not the animation:** `role="progressbar"`
 * with the value as a percentage. The label is required, because "45%" alone
 * does not say of what.
 *
 * **Color is never the only information** — done and failed change the fill
 * color, and whoever uses the bar writes the state in text next to it.
 */
export function ProgressBar({
  value,
  label,
  valueText,
  tone = "default",
  className,
}: {
  /** From 0 to 1. Values outside are clamped. */
  value: number;
  /** What is progressing: "Uploading contract.pdf". */
  label: string;
  /** When the number alone is not enough: "Uploaded", "Failed at 60%". */
  valueText?: string;
  tone?: "default" | "success" | "error";
  className?: string;
}) {
  const fraction = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
  const percent = Math.round(fraction * 100);

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-valuetext={valueText}
      // The track is the divider color: the fill carries the information.
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-border", className)}
    >
      <div
        className={cn(
          // No radius of its own: `scaleX` would squash it. The track clips.
          "h-full w-full origin-left",
          // `transform`, not `width`: progress events arrive several times a
          // second, and this animates without recomputing layout each time.
          "transition-[transform,background-color] duration-[var(--motion-fast)] ease-[var(--motion-ease)]",
          tone === "success" ? "bg-success-fill" : tone === "error" ? "bg-error-fill" : "bg-signal",
        )}
        style={{ transform: `scaleX(${fraction})` }}
      />
    </div>
  );
}

/**
 * The short-wait spinner. It inherits the text color (`currentColor`), because
 * it lives inside a button, a field or a switch — a colored spinner there would
 * compete with the control itself.
 *
 * **With reduced motion the icon stands still**, and the person still hears
 * what is happening: through `label`, or through the surrounding control.
 */
export function Spinner({
  size = 18,
  strokeWidth,
  label,
  className,
}: {
  size?: number;
  /** Stroke width. Thicker on small sizes — a switch thumb, for instance. */
  strokeWidth?: number;
  /**
   * What is happening, for screen readers. **Only when the spinner stands
   * alone**: inside a control that already says "Saving…", repeating it would
   * be noise, so the spinner stays decorative.
   */
  label?: string;
  className?: string;
}) {
  return (
    <>
      <LoaderCircle
        size={size}
        strokeWidth={strokeWidth}
        aria-hidden
        className={cn("shrink-0 motion-safe:animate-spin", className)}
      />
      {label ? (
        <span role="status" className="sr-only">
          {label}
        </span>
      ) : null}
    </>
  );
}

/**
 * The long-wait ring for a whole screen: an arc in the accent color that
 * starts transparent and ends in a round head, spinning.
 *
 * **It never comes alone.** The text beside it says what is happening; with
 * reduced motion the ring stands still and the text is all that is left, which
 * is why `label` is required. The look lives in the `.ui-ring` classes of
 * `tokens.css`, so a rebrand can restyle it without touching this file.
 */
export function PageSpinner({
  label,
  size = 40,
  className,
}: {
  /** "Loading your dashboard", "Preparing the export". */
  label: string;
  size?: number;
  className?: string;
}) {
  // The stroke grows with the ring but never below 3px: thinner than that, it
  // disappears inside the glow.
  const stroke = Math.max(3, Math.round(size / 12));
  const head = stroke * 1.05;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span aria-hidden style={{ width: size, height: size }} className="relative block shrink-0">
        <span style={{ ["--ring-width" as string]: `${stroke}px` }} className="ui-ring absolute inset-0 rounded-full" />
        {/* The head sits at the top, on the same axis as the arc: spinning
            with it, it is the round tip a conic gradient cannot draw. */}
        <span className="ui-ring-head absolute inset-0 rounded-full">
          <span
            style={{ width: head, height: head, marginLeft: -head / 2 }}
            className="ui-ring-dot absolute left-1/2 top-0 block rounded-full"
          />
        </span>
      </span>
      <span role="status" className="text-sm font-medium text-secondary">
        {label}
      </span>
    </div>
  );
}

/**
 * The route bar: **a line across the top, edge to edge, while the page
 * changes.** It grows fast at first, slows down near the end and **stops at
 * 92%** — a navigation has no known size, and stopping there is the honest way
 * to say "almost there" without inventing a number. **The arrival of the route
 * closes the last 8%**, and only then does the bar fade.
 *
 * **No router inside.** Pass `active` from whatever router the app uses —
 * with React Router, `useNavigation().state !== "idle"`. A server-rendered
 * page load already has the browser's own progress; this bar is for
 * client-side navigation.
 */
export function RouteProgress({
  active,
  forceVisible = false,
  embedded = false,
}: {
  /** `true` while a navigation is in flight. */
  active: boolean;
  /** Shows the bar with no navigation at all — for showcases. */
  forceVisible?: boolean;
  /**
   * Pinned to the surrounding box instead of fixed to the top of the window.
   * **For showcases**: in an app the bar belongs to the top of the screen.
   */
  embedded?: boolean;
}) {
  // Three phases: idle, **running** while the route has not arrived, and
  // **closing** for the milliseconds in which it completes to 100%. Without
  // the third, the bar would vanish halfway and the arrival would have no end.
  const [phase, setPhase] = useState<"idle" | "running" | "closing">("idle");
  // One run per navigation: the key that restarts the bar from zero.
  const [run, setRun] = useState(0);

  // The switch happens during render, not in an effect: it is the new value
  // of `active` that decides it, and an effect would apply it a frame late.
  if (active && phase !== "running") {
    setPhase("running");
    setRun((n) => n + 1);
  }
  if (!active && phase === "running") setPhase("closing");

  const bar = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (phase !== "closing") return;
    // **The close starts from where the bar was.** Removing the growing
    // animation would snap the value back to its start, turning the run to
    // 100% into a jump. So the current position becomes an inline style, and
    // only on the next frame does it travel to the end.
    const el = bar.current;
    if (el) {
      const current = getComputedStyle(el).transform;
      el.style.animation = "none";
      el.style.transform = current === "none" ? "scaleX(1)" : current;
      requestAnimationFrame(() => {
        el.style.transition = "transform var(--motion-fast) var(--motion-ease-out)";
        el.style.transform = "scaleX(1)";
      });
    }
    const done = setTimeout(() => setPhase("idle"), 260);
    return () => clearTimeout(done);
  }, [phase]);

  const visible = forceVisible || phase !== "idle";

  return (
    <div
      className={cn(
        "pointer-events-none h-1 overflow-hidden",
        embedded ? "absolute inset-x-0 top-0" : "fixed inset-x-0 top-0 z-50",
        "transition-opacity duration-[var(--motion-fast)] ease-[var(--motion-ease)]",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      {visible ? (
        <span
          ref={bar}
          // **Keyed by navigation, not by phase**: keyed by phase, the element
          // would remount on close and the run to 100% would become a jump.
          // Keyed by navigation, the next one starts from zero.
          key={run}
          className="ui-route-bar block h-full w-full"
        />
      ) : null}
      {/* What the bar says, for people who do not see it. **Always mounted and
          never hidden**: a live region that enters the tree together with its
          text is often not announced. Idle, it is empty, and empty announces
          nothing. */}
      <span role="status" className="sr-only">
        {active ? messages.ui.progress.loadingPage : ""}
      </span>
    </div>
  );
}
