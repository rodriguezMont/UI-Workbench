/**
 * The step of the slider's − and + buttons — a pure function, with a test.
 *
 * Dragging and the keyboard belong to Radix, which already snaps to the step.
 * The buttons are ours, and adding decimals in floating point gives
 * `1.25 + 0.1 = 1.35000000001`: the value is rounded to the step's decimals,
 * and a button never leaves the range.
 */

/** How many decimals a step has: `0.25` → 2, `5` → 0. */
export function decimalsOf(step: number): number {
  const text = String(step);
  const exponent = /e-(\d+)$/.exec(text);
  if (exponent) return Number(exponent[1]);
  return text.includes(".") ? text.split(".")[1]!.length : 0;
}

/**
 * Moves `delta` from `value`, inside `[min, max]`, and lands on the grid of
 * `step` counted from `min` — where a drag would land.
 */
export function nudge(value: number, delta: number, { min, max, step }: { min: number; max: number; step: number }): number {
  const decimals = Math.max(decimalsOf(step), decimalsOf(delta), decimalsOf(min));
  const onGrid = min + Math.round((value + delta - min) / step) * step;
  const clamped = Math.min(max, Math.max(min, onGrid));
  return Number(clamped.toFixed(decimals));
}
