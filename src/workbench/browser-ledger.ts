/**
 * Approvals on the published workbench, kept in the visitor's browser.
 *
 * The deployed build has no dev server to write `approvals.json`, and a shared
 * ledger anyone on the internet could edit would mean nothing. So each visitor
 * reviews on their own copy: it starts as the project's committed ledger,
 * every click is saved in `localStorage` under one key, and a reset drops that
 * key and shows the project's ledger again.
 *
 * Nothing leaves the browser — it is not a cookie, the server never sees it —
 * and only piece ids with a day are stored, the same shape as the file.
 * Storage that is blocked or full (private browsing, a locked-down browser)
 * never breaks the seal: the click still shows, it just does not survive a
 * reload.
 */
import { toIsoDate } from "@/lib/iso-date";

import { applyApproval, parseLedger, sortLedger, type Ledger } from "./approvals";
import { findComponent } from "./registry";

export const APPROVALS_STORAGE_KEY = "ui-workbench-approvals";

/** The part of `Storage` this file uses, so tests can hand in a plain object. */
export type KeyValueStore = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** The browser's `localStorage`, or null where touching it throws. */
export function browserStorage(): KeyValueStore | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/** The visitor's ledger: what they saved, or the project's when they saved nothing. */
export function loadBrowserLedger(store: KeyValueStore | null, project: Ledger): Ledger {
  try {
    const raw = store?.getItem(APPROVALS_STORAGE_KEY);
    return raw == null ? project : parseLedger(JSON.parse(raw));
  } catch {
    return project;
  }
}

/**
 * One click on the seal. A piece the registry does not know, or one without
 * a shape yet, is left as it is — the same rule the dev server enforces.
 */
export function approveInBrowser(
  store: KeyValueStore | null,
  ledger: Ledger,
  id: string,
  approved: boolean,
  today: string,
): Ledger {
  const entry = findComponent(id);
  if (!entry || entry.built === false) return ledger;

  const next = applyApproval(ledger, id, approved, today);
  try {
    store?.setItem(APPROVALS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* blocked or full: the click still shows, it just is not remembered */
  }
  return next;
}

/** Forgets the visitor's review and returns the project's ledger. */
export function resetBrowserLedger(store: KeyValueStore | null, project: Ledger): Ledger {
  try {
    store?.removeItem(APPROVALS_STORAGE_KEY);
  } catch {
    /* nothing stored, or nothing to remove */
  }
  return project;
}

/** Whether two ledgers say the same thing, whatever their key order. */
export function sameLedger(a: Ledger, b: Ledger): boolean {
  return JSON.stringify(sortLedger(a)) === JSON.stringify(sortLedger(b));
}

/** Today in the visitor's own calendar, as `YYYY-MM-DD`. */
export function localToday(now: Date = new Date()): string {
  return toIsoDate({ y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() });
}
