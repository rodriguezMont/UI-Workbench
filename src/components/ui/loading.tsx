import { cn } from "@/lib/cn";

/**
 * The skeleton — **the shape of what is coming, not a spinner**.
 *
 * A generic indicator says "wait"; a skeleton says "wait, and this is what
 * will arrive". The layout does not jump when the content lands, because the
 * space was already reserved at the right size.
 *
 * ## Two rules this component carries
 *
 * **1. A skeleton has the shape of the real content.** A generic rectangle
 * where a card will appear reserves the wrong space: the layout jumps on
 * arrival and the person loses their place. Build skeletons from the real
 * component's measurements — `SkeletonCard` below is a starting point, meant
 * to be adjusted to the card it stands in for.
 *
 * **2. A screen reader does not hear a skeleton.** The waiting region declares
 * `aria-busy` and a label — without it, assistive technology announces
 * silence and the person cannot tell a frozen page from a loading one. **The
 * animation is for people who see; `aria-busy` is for people who listen**,
 * and both are needed.
 *
 * Reduced motion does not reach this animation through the motion tokens: it
 * has its own long rhythm, so the `.ui-skeleton` class is switched off by an
 * explicit media query in `tokens.css`. The shape stays; the pulse stops.
 */
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      className={cn(
        "rounded-md bg-surface-placeholder",
        // A plain class, not an arbitrary-value utility: it is exactly the one
        // the reduced-motion media query switches off.
        "ui-skeleton",
        className,
      )}
      {...props}
    />
  );
}

/**
 * The waiting region. **It is what speaks to people who listen** — the
 * skeletons inside are `aria-hidden`, because describing fifteen rectangles
 * would be noise.
 */
export function Loading({
  label,
  children,
  className,
}: {
  /** What is arriving, in words: "Loading your projects". */
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className={cn("space-y-3", className)}>
      {children}
    </div>
  );
}

/**
 * A list-card skeleton: a thumbnail, a title line, a subtitle line and two
 * tags. The heights mirror real text metrics — `h-5` is the line height of
 * `text-base`, `h-3` a small caption, `h-[22px]` a badge with `py-0.5` — so
 * swapping it for the real card does not shift the layout. Match it to your
 * own card's measurements.
 */
export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex gap-4">
        <Skeleton className="size-14 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-5 w-2/5" />
          <Skeleton className="h-3 w-3/5" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-[22px] w-20 rounded-full" />
            <Skeleton className="h-[22px] w-24 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
