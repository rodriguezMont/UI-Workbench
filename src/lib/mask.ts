import { locale } from "@/messages";

/**
 * Typing masks: ZIP code, phone, date, currency and whole numbers (en-US).
 *
 * **A mask is a typing courtesy, never validation.** It tidies what the
 * person types while they type; whether the value exists, and how it is
 * stored, is the server's call. Anyone can bypass the browser.
 */

export type MaskKind = "zip" | "phone" | "date" | "currency" | "integer";

/**
 * The shape of a mask. **Exported for formats that depend on data** — each
 * country's phone (`phone.ts`) — which do not fit a fixed list.
 */
export type MaskSpec = {
  /** How many significant characters fit. */
  max: number;
  /**
   * Is the character at position `i` (0-based) accepted, after `before` —
   * the significant characters already kept? It arrives upper-cased.
   */
  accepts: (ch: string, i: number, before: string) => boolean;
  /** Turns the significant characters into displayed text. Partial while typing. */
  format: (significant: string) => string;
  /**
   * Leading zeros do not count. Numbers only: "007" is 7, and without this the
   * zero the formatting itself adds ("0.05") would become a digit on the next key.
   */
  noLeadingZeros?: boolean;
  /**
   * Preparing text that arrives whole — pasted, dropped, autofilled. The US
   * phone below strips the country code; a format from elsewhere brings its own.
   */
  preprocess?: (raw: string) => string;
};

const DIGIT = /^[0-9]$/;

/** The locale's own separators: "," and "." in en-US. */
const parts = new Intl.NumberFormat(locale).formatToParts(1234.5);
const GROUP = parts.find((p) => p.type === "group")?.value ?? ",";
const DECIMAL = parts.find((p) => p.type === "decimal")?.value ?? ".";

/** "1234567" → "1,234,567". */
function grouped(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, GROUP);
}

/** Inserts separators before the given positions, only as far as there is text. */
function withSeparators(significant: string, cuts: [number, string][]): string {
  let out = "";
  for (let i = 0; i < significant.length; i++) {
    const cut = cuts.find(([pos]) => pos === i);
    if (cut) out += cut[1];
    out += significant[i];
  }
  return out;
}

/**
 * One digit of MM/DD/YYYY, given the digits before it: months 01–12, days
 * 01–31, years 1000–2999. Each position only takes a digit that can still
 * lead to a real date.
 */
function acceptsDateDigit(ch: string, i: number, before: string): boolean {
  if (!DIGIT.test(ch)) return false;
  const d = Number(ch);
  switch (i) {
    case 0: // month, tens
      return d <= 1;
    case 1: // month, units: 01–09 or 10–12
      return before[0] === "0" ? d >= 1 : d <= 2;
    case 2: // day, tens
      return d <= 3;
    case 3: // day, units: 01–09, 10–29, 30–31
      return before[2] === "0" ? d >= 1 : before[2] === "3" ? d <= 1 : true;
    case 4: // year, thousands
      return d === 1 || d === 2;
    default:
      return true;
  }
}

const SPECS: Record<MaskKind, MaskSpec> = {
  // 12345. ZIP+4 is left out on purpose: forms ask for five digits, and the
  // four extra ones looked like a phone number to whoever typed them.
  zip: {
    max: 5,
    accepts: (ch) => DIGIT.test(ch),
    format: (sig) => sig,
  },
  // (213) 373-4253 — a national US number: area code, exchange, line.
  phone: {
    max: 10,
    accepts: (ch) => DIGIT.test(ch),
    format: (sig) => {
      if (sig.length === 0) return "";
      if (sig.length <= 3) return `(${sig}`;
      const area = sig.slice(0, 3);
      const rest = sig.slice(3);
      return rest.length > 3 ? `(${area}) ${rest.slice(0, 3)}-${rest.slice(3)}` : `(${area}) ${rest}`;
    },
  },
  // MM/DD/YYYY. The mask refuses what can never be a date as it is typed —
  // month 13, day 32, year 0999 — so "65/15/6155" cannot appear. Whether a
  // given day exists in its month (02/30) is the date check's, on leaving.
  date: {
    max: 8,
    accepts: acceptsDateDigit,
    format: (sig) =>
      withSeparators(sig, [
        [2, "/"],
        [4, "/"],
      ]),
  },
  // 1,234.56 — digits enter from the right, like a card terminal: typing 1, 8,
  // 0, 0, 0 gives 180.00. No decimal point to hunt for on a phone keyboard.
  // The "$" is not part of the mask: it is the field's prefix.
  currency: {
    max: 11,
    accepts: (ch) => DIGIT.test(ch),
    noLeadingZeros: true,
    format: (sig) => {
      if (sig.length === 0) return "";
      const full = sig.padStart(3, "0");
      return `${grouped(full.slice(0, -2))}${DECIMAL}${full.slice(-2)}`;
    },
  },
  // 1,500 — a whole quantity: miles, seats, years.
  integer: {
    max: 9,
    accepts: (ch) => DIGIT.test(ch),
    noLeadingZeros: true,
    format: (sig) => grouped(sig),
  },
};

