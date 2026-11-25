/**
 * The character ceiling of every free-text field.
 *
 * **Every field has a ceiling.** The caller may pass its own `maxLength`;
 * whoever does not gets the one for the input type, and never goes without.
 *
 * **In the browser this is a courtesy, not protection**: a hand-made request
 * ignores `maxLength`. That is why the numbers live here, outside any
 * component — a server layer can import the same ones, and the rule stays one.
 */
export const TEXT_LIMITS = {
  /** Names, titles, single-line text. */
  text: 150,
  /** A search is an intent, not prose. */
  search: 100,
  /** The maximum email address length (RFC 5321). */
  email: 254,
  /** The practical URL ceiling across browsers. */
  url: 2048,
  /** A phone number with country code, formatted. */
  tel: 20,
  /** Long enough for a passphrase, short enough not to become a payload. */
  password: 128,
  /** A text area without its own limit. */
  textarea: 2000,
} as const;

/**
 * Length the way a database counts it (`char_length`): in characters, not in
 * JavaScript's UTF-16 units — an emoji counts 1, not 2. If the form accepts
 * what the database refuses, the whole request fails later.
 */
export const charCount = (s: string) => [...s].length;

type TextInputType = Exclude<keyof typeof TEXT_LIMITS, "textarea">;

function isFreeText(type: string): type is TextInputType {
  return type in TEXT_LIMITS && type !== "textarea";
}

/**
 * The default ceiling for an `input` by its `type`. Types that are not free
 * text — date, time, number — have no `maxLength` in the browser and return
 * `undefined`.
 */
export function defaultMaxLength(type: string = "text"): number | undefined {
  return isFreeText(type) ? TEXT_LIMITS[type] : undefined;
}
