import { useEffect, useId, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/cn";
import { messages } from "@/messages";

import { Button } from "./button";

const m = messages.ui.carousel;

export type CarouselImage = {
  /** Stable key: the list can change while it is on screen. */
  id: string;
  src: string;
  /** Describe what the image shows. Without it, the region's label and the position stand in. */
  alt?: string;
};

/** Up to this many images, each one gets a dot; past it, a counter. */
export const MAX_DOTS = 7;

/**
 * How long a scroll the component started keeps the position from driving the
 * index, for browsers without `scrollend`.
 */
const RELEASE_AFTER_MS = 800;

/** An arrow with nowhere to go: faded, and the click does nothing. */
const arrowAtEnd =
  "aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:bg-[color-mix(in_srgb,var(--surface)_92%,transparent)]";

/**
 * The image carousel: a horizontal strip of images, one in view at a time.
 *
 * **Scrolling is the browser's own, with snap points** (`scroll-snap`), not a
 * gesture library. A finger swipes as on any phone list and a trackpad
 * scrolls sideways for free; the current index is read back from the scroll
 * position.
 *
 * **Every gesture has a button.** The arrows sit on the image with their own
 * background (an image can be any color) and fade at the ends. **It does not
 * loop and does not advance on its own**: an image that changes without being
 * asked takes away control of what the person is looking at.
 *
 * **The dots are buttons with a 44px touch area.** Up to seven images, one
 * dot each — seven of them fit a 375px phone. Past that the dots would not fit
 * the floor, and a counter takes their place: "3 of 12".
 *
 * **One image shows without arrows or dots; none renders nothing** — an
 * empty frame where absence is normal says nothing useful.
 *
 * **The keyboard moves through the images** while the strip has focus:
 * arrows, Home and End. Each change is announced ("Image 3 of 5"), and with
 * reduced motion the strip jumps instead of sliding.
 *
 * **Only the first image loads up front**; the rest wait until they come near
 * (`loading="lazy"`). Images are the heavy bytes of a page.
 */
export function Carousel({
  images,
  label = m.label,
  className,
}: {
  images: readonly CarouselImage[];
  /** The region's name, read when focus enters it. */
  label?: string;
  className?: string;
}) {
  const base = useId();
  const trackId = `${base}-track`;
  const track = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const frame = useRef(0);
  // While a scroll the component started is running (button, key), the
  // position does not drive the index: it would pass through every image in
  // between, and a listener would hear each one.
  const target = useRef<number | null>(null);
  const release = useRef<ReturnType<typeof setTimeout>>(undefined);
  const total = images.length;

  // A list that shrinks under the current image brings the index back inside.
  const index = Math.min(current, Math.max(0, total - 1));

  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current);
      clearTimeout(release.current);
    },
    [],
  );

  if (total === 0) return null;

  const clamp = (i: number) => Math.min(total - 1, Math.max(0, i));

  function readPosition() {
    if (target.current !== null) return;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const el = track.current;
      if (!el || el.clientWidth === 0) return;
      setCurrent(clamp(Math.round(el.scrollLeft / el.clientWidth)));
    });
  }

  function goTo(i: number) {
    const el = track.current;
    if (!el) return;
    const next = clamp(i);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.current = next;
    // `scrollend` hands control back to the position; the timer is the safety
    // net for browsers that do not fire it yet.
    clearTimeout(release.current);
    release.current = setTimeout(handBack, RELEASE_AFTER_MS);
    el.scrollTo({ left: next * el.clientWidth, behavior: reduced ? "auto" : "smooth" });
    setCurrent(next);
  }

  /**
   * Only hands control back to the position. The timer calls this rather
   * than `settle`: a long scroll may still be moving, and snapping now would
   * cut it short on an image in between. Later scroll events correct the index.
   */
  function handBack() {
    target.current = null;
    clearTimeout(release.current);
    readPosition();
  }

  /** The real end of a scroll: here, and only here, the strip realigns. */
  function settle() {
    target.current = null;
    clearTimeout(release.current);
    // A scroll interrupted midway (a finger during the animation) can stop
    // between two images, and snapping does not always recover on its own:
    // it goes to the nearest one.
    const el = track.current;
    if (el && el.clientWidth > 0) {
      const nearest = Math.round(el.scrollLeft / el.clientWidth) * el.clientWidth;
      if (Math.abs(el.scrollLeft - nearest) > 1) el.scrollTo({ left: nearest, behavior: "auto" });
    }
    readPosition();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const keys: Record<string, number> = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: total - 1 };
    const next = keys[e.key];
    if (next === undefined) return;
    // Native scrolling would move a few pixels; here a key moves one image.
    e.preventDefault();
    goTo(next);
  }

  const several = total > 1;

  return (
    <section aria-roledescription={m.roleDescription} aria-label={label} className={cn("w-full", className)}>
      <div className="relative">
        <div
          ref={track}
          id={trackId}
          // The strip takes focus so the keyboard can move through it; with a
          // single image there is nowhere to go, and it leaves the Tab order.
          tabIndex={several ? 0 : undefined}
          aria-label={several ? m.keyboardHint(label) : undefined}
          onScroll={readPosition}
          onScrollEnd={settle}
          onKeyDown={several ? onKeyDown : undefined}
          className={cn(
            "flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-lg bg-surface-sunken",
            // No scrollbar: the arrows and the dots say where you are.
            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]",
          )}
        >
          {images.map((image, i) => (
            <div
              key={image.id}
              role="group"
              aria-roledescription={m.slideRoleDescription}
              aria-label={m.position(i + 1, total)}
              className="aspect-[4/3] w-full shrink-0 snap-center snap-always"
            >
              <img
                src={image.src}
                alt={image.alt ?? m.fallbackAlt(label, i + 1)}
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
                draggable={false}
                className="size-full select-none object-cover"
              />
            </div>
          ))}
        </div>

        {several ? (
          <>
            {/* `aria-disabled`, not `disabled`: someone who reaches the last
                image with the arrow keeps focus on it instead of losing it. */}
            <Button
              variant="overlay"
              size="icon"
              aria-label={m.previous}
              aria-controls={trackId}
              aria-disabled={index === 0 || undefined}
              onClick={() => index > 0 && goTo(index - 1)}
              className={cn("absolute left-2 top-1/2 -translate-y-1/2", arrowAtEnd)}
            >
              <ChevronLeft size={22} aria-hidden />
            </Button>
            <Button
              variant="overlay"
              size="icon"
              aria-label={m.next}
              aria-controls={trackId}
              aria-disabled={index === total - 1 || undefined}
              onClick={() => index < total - 1 && goTo(index + 1)}
              className={cn("absolute right-2 top-1/2 -translate-y-1/2", arrowAtEnd)}
            >
              <ChevronRight size={22} aria-hidden />
            </Button>
          </>
        ) : null}
      </div>

      {several ? (
        <div className="mt-1 flex items-center justify-center">
          {total <= MAX_DOTS ? (
            <div role="group" aria-label={m.choose} className="flex">
              {images.map((image, i) => (
                <button
                  key={image.id}
                  type="button"
                  aria-label={m.image(i + 1, total)}
                  aria-current={i === index ? "true" : undefined}
                  aria-controls={trackId}
                  onClick={() => goTo(i)}
                  className="group flex size-[var(--tap-target)] items-center justify-center rounded-full"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "block h-2 rounded-full transition-[width,background-color] duration-[var(--motion-fast)] ease-[var(--motion-ease)]",
                      // The current dot is wider, not only another color: the
                      // shape says where you are.
                      i === index ? "w-5 bg-signal" : "w-2 bg-border-strong group-hover:bg-accent",
                    )}
                  />
                </button>
              ))}
            </div>
          ) : (
            // For sighted users only: listeners hear the live line below.
            <p aria-hidden className="py-2.5 text-sm tabular-nums text-secondary">
              {m.position(index + 1, total)}
            </p>
          )}
        </div>
      ) : null}

      {/* The change, for listeners — by button, key or finger. */}
      <p aria-live="polite" className="sr-only">
        {several ? m.image(index + 1, total) : ""}
      </p>
    </section>
  );
}