/** A mask by name, or a ready-made format. */
export type Mask = MaskKind | MaskSpec;

function specOf(mask: Mask): MaskSpec {
  return typeof mask === "string" ? SPECS[mask] : mask;
}

/**
 * The significant characters of a text, in order, up to the maximum. Whatever
 * the position does not accept is dropped.
 */
export function significant(mask: Mask, raw: string): string {
  const { out, onlyZeros } = collect(mask, raw);
  // Leading zeros do not count, but a lone zero is a value: "0 seats", "$0.00"
  // for a free service. Without this, the 0 key would never register.
  return out === "" && onlyZeros ? "0" : out;
}

/**
 * The significant characters without the lone-zero rule. It is what the caret
 * counts: the "0" the formatting adds in "0.05" is not the person's digit.
 */
function collect(mask: Mask, raw: string): { out: string; onlyZeros: boolean } {
  const spec = specOf(mask);
  let out = "";
  let onlyZeros = false;
  for (const ch of raw.toUpperCase()) {
    if (out.length >= spec.max) break;
    if (spec.noLeadingZeros && out === "" && ch === "0") {
      onlyZeros = true;
      continue;
    }
    if (spec.accepts(ch, out.length, out)) out += ch;
  }
  return { out, onlyZeros };
}

/**
 * Text that arrives pasted rather than typed. Only the phone needs it: a
 * number copied from elsewhere often carries the country code ("+1 213 373
 * 4253"). Without this, the "1" would become the first area-code digit and the
 * last digit would fall off — a plausible, wrong number.
 *
 * It only acts when there are too many digits for a national number, which is
 * the sign the prefix is there.
 */
function preprocess(mask: Mask, raw: string): string {
  if (typeof mask !== "string") return mask.preprocess ? mask.preprocess(raw) : raw;
  if (mask !== "phone") return raw;
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  return raw;
}

export function applyMask(mask: Mask, raw: string): string {
  return specOf(mask).format(significant(mask, preprocess(mask, raw)));
}

/**
 * The digits of a US phone number as a server stores them — area code and
 * number, without the +1 — by the same rule as the field, so what the browser
 * formatted and what the server reads never diverge.
 */
export function nationalPhoneDigits(raw: string): string {
  return significant("phone", preprocess("phone", raw));
}

/**
 * Formats and returns where the caret should land.
 *
 * The caret follows **how many significant characters were before it**, not
 * the raw position: inserting a separator ahead cannot push the person past
 * what they are typing.
 *
 * `deleted`: a Backspace or Delete that only removed a separator would change
 * nothing — the mask would put it back and the key would do nothing. In that
 * case it removes the significant character on the side the key points to,
 * which is what the person meant.
 */
export function maskWithCaret(
  mask: Mask,
  raw: string,
  caret: number,
  previous: string,
  deleted?: "backward" | "forward",
): { value: string; caret: number } {
  // Pasted with a prefix: the whole value changes shape and the caret goes to
  // the end. Only while the field is incomplete — in a full field, an extra
  // typed digit could look like a prefix and scramble the number.
  const full = significant(mask, previous).length >= specOf(mask).max;
  const cleaned = full ? raw : preprocess(mask, raw);
  if (cleaned !== raw) {
    const value = applyMask(mask, cleaned);
    return { value, caret: value.length };
  }

  let text = raw;
  let before = significant(mask, raw.slice(0, caret)).length;
  const onlySeparator = significant(mask, raw) === significant(mask, previous);

  /** Removes the `n`-th (1-based) significant character from the raw text. */
  const without = (n: number) => {
    let seen = 0;
    for (let i = 0; i < raw.length; i++) {
      if (collect(mask, raw.slice(0, i + 1)).out.length > seen) {
        seen++;
        if (seen === n) return raw.slice(0, i) + raw.slice(i + 1);
      }
    }
    return raw;
  };

  if (deleted === "backward" && onlySeparator && before > 0) {
    text = without(before);
    before -= 1;
  } else if (deleted === "forward" && onlySeparator) {
    // The caret stays; the first significant character after it goes.
    text = without(before + 1);
  }

  // Raw formatting, without `preprocess`: a pasted prefix was handled above,
  // and applying it again here would undo the full-field guard.
  const value = specOf(mask).format(significant(mask, text));
  let pos = 0;
  let counted = 0;
  while (pos < value.length && counted < before) {
    if (collect(mask, value.slice(0, pos + 1)).out.length > counted) counted++;
    pos++;
  }
  return { value, caret: pos };
}
