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
 * Two forms: `full` (mark and name) for headers, `mark` for tight spots — a
 * collapsed side panel, a favicon.
 */
export function Logo({
  variant = "full",
  height = 28,
  label = messages.ui.brand.name,
  className,
}: {
  variant?: "full" | "mark";
  /** The mark's height in pixels; the name scales with it. */
  height?: number;
  /**
   * The accessible name. Pass `null` when the logo sits next to visible text
   * that already says the same, so it is not read twice.
   */
  label?: string | null;
  className?: string;
}) {
  const mark = (
    <svg viewBox="0 0 32 32" width={height} height={height} aria-hidden className="shrink-0">
      <rect width="32" height="32" rx="8" className="fill-accent" />
      {/* A 2×2 grid of blocks — pieces put together. Two solid, two faint, so
          the mark still reads as a pattern at 16px. */}
      <rect x="8" y="8" width="7" height="7" rx="1.5" className="fill-on-accent" />
      <rect x="17" y="17" width="7" height="7" rx="1.5" className="fill-on-accent" />
      <rect x="17" y="8" width="7" height="7" rx="1.5" className="fill-on-accent" opacity="0.45" />
      <rect x="8" y="17" width="7" height="7" rx="1.5" className="fill-on-accent" opacity="0.45" />
    </svg>
  );

  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label ?? undefined}
      aria-hidden={label ? undefined : true}
      className={cn("inline-flex shrink-0 items-center", className)}
      style={{ gap: Math.round(height * 0.3) }}
    >
      {mark}
      {variant === "full" ? (
        <span aria-hidden className="font-bold leading-none tracking-tight" style={{ fontSize: Math.round(height * 0.6) }}>
          {messages.ui.brand.name}
        </span>
      ) : null}
    </span>
  );
}
