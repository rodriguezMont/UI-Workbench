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
  format: {
    /** A count in thousands, rounded down: "69K+". Gets the formatted thousands. */
    thousandsFloor: (thousands: string) => `${thousands}K+`,
  },
  checkboxList: {
    search: "Search",
    searchIn: (legend: string) => `Search ${legend}`,
    nothingFound: (term: string, legend: string) => `Nothing in ${legend} matches “${term}”.`,
    limit: (count: number, max: number) => `Choose up to ${max} — ${count} of ${max}.`,
    limitReached: (max: number) => `Limit of ${max} reached — uncheck one to swap.`,
    showAll: (total: number) => `Show all (${total})`,
    showLess: "Show less",
    /** The count is in the name: "Clear" alone does not say how much is lost. */
    clear: (count: number) => `Clear (${count})`,
  },
  switch: {
    saving: "Saving…",
    /** What the supporting line says when the switch goes back. */
    saveFailed: "Couldn't save, so the switch went back. Try again.",
  },
  slider: {
    decrease: (label: string) => `Decrease ${label}`,
    increase: (label: string) => `Increase ${label}`,
  },
  rating: {
    /** The whole row's accessible name: "Rated 4.3 out of 5, 128 reviews". */
    label: (score: string, max: number, reviews: string) => `Rated ${score} out of ${max}, ${reviews}`,
    /** Gets the formatted count and the number, for the plural. */
    reviews: (formatted: string, count: number) => `${formatted} ${count === 1 ? "review" : "reviews"}`,
  },
  ratingInput: {
    /** One word per star, from 1 to 5: the stars alone do not say whether 3 is fine or poor. */
    words: ["Terrible", "Poor", "Okay", "Good", "Excellent"],
    none: "No rating",
    star: (n: number, max: number, word: string) => `${n} out of ${max}, ${word}`,
    /** The read-only row once the rating was sent. */
    summary: (legend: string, n: number, max: number, word: string) => `${legend}: ${n} out of ${max}, ${word}`,
    change: "Change rating",
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
  carousel: {
    /** The region's name when the caller gives none. */
    label: "Images",
    /** What a screen reader calls the region and each slide. */
    roleDescription: "carousel",
    slideRoleDescription: "slide",
    /** A slide's position, and the visible counter past the dots: "3 of 12". */
    position: (n: number, total: number) => `${n} of ${total}`,
    /** A dot's name, and the announcement after every change: "Image 3 of 5". */
    image: (n: number, total: number) => `Image ${n} of ${total}`,
    /** Read when focus lands on the strip of images. */
    keyboardHint: (label: string) => `${label}: use the arrow keys to change images`,
    previous: "Previous image",
    next: "Next image",
    choose: "Choose an image",
    /** The text alternative of an image that came without one: "Images, image 2". */
    fallbackAlt: (label: string, n: number) => `${label}, image ${n}`,
  },
  mapPlaceholder: {
    /** The drawing's accessible name: it says it is not a real map. */
    label: "Illustrative map. A map with the real location will appear here.",
    /** The label always visible on the drawing. */
    caption: "Illustrative map",
  },
  datePicker: {
    /** The format, as an example of what goes in. */
    placeholder: "MM/DD/YYYY",
    incomplete: "The date is incomplete. Use month, day and year, as in 09/17/2026.",
    doesNotExist: (text: string) => `That date doesn't exist: ${text}.`,
    /** Gets the first accepted date, already in MM/DD/YYYY. */
    tooEarly: (date: string) => `Choose ${date} or later.`,
    /** Gets the last accepted date, already in MM/DD/YYYY. */
    tooLate: (date: string) => `Choose ${date} or earlier.`,
    openCalendar: (label: string) => `Open the calendar for ${label}`,
    calendar: (label: string) => `Calendar for ${label}`,
    today: "Today",
    /** The calendar's title: "September 2026". */
    monthTitle: (month: string, year: number) => `${month} ${year}`,
    /** A day button: "Today, Thursday, September 17, 2026, selected". Gets the full date. */
    day: (date: string, isToday: boolean, isSelected: boolean) =>
      `${isToday ? "Today, " : ""}${date}${isSelected ? ", selected" : ""}`,
    previousMonth: "Previous month",
    nextMonth: "Next month",
    previousYear: "Previous year",
    nextYear: "Next year",
    previousYears: "Previous years",
    nextYears: "Next years",
    /** The title button in the days view; gets the title it shows. */
    chooseMonth: (title: string) => `Choose month and year. ${title}`,
    /** The title button in the months view; gets the year it shows. */
    chooseYear: (title: string) => `Choose year. ${title}`,
    monthsOf: (year: number) => `Months of ${year}`,
    yearsOf: (range: string) => `Years ${range}`,
  },
  timePicker: {
    /** The shape of a 12-hour time, short enough for a narrow column. */
    placeholder: "h:mm AM",
  },
  dateTimePicker: {
    date: "Date",
    time: "Time",
  },
} as const;
