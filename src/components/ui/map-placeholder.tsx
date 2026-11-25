import { cn } from "@/lib/cn";
import { messages } from "@/messages";

const m = messages.ui.mapPlaceholder;

/**
 * The map placeholder: **an illustrative drawing that holds the place of a
 * real map** — before a map provider is set up, in a prototype, or wherever a
 * map is not worth its weight. It says so on screen.
 *
 * **It never pretends to be a location.** The streets are generic, the pin is
 * always in the center, and the "Illustrative map" caption is always in view;
 * the address as text, next to it, is what informs. No map library, no
 * tiles, no coordinates.
 *
 * **The theme is the app's**: every fill and stroke is a role token
 * (`surface`, `surface-sunken`, `border`, `accent`), so the drawing follows
 * light and dark without a line per scheme — and a real map styled later can
 * take the same roles.
 *
 * **Whether a map belongs on the screen is the caller's decision**, not this
 * piece's: it draws, it does not decide.
 *
 * For assistive technology it is one image with a name that says it is not a
 * real map; the drawing inside is hidden.
 */
export function MapPlaceholder({
  label = m.label,
  caption = m.caption,
  className,
}: {
  /** The accessible name. Keep it honest: it should say the map is illustrative. */
  label?: string;
  /** The visible tag in the corner. */
  caption?: string;
  className?: string;
}) {
  return (
    <figure
      role="img"
      aria-label={label}
      className={cn(
        "relative aspect-[16/10] w-full overflow-hidden rounded-lg border border-border bg-surface-sunken",
        className,
      )}
    >
      <svg
        viewBox="0 0 400 250"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        {/* The blocks are the ground; the streets are cut out of it in the
            page background color. */}
        <rect width="400" height="250" className="fill-surface" />
        {/* A park: the only color besides the pin, kept faint. */}
        <rect
          x="133"
          y="14"
          width="114"
          height="78"
          rx="8"
          className="fill-[color-mix(in_srgb,var(--accent)_10%,var(--surface))]"
        />
        <g className="fill-none stroke-surface-sunken" strokeWidth="10" strokeLinecap="round">
          <path d="M120 -10 V260" />
          <path d="M260 -10 V260" />
          <path d="M-10 105 H410" />
          <path d="M340 105 V260" />
          <path d="M-10 238 L112 186" />
        </g>
        {/* The avenue: a wider band with the stronger line and a dashed center. */}
        <path d="M-10 180 H410" className="fill-none stroke-border" strokeWidth="16" />
        <path d="M-10 180 H410" className="fill-none stroke-surface" strokeWidth="2" strokeDasharray="10 8" />
      </svg>

      {/* The pin, always in the center: it is a drawing, not a coordinate. */}
      <span aria-hidden className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
        <span className="absolute left-1/2 top-full size-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color-mix(in_srgb,var(--accent)_22%,transparent)]" />
        <svg viewBox="0 0 24 32" className="relative h-9 w-7 drop-shadow-sm">
          <path
            d="M12 0C5.4 0 0 5.2 0 11.7 0 20.4 12 32 12 32s12-11.6 12-20.3C24 5.2 18.6 0 12 0Z"
            className="fill-accent"
          />
          <circle cx="12" cy="11.5" r="4.5" className="fill-surface" />
        </svg>
      </span>

      <figcaption className="absolute bottom-2 left-2 rounded-md bg-surface px-2 py-1 text-xs text-secondary">
        {caption}
      </figcaption>
    </figure>
  );
}
