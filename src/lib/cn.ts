import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Joins class names and **resolves Tailwind conflicts in favor of the last**.
 *
 * Without the merge, `cn("px-4", "px-2")` would keep both, and the winner
 * would be whichever rule comes later in the generated CSS — not the call
 * order. A component's `className` prop could then fail to override the
 * component's own default, which is the whole point of the prop.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
