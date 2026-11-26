import { messages } from "@/messages";

import type { MaskSpec } from "./mask";

/**
 * Payment card format and checks — **no network, no storage**.
 *
 * **Checking here is a courtesy, like every mask.** The Luhn digit and the
 * expiration date only spare the person a decline caused by a mistyped digit;
 * whether the card exists and has credit is the card issuer's answer.
 * **Nothing here stores, logs or sends the number**, and a card number never
 * belongs in a log — the same rule as a password.
 */

const m = messages.ui.card;

/** Only two groups change the format: American Express has 15 digits and a 4-digit code. */
export type CardBrand = "amex" | "other";

export function cardBrand(digits: string): CardBrand {
  return /^3[47]/.test(digits) ? "amex" : "other";
}

/** How many digits the security code has. */
export function cvvLength(digits: string): number {
  return cardBrand(digits) === "amex" ? 4 : 3;
}

/**
 * The card's check digit (Luhn). It does not say the card exists: it says the
 * number has no wrong digit and no swapped pair of neighbors, which are the
 * two typing mistakes.
 */
export function luhn(digits: string): boolean {
  if (!/^\d{12,19}$/.test(digits)) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
}

/** The digits in groups: `4 4 4 4`, or `4 6 5` for American Express. */
function group(digits: string): string {
  const cuts = cardBrand(digits) === "amex" ? [4, 10] : [4, 8, 12, 16];
  let out = "";
  for (let i = 0; i < digits.length; i++) {
    if (cuts.includes(i)) out += " ";
    out += digits[i];
  }
  return out;
}

const DIGIT = /^[0-9]$/;

/**
 * The number's mask: digits only, in groups, up to the brand's length — 15 for
 * American Express, 16 for the rest. Cards of 17 to 19 digits exist (some
 * debit networks), but a US checkout rarely meets them, and a field that keeps
 * taking digits past 16 looked broken to whoever typed into it.
 */
export const CARD_MASK: MaskSpec = {
  max: 16,
  accepts: (ch, i, before) => DIGIT.test(ch) && i < (cardBrand(before) === "amex" ? 15 : 16),
  format: group,
};

/** The expiration date's mask: `MM/YY`, with a month from 01 to 12. */
export const EXPIRY_MASK: MaskSpec = {
  max: 4,
  accepts: (ch, i, before) => {
    if (!DIGIT.test(ch)) return false;
    if (i === 0) return ch <= "1";
    if (i === 1) return before[0] === "0" ? ch >= "1" : ch <= "2";
    return true;
  },
  format: (sig) => (sig.length > 2 ? `${sig.slice(0, 2)}/${sig.slice(2)}` : sig),
};

const digitsOf = (text: string) => text.replace(/\D/g, "");

/** The number's error sentence, or `null`. Empty is not an error here: `required` covers it. */
export function checkCardNumber(text: string): string | null {
  const digits = digitsOf(text);
  if (!digits) return null;
  // **The length is not tied to 16.** Diners Club issues 14 digits, American
  // Express 15, and some networks go up to 19: demanding 16 would refuse good
  // cards. Below 13 no card exists; from there up, Luhn decides.
  if (digits.length < 13) return m.numberIncomplete;
  if (!luhn(digits)) return m.numberInvalid;
  return null;
}

/**
 * The expiration date. `today` is a parameter because this is a pure function
 * — and because a card expires at the **end** of the printed month: 09/26 is
 * good through September 30, 2026.
 */
export function checkExpiry(text: string, today = new Date()): string | null {
  const digits = digitsOf(text);
  if (!digits) return null;
  if (digits.length < 4) return m.expiryIncomplete;
  const month = Number(digits.slice(0, 2));
  const year = 2000 + Number(digits.slice(2));
  if (month < 1 || month > 12) return m.monthInvalid;
  const expired = year < today.getFullYear() || (year === today.getFullYear() && month < today.getMonth() + 1);
  if (expired) return m.expired(`${digits.slice(0, 2)}/${digits.slice(2)}`);
  return null;
}

/** The security code, whose length changes with the card. */
export function checkCvv(text: string, cardNumber: string): string | null {
  const digits = digitsOf(text);
  if (!digits) return null;
  const expected = cvvLength(digitsOf(cardNumber));
  return digits.length === expected ? null : m.cvvLength(expected);
}

/** The printed name: at least two words, as it reads on the card. */
export function checkCardName(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  return /\s/.test(trimmed) ? null : m.nameIncomplete;
}
