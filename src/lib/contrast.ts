/**
 * WCAG 2 contrast, in one place: the token test measures the CSS with it, and
 * the workbench measures the rendered page with it. Two copies of the formula
 * would drift at the first fix.
 */

export type Rgba = { r: number; g: number; b: number; a: number };

/** A translucent color painted over an opaque one. */
export function over(top: Rgba, bottom: Rgba): Rgba {
  const k = (c: "r" | "g" | "b") => top[c] * top.a + bottom[c] * (1 - top.a);
  return { r: k("r"), g: k("g"), b: k("b"), a: 1 };
}

/** Relative luminance of an sRGB color with 0–255 channels. */
export function luminance({ r, g, b }: Rgba): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** The contrast ratio between two opaque colors, from 1 to 21. */
export function contrast(a: Rgba, b: Rgba): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** The minimums: body text, large text and non-text (controls, focus, charts). */
export const MINIMUM = { text: 4.5, large: 3, ui: 3, enhanced: 7 } as const;
