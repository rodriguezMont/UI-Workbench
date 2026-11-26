import { useSyncExternalStore } from "react";

/**
 * Whether a section's code is on its way — what the route bar shows.
 *
 * **Suspense alone does not show it.** The router navigates inside a
 * transition, and in a transition React keeps the old page on screen instead
 * of showing the Suspense fallback; the bar in the fallback only ever appeared
 * on the very first load. So each section's import is counted here while it is
 * pending, and the shell shows the bar for as long as one is. Once a section
 * is loaded its import resolves at once, and the bar stays away — nothing is
 * on its way, and the bar never pretends.
 */

let pending = 0;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

/** Counts `load` as pending until it settles, then hands its result back. */
export function trackRouteLoad<T>(load: Promise<T>): Promise<T> {
  pending += 1;
  notify();
  return load.finally(() => {
    pending -= 1;
    notify();
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** True while any section's code is loading. */
export function useRouteLoading(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => pending > 0,
    () => false,
  );
}
