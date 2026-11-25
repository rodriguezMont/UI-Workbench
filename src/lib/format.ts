import { locale, messages } from "@/messages";

/**
 * Numbers the way the interface's language writes them. **One source**, so a
 * score never reads "4.3" in one place and "4.30" in another, and a count is
 * grouped the same way everywhere.
 *
 * The formatters follow `locale` from the messages module; the words around a
 * number ("K+", "reviews") live in the messages, like every other string on
 * screen.
 */

const oneDecimal = new Intl.NumberFormat(locale, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const integer = new Intl.NumberFormat(locale);

/** "4.3" — a score: always one decimal, even when round ("4.0"). */
export function formatOneDecimal(value: number): string {
  return oneDecimal.format(value);
}

/** "1,284" — a count, with grouped thousands. */
export function formatInteger(value: number): string {
  return integer.format(value);
}

/**
 * "69K+" — a count in thousands, **rounded down**, and the "+" says there is
 * more: 69,842 is "69K+", never "70K", which would claim more than there is.
 * Below a thousand, the whole number ("121"): "0K+" says nothing.
 */
export function formatThousandsFloor(value: number): string {
  return value < 1000 ? integer.format(value) : messages.ui.format.thousandsFloor(integer.format(Math.floor(value / 1000)));
}

const percentShort = new Intl.NumberFormat(locale, {
  style: "percent",
  maximumFractionDigits: 0,
});
const percentFine = new Intl.NumberFormat(locale, {
  style: "percent",
  maximumFractionDigits: 1,
});

/**
 * "12%" · "4.5%". Below 10% it keeps one decimal: "0%" for a change of 0.4%
 * would say nothing moved when something did. Takes the ratio (0.12), not
 * the number (12).
 */
export function formatPercent(ratio: number): string {
  return Math.abs(ratio) < 0.1 ? percentFine.format(ratio) : percentShort.format(ratio);
}

/**
 * "60%" · "4%" — always a whole percentage, for a share that was already
 * rounded on purpose (a ranking row, a meter). Takes the ratio (0.6).
 */
export function formatWholePercent(ratio: number): string {
  return percentShort.format(ratio);
}

const dollars = new Intl.NumberFormat(locale, {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** "$12,400" — an amount in whole dollars, for a report column or a total. */
export function formatDollars(value: number): string {
  return dollars.format(value);
}
