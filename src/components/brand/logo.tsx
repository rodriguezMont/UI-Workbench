import { useId } from "react";

import { cn } from "@/lib/cn";
import { messages } from "@/messages";

/**
 * The provisional logo: a neutral mark and the product name in the system
 * font. **Replace this file with the brand's own artwork** — every place that
 * shows a logo reads it from here, so a rebrand is one file.
 *
 * The mark is drawn with role tokens (`fill-accent`, `fill-on-accent`), so it
 * follows the theme; the name follows the surrounding text color, so it also
 * reads on a dark panel.
 *
 * Three forms:
 * - `full` — mark and name side by side, where width is to spare: a header, a
 *   footer;
 * - `stacked` — the name under the mark, where height is to spare: a card, a
 *   share image, a sign-in page;
 * - `mark` — the mark alone, for tight spots: a collapsed side panel, a
 *   favicon, an app icon.
 *
 * Two inks: `color` (the default) and `mono` — one ink, the surrounding text
 * color, with the blocks cut out of the mark. Mono is for where the accent
 * would vanish or clash: on an accent fill, on a photo, in print.
 */
export function Logo({
  variant = "full",
  ink = "color",
  height = 28,
  label = messages.ui.brand.name,
  className,
}: {
  variant?: "full" | "stacked" | "mark";
  ink?: "color" | "mono";
  /** The mark's height in pixels; the name scales with it. */
  height?: number;
  /**
   * The accessible name. Pass `null` when the logo sits next to visible text
   * that already says the same, so it is not read twice.
   */
  label?: string | null;
  className?: string;
}) {
  // A plain id: `useId` returns characters that `url(#…)` would need escaped.
  const maskId = `logo-ink-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const blocks = (
    <>
      {/* A 2×2 grid of blocks — pieces put together. Two solid, two faint, so
          the mark still reads as a pattern at 16px. */}
      <rect x="8" y="8" width="7" height="7" rx="1.5" />
      <rect x="17" y="17" width="7" height="7" rx="1.5" />
      <rect x="17" y="8" width="7" height="7" rx="1.5" opacity="0.45" />
      <rect x="8" y="17" width="7" height="7" rx="1.5" opacity="0.45" />
    </>
  );

  const mark =
    ink === "mono" ? (
      <svg viewBox="0 0 32 32" width={height} height={height} aria-hidden className="shrink-0">
        {/* One ink: the square in the text color, the blocks cut out of it.
            In a mask, white keeps and black removes — luminance, not color. */}
        <mask id={maskId}>
          <rect width="32" height="32" fill="white" />
          <g fill="black">{blocks}</g>
        </mask>
        <rect width="32" height="32" rx="8" className="fill-current" mask={`url(#${maskId})`} />
      </svg>
    ) : (
      <svg viewBox="0 0 32 32" width={height} height={height} aria-hidden className="shrink-0">
        <rect width="32" height="32" rx="8" className="fill-accent" />
        <g className="fill-on-accent">{blocks}</g>
      </svg>
    );

  const stacked = variant === "stacked";
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label ?? undefined}
      aria-hidden={label ? undefined : true}
      className={cn("inline-flex shrink-0 items-center", stacked && "flex-col", className)}
      style={{ gap: Math.round(height * (stacked ? 0.2 : 0.3)) }}
    >
      {mark}
      {variant === "mark" ? null : (
        <span aria-hidden className="font-bold leading-none tracking-tight whitespace-nowrap" style={{ fontSize: Math.round(height * (stacked ? 0.42 : 0.6)) }}>
          {messages.ui.brand.name}
        </span>
      )}
    </span>
  );
}
