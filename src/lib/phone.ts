import {
  AsYouType,
  Metadata,
  getCountries,
  getCountryCallingCode,
  getExampleNumber,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  validatePhoneNumberLength,
  type CountryCode,
} from "libphonenumber-js/max";
import examples from "libphonenumber-js/mobile/examples";

import { locale, messages } from "@/messages";

import type { MaskSpec } from "./mask";
import { compareText } from "./normalize";

/**
 * A phone number with a country — format, check, and the submitted value.
 *
 * **`max` metadata, not the library's default `min`.** `min` only checks the
 * length: it would accept an area code that does not exist. `max` checks the
 * digits (~145 kB). `mobile` would be smaller but would refuse landlines.
 * **The weight only reaches screens that import this file.**
 *
 * **The submitted value is E.164** (`+12133734253`): one format, any country.
 *
 * Checking here is a courtesy (the mask rule): the server checks again.
 */

export type { CountryCode };

export type Country = { code: CountryCode; callingCode: string; name: string };

/** The country the field starts on. */
export const DEFAULT_COUNTRY: CountryCode = "US";

let list: Country[] | null = null;

/**
 * Every country, **the default first** and the rest by name in the interface
 * language. Names come from `Intl`; the list only renders with the select open.
 */
export function countries(): Country[] {
  if (list) return list;
  const names = new Intl.DisplayNames([locale], { type: "region" });
  const all = getCountries().map((code) => ({
    code,
    callingCode: getCountryCallingCode(code),
    name: names.of(code) ?? code,
  }));
  const first = all.filter((c) => c.code === DEFAULT_COUNTRY);
  const rest = all.filter((c) => c.code !== DEFAULT_COUNTRY).sort((a, b) => compareText(a.name, b.name));
  list = [...first, ...rest];
  return list;
}

const specs = new Map<CountryCode, MaskSpec>();

/**
 * The country's mask: digits only, up to the longest length the country uses,
 * without the country's own prefix, drawn by `AsYouType` — "(213) 373-4253" in
 * the US, "912 345 678" in Portugal. The caret is the shared engine's (`mask.ts`).
 */
export function phoneSpec(country: CountryCode): MaskSpec {
  const ready = specs.get(country);
  if (ready) return ready;
  const meta = new Metadata();
  meta.selectNumberingPlan(country);
  const max = Math.max(...(meta.numberingPlan?.possibleLengths() ?? [15]));
  const spec: MaskSpec = {
    max,
    accepts: (ch) => /^[0-9]$/.test(ch),
    format: (digits) => (digits ? new AsYouType(country).input(digits) : ""),
    // A whole number of the same country, however it arrives, loses the
    // prefix. Only pasting switches the country — the mask cannot.
    preprocess: (raw) => {
      const read = readPasted(raw, country);
      return read && read.country === country ? read.national : raw;
    },
  };
  specs.set(country, spec);
  return spec;
}

/** An example number in the country's format — the field's placeholder. */
export function examplePhone(country: CountryCode): string {
  return getExampleNumber(country, examples)?.formatNational() ?? "";
}

/**
 * The error sentence, or `null`. Empty is not an error here. The US gets the
 * advice that actually solves it: the area code is the usual mistake length
 * alone does not catch.
 */
export function checkPhone(national: string, country: CountryCode): string | null {
  const m = messages.ui.phone;
  const digits = national.replace(/\D/g, "");
  if (!digits) return null;
  const example = examplePhone(country);
  switch (validatePhoneNumberLength(digits, country)) {
    case "TOO_SHORT":
    case "NOT_A_NUMBER":
      return m.incomplete(example);
    case "TOO_LONG":
      return m.tooLong(example);
    case "INVALID_LENGTH":
      return m.invalidLength(example);
  }
  if (isValidPhoneNumber(digits, country)) return null;
  return country === "US" ? m.notInUS : m.notInCountry(getCountryCallingCode(country));
}

/** The submitted value: E.164 of a valid number, or empty. */
export function toE164(national: string, country: CountryCode): string {
  const digits = national.replace(/\D/g, "");
  if (!digits || !isValidPhoneNumber(digits, country)) return "";
  return parsePhoneNumberFromString(digits, country)?.number ?? "";
}

/**
 * **A number pasted with its country code** — "+351 912 345 678", "0044 20…" —
 * switches the country and keeps only the national number. Too many digits
 * without a "+" (a trunk prefix such as "1" in the US) also go through the
 * library, which knows each country's prefix. Otherwise `null`: the text goes
 * to the mask as it came.
 */
export function readPasted(raw: string, country: CountryCode): { country: CountryCode; national: string } | null {
  const text = raw.trim();
  const digits = text.replace(/\D/g, "");
  const international = text.startsWith("+") || digits.startsWith("00");
  if (!international && digits.length <= phoneSpec(country).max) return null;

  const number = international
    ? parsePhoneNumberFromString(`+${digits.replace(/^00/, "")}`)
    : parsePhoneNumberFromString(digits, country);
  if (!number) return null;
  const target =
    number.country ??
    (getCountryCallingCode(country) === number.countryCallingCode
      ? country
      : countries().find((c) => c.callingCode === number.countryCallingCode)?.code);
  return target ? { country: target, national: String(number.nationalNumber) } : null;
}
