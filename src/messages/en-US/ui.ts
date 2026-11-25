/**
 * Copy that lives inside library components — en-US.
 *
 * This file travels with the components when an app copies them. Every
 * user-facing string a component shows comes from here, so a second locale is
 * a second file of the same shape.
 */
export const ui = {
  brand: {
    /** The provisional product name next to the provisional mark. */
    name: "UI Workbench",
  },
  textLink: {
    /** Read after an external link, for people who do not see the glyph. */
    opensInNewTab: "(opens in a new tab)",
  },
  empty: {
    didYouMean: "Did you mean",
  },
  error: {
    title: "Couldn't load this",
    retry: "Try again",
    copyCode: "Copy error code",
    copied: "Code copied.",
    copyFailed: "Couldn't copy. The code is right below.",
    /** Read before the revealed code, for people who do not see the layout. */
    codeForSupport: "Code for support:",
  },
  toast: {
    dismiss: "Dismiss notification",
  },
  dialog: {
    close: "Close",
  },
  fullScreenPanel: {
    back: "Back",
  },
  sideMenu: {
    close: "Close the menu",
    /** The invisible backdrop button; never focusable, but still named. */
    closeOutside: "Close the menu by tapping outside it",
  },
  progress: {
    /** Announced while the route bar is running. */
    loadingPage: "Loading the page",
  },
} as const;
