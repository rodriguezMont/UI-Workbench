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
  field: {
    /** Announced when a field starts processing its value. */
    processing: "Processing…",
    /** Announced when a field's value is confirmed. */
    confirmed: "Confirmed",
    /** The limit of a text area, read once with its description. */
    upTo: (max: number) => `Up to ${max} characters.`,
  },
  password: {
    show: "Show password",
    hide: "Hide password",
    minimum: (min: number) => `At least ${min} characters`,
    met: ", met",
    notMet: ", not met yet",
  },
  select: {
    placeholder: "Choose an option",
    search: "Search",
    searchIn: (label: string) => `Search ${label}`,
    nothingFound: (term: string) => `Nothing found for “${term}”.`,
    /** The closed field of a multiple select: "Oil change and 2 more". */
    summary: (first: string, more: number) => `${first} and ${more} more`,
    noneSelected: "None selected",
    selected: (count: number) => (count === 1 ? "1 selected" : `${count} selected`),
    clear: "Clear",
  },
  phone: {
    countryCodeOf: (label: string) => `Country code for ${label}`,
    countrySearch: "Country or code",
    incomplete: (example: string) => `The number is incomplete. An example with this code: ${example}.`,
    tooLong: (example: string) => `Too many digits for this code. An example: ${example}.`,
    invalidLength: (example: string) => `No number of this length exists with this code. An example: ${example}.`,
    /** The advice that solves the usual US mistake. */
    notInUS: "This number doesn't exist in the US. Check the area code.",
    notInCountry: (callingCode: string) => `This number doesn't exist with the code +${callingCode}. Check the digits.`,
  },
} as const;
