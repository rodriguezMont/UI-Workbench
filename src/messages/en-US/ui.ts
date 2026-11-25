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
  fileCheck: {
    /** The `image/*` family, in a list of formats: "PDF or image". */
    anyImage: "image",
    notAccepted: (name: string, formats: string) => `“${name}” isn't an accepted format. Upload ${formats}.`,
    empty: (name: string) => `“${name}” is empty.`,
    tooLarge: (name: string, size: string, limit: string) => `“${name}” is ${size}, and the limit is ${limit}.`,
  },
  fileUpload: {
    files: (count: number) => (count === 1 ? "1 file" : `${count} files`),
    /** Only where there is a fine pointer: on a phone it would promise a gesture that does not exist. */
    dragHere: "Drag files here, or",
    dropToUpload: "Drop to upload",
    chooseOne: "Choose file",
    chooseMany: "Choose files",
    /** The rules under the button: "PDF or PNG, up to 10 MB · up to 5 files". */
    rules: (formats: string, size: string) => `${formats}, up to ${size}`,
    upToFiles: (files: string) => ` · up to ${files}`,
    full: (files: string) => `Limit of ${files}. Remove one to upload another.`,
    duplicate: (name: string) => `“${name}” is already on the list.`,
    overLimit: (name: string, files: string) => `“${name}” was left out: the limit is ${files}.`,
    list: "Files",
    uploaded: (name: string) => `${name} uploaded.`,
    failed: (name: string) => `Uploading ${name} failed.`,
    uploading: (percent: number) => `Uploading, ${percent}%`,
    done: "Uploaded",
    notUploaded: "Not uploaded",
    retry: (name: string) => `Try uploading ${name} again`,
    cancel: (name: string) => `Cancel uploading ${name}`,
    remove: (name: string) => `Remove ${name}`,
    advice: "Check your connection and try again.",
    progress: (name: string) => `Uploading ${name}`,
    failedAt: (percent: number) => `Failed at ${percent}%`,
  },
  photoUpload: {
    choose: "Choose image",
    replace: "Replace image",
    remove: "Remove",
  },
  imageFormats: {
    cover: "Cover",
    logo: "Logo",
    photo: "Photo",
    notAnImage: (formats: string) => `This file isn't an image that can be used. Choose ${formats}.`,
    tooLarge: (size: string, limit: string) => `The image is ${size}, and the limit is ${limit}.`,
  },
  imageCropper: {
    /** Gets the format's name: "Crop cover". */
    title: (format: string) => `Crop ${format.toLowerCase()}`,
    description: "Drag to frame it. Zoom with two fingers, the mouse wheel or the slider.",
    area: (format: string) => `Crop area: ${format.toLowerCase()}. The arrow keys move the image.`,
    zoom: "Zoom",
    rotateLeft: "Rotate left",
    rotateRight: "Rotate right",
    reset: "Reset",
    /** The full accessible name; on phones the visible label drops "crop". */
    apply: "Apply crop",
    applyShort: "Apply",
    applyRest: " crop",
    cropping: "Cropping…",
    failed: (formats: string) => `Couldn't crop this image. Try another one, in ${formats}.`,
    lowResolution: "The image is small for this format and may look blurry.",
    choose: (format: string) => `Choose ${format.toLowerCase()}`,
  },
  profileCover: {
    region: (name: string) => `Cover and logo of ${name}`,
    addCover: "Add cover",
    coverHint: "A wide image across the top of the profile.",
    editCover: "Edit cover",
    replaceCover: "Replace cover",
    removeCover: "Remove cover",
    logoOf: (name: string) => `Logo of ${name}`,
    addLogo: "Add logo",
    editLogo: "Edit logo",
    replaceLogo: "Replace logo",
    removeLogo: "Remove logo",
  },
  photoGallery: {
    count: (count: number, max: number) => `${count} of ${max} photos`,
    instructions: "The first photo is the main one. To reorder, drag by the handle — or focus the handle and use Space and the arrow keys.",
    add: "Add photo",
    full: (max: number) => `Limit of ${max} photos. Remove one to add another.`,
    main: "Main",
    makeMain: "Make main",
    remove: "Remove photo",
    /** A photo's alt text when none was given: "Photo 2 of Kitchen". */
    photoOf: (n: number, label: string) => `Photo ${n} of ${label}`,
    move: (n: number) => `Move photo ${n}`,
    actions: (n: number) => `Actions for photo ${n}`,
    added: (n: number) => `Photo ${n} added.`,
    removed: (n: number, count: number, max: number) => `Photo ${n} removed. ${count} of ${max}.`,
    nowMain: (n: number) => `Photo ${n} is now the main one.`,
    dragInstructions: "To move a photo, press Space. Use the arrow keys to choose the place and Space again to drop it. Escape cancels.",
    pickedUp: (n: number) => `Photo ${n} picked up. Use the arrow keys to move it.`,
    over: (n: number, position: number) => `Photo ${n} is over position ${position}.`,
    outside: (n: number) => `Photo ${n} is outside the gallery.`,
    dropped: (position: number) => `Photo dropped at position ${position}.`,
    stayed: (n: number) => `Photo ${n} dropped without moving.`,
    cancelled: (n: number) => `Move cancelled. The photo went back to position ${n}.`,
  },
  card: {
    numberIncomplete: "The number is incomplete. Check the card's digits.",
    numberInvalid: "This card number doesn't check out. Check the digits.",
    expiryIncomplete: "The date is incomplete. Use month and year: 09/28.",
    monthInvalid: "That month doesn't exist. Use 01 to 12.",
    /** Gets the printed date, as MM/YY. */
    expired: (date: string) => `This card expired in ${date}.`,
    cvvLength: (digits: number) => `The security code has ${digits} digits.`,
    nameIncomplete: "Write the name as printed on the card, in full.",
  },
  cardForm: {
    legend: "Credit card",
    number: "Card number",
    numberPlaceholder: "0000 0000 0000 0000",
    name: "Name on card",
    namePlaceholder: "JANE Q DOE",
    nameHint: "As printed, without abbreviations.",
    expiry: "Expiration date",
    expiryPlaceholder: "MM/YY",
    cvv: "Security code",
    cvvFront: "The 4 digits on the front.",
    cvvBack: "The 3 digits on the back.",
  },
} as const;
