/**
 * The workbench seal: which pieces have passed review in the browser.
 *
 * **One source of logic.** This file is pure — no disk, no environment —
 * because the pages, the map and the dev-server writer all ask it the same
 * question. Disk access lives in `approvals-store.ts`.
 *
 * **The state is not a field, it is derived from two facts:** the piece has a
 * shape (`built`, from the registry) and someone approved it
 * (`approvals.json`).
 */
import { messages } from "../messages";

import { COMPONENTS, type ComponentEntry, type SectionId } from "./registry";

/**
 * The content of `approvals.json`: piece id → the day it was approved.
 *
 * The date is `YYYY-MM-DD` and lets the screen say *when*. Nobody's name is
 * stored: the workbench is local, and recording an author here would invent an
 * identity that does not exist.
 */
export type Ledger = Record<string, { on: string }>;

/**
 * Three states, and only two of them count.
 *
 * `to-build` is a piece on the map without a shape. It shows, so what is
 * missing is not hidden, but it stays **out of the counts**: what is missing
 * to build and what is missing to review are two lists, and adding them up
 * answers neither question.
 */
export type PieceState = "approved" | "in-review" | "to-build";

const s = messages.workbench.status;

export const STATE_LABEL: Record<PieceState, string> = {
  approved: s.approved.label,
  "in-review": s.inReview.label,
  "to-build": s.toBuild.label,
};

export const STATE_HINT: Record<PieceState, string> = {
  approved: s.approved.hint,
  "in-review": s.inReview.hint,
  "to-build": s.toBuild.hint,
};

/**
 * Reads raw JSON without trusting it. The file is edited by hand as easily as
 * the screen writes it, and a half-saved ledger must not take down the
 * workbench — the very tool one would use to investigate. Malformed input
 * becomes "not approved", never an exception.
 */
export function parseLedger(raw: unknown): Ledger {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return {};

  const out: Ledger = {};
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    if (value === null || typeof value !== "object") continue;
    const { on } = value as { on?: unknown };
    if (typeof on !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(on)) continue;
    out[id] = { on };
  }
  return out;
}

/**
 * An approval for an id the registry no longer knows is **ignored, not
 * deleted**: the piece may have been renamed on a branch that comes back. It
 * neither counts nor shows, and leaves the file the day someone edits it.
 */
export function stateOf(entry: ComponentEntry, ledger: Ledger): PieceState {
  if (entry.built === false) return "to-build";
  return ledger[entry.id] ? "approved" : "in-review";
}

export function approvedOn(entry: ComponentEntry, ledger: Ledger): string | undefined {
  return entry.built === false ? undefined : ledger[entry.id]?.on;
}

export type Tally = {
  /** Reviewed. */
  approved: number;
  /** Built and not yet reviewed. */
  pending: number;
  /** No shape yet — out of both counts above, on purpose. */
  toBuild: number;
};

export function tally(entries: readonly ComponentEntry[], ledger: Ledger): Tally {
  const out: Tally = { approved: 0, pending: 0, toBuild: 0 };
  for (const entry of entries) {
    const state = stateOf(entry, ledger);
    if (state === "approved") out.approved += 1;
    else if (state === "in-review") out.pending += 1;
    else out.toBuild += 1;
  }
  return out;
}

export function tallyOfSection(section: SectionId, ledger: Ledger): Tally {
  return tally(
    COMPONENTS.filter((c) => c.section === section),
    ledger,
  );
}

export function tallyOfAll(ledger: Ledger): Tally {
  return tally(COMPONENTS, ledger);
}

/** The ledger as written to disk: sorted keys, so every change is one line. */
export function sortLedger(ledger: Ledger): Ledger {
  return Object.fromEntries(Object.entries(ledger).sort(([a], [b]) => a.localeCompare(b)));
}
