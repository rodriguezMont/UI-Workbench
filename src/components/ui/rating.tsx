import { Star } from "lucide-react";

import { cn } from "@/lib/cn";
import { formatInteger, formatOneDecimal } from "@/lib/format";
import { messages } from "@/messages";

const m = messages.ui.rating;

/**
 * A score, to read. Giving one is the [`RatingInput`](./rating-input.tsx).
 *
 * **With no reviews, it renders nothing.** Five empty stars and "0.0" say the
 * thing is bad, when the fact is that nobody has rated it yet — and for
 * anything new, that is the rule, not the exception. Either a fact is stated,
 * or nothing is. From how many reviews a score deserves to show is a product
 * question, and it lives outside this component.
 *
 * **The number is the information; the stars reinforce it.** For listeners,
 * the whole row is one image with a name — "Rated 4.3 out of 5, 128 reviews" —
 * not five loose "star"s. For sighted users the number is written beside it,
 * because 4.3 and 4.6 draw almost the same row.
 */

const MAX = 5;

/**
 * The score and how many reviews back it — **always together**. A summary
 * receives this, never a loose count: a count without the score is the less
 * useful half of the information, and two sources for the same number end up
 * disagreeing.
 */
export type RatingSummary = { value: number; count: number };

type RatingProps = {
  /** From 0 to 5; anything beyond is clamped, not drawn. */
  value: number;
  /** How many reviews the score summarizes. Zero = the component does not show. */
  count: number;
  size?: "sm" | "md";
  /**
   * `full` — five stars filled by the fraction, and the count.
   * `compact` — **one filled star and the number**, nothing else: for where
   * width is short, such as a list on a phone. The star is only the symbol of
   * "score"; the number says the value, so it neither fills by the fraction
   * nor changes color by range.
   *
   * Which one a screen uses, and when it switches, is the screen's decision —
   * and if it switches, **by width, never by device type**.
   */
  variant?: "full" | "compact";
  /** Without the count beside it — only where it is already said nearby. */
  hideCount?: boolean;
  className?: string;
};

export function Rating({ value, count, size = "md", variant = "full", hideCount = false, className }: RatingProps) {
  if (count <= 0) return null;

  const score = Math.min(MAX, Math.max(0, value));
  // Round to the decimal the number shows: the row cannot say 4.26 while the
  // text says 4.3.
  const shown = Math.round(score * 10) / 10;
  const text = formatOneDecimal(shown);
  const reviews = m.reviews(formatInteger(count), count);
  const icon = size === "sm" ? 14 : 18;
  const label = m.label(text, MAX, reviews);
  const frame = cn("inline-flex items-center text-primary", size === "sm" ? "text-xs" : "text-sm", className);

  if (variant === "compact") {
    // The count leaves the screen, not the reading: listeners still know how
    // many reviews back the number.
    return (
      <span role="img" aria-label={label} className={cn(frame, "gap-1")}>
        <Star size={icon} strokeWidth={1.75} fill="currentColor" aria-hidden className="shrink-0 text-accent" />
        <span aria-hidden className="font-medium tabular-nums">
          {text}
        </span>
      </span>
    );
  }

  return (
    <span className={cn(frame, "gap-1.5")}>
      <span role="img" aria-label={label} className="relative inline-flex">
        {/* The empty row underneath and the filled one on top, cut at the
            score's width. A half star becomes a real half fill, not a round
            up to the nearest whole star. */}
        <span className="flex text-border-strong">
          {Array.from({ length: MAX }, (_, i) => (
            <Star key={i} size={icon} strokeWidth={1.75} aria-hidden />
          ))}
        </span>
        <span className="absolute inset-y-0 left-0 flex overflow-hidden text-accent" style={{ width: `${(shown / MAX) * 100}%` }}>
          {Array.from({ length: MAX }, (_, i) => (
            <Star key={i} size={icon} strokeWidth={1.75} fill="currentColor" aria-hidden className="shrink-0" />
          ))}
        </span>
      </span>
      <span aria-hidden className="font-medium tabular-nums">
        {text}
      </span>
      {hideCount ? null : (
        <span aria-hidden className="text-secondary">
          ({reviews})
        </span>
      )}
    </span>
  );
}
