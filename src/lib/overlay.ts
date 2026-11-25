/**
 * The overlay frame rule, as pure functions: **below 768px, a sheet; from 768
 * up, a dialog.** 768 is also where the app shell's drawer becomes a side
 * panel and the sheet's maximum width — one number for "phone".
 */
export const OVERLAY_BREAKPOINT = 768;

export type OverlayFrame = "sheet" | "dialog";

/** The media query the browser answers at the moment an overlay opens. */
export const OVERLAY_DIALOG_QUERY = `(min-width: ${OVERLAY_BREAKPOINT}px)`;

export function frameForWidth(width: number): OverlayFrame {
  return width >= OVERLAY_BREAKPOINT ? "dialog" : "sheet";
}

/**
 * How far the page must scroll for a panel that opens **below** a field to
 * fit entirely in the window — a calendar, for instance.
 *
 * In a short window the panel fit neither below nor above, and the positioning
 * engine picked a side and pushed it off screen, over the header and away from
 * the field. Scrolling first keeps the panel attached to its field.
 *
 * **It never lifts the field above `topFree`** — the height of a sticky header
 * plus some slack — so the field that opened the panel stays in view. If even
 * that is not enough, it scrolls only that far, and the rest of the panel is
 * reached by scrolling, with the panel still attached to the field.
 */
export function scrollToFitBelow({
  anchorTop,
  anchorBottom,
  panelHeight,
  viewportHeight,
  gap = 6,
  margin = 8,
  // An 80px sticky header plus 4px of slack.
  topFree = 84,
}: {
  anchorTop: number;
  anchorBottom: number;
  panelHeight: number;
  viewportHeight: number;
  gap?: number;
  margin?: number;
  topFree?: number;
}): number {
  const missing = anchorBottom + gap + panelHeight + margin - viewportHeight;
  if (missing <= 0) return 0;
  return Math.max(0, Math.min(missing, anchorTop - topFree));
}
