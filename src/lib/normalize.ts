import { locale } from "@/messages";

/**
 * Text the way search compares it: without accents and case — "sao paulo"
 * finds "São Paulo". One place, because the select and the checkbox list
 * search the same way, and two copies would drift at the first fix.
 */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

/**
 * Alphabetical order in the interface's language. Without the locale,
 * `localeCompare` uses the environment's, and a server in another language
 * would sort accented names differently from the browser.
 */
export function compareText(a: string, b: string, options?: Intl.CollatorOptions): number {
  return a.localeCompare(b, locale, options);
}
