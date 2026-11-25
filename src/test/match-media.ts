/**
 * jsdom has no `matchMedia`. This answers every media query with a fixed
 * result — `true` stands for "wide" (at or above the overlay breakpoint).
 */
export function stubMatchMedia(matches: boolean = true) {
  window.matchMedia = ((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}
