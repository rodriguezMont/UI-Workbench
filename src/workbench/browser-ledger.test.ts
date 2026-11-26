import { describe, expect, it } from "vitest";

import { applyApproval } from "./approvals";
import {
  APPROVALS_STORAGE_KEY,
  approveInBrowser,
  loadBrowserLedger,
  localToday,
  resetBrowserLedger,
  sameLedger,
  type KeyValueStore,
} from "./browser-ledger";
import { COMPONENTS } from "./registry";

/** A Map behind the Storage methods the ledger uses. */
function memoryStore(initial?: string): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  if (initial !== undefined) data.set(APPROVALS_STORAGE_KEY, initial);
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

/** A store whose every call throws, like blocked storage. */
const blocked: KeyValueStore = {
  getItem: () => {
    throw new Error("blocked");
  },
  setItem: () => {
    throw new Error("blocked");
  },
  removeItem: () => {
    throw new Error("blocked");
  },
};

const built = COMPONENTS.filter((c) => c.built !== false);
const [first, second] = built as [(typeof built)[number], (typeof built)[number]];
const PROJECT = { [first.id]: { on: "2026-11-26" } };

describe("the browser ledger", () => {
  it("starts from the project's ledger when the visitor saved nothing", () => {
    expect(loadBrowserLedger(memoryStore(), PROJECT)).toEqual(PROJECT);
    expect(loadBrowserLedger(null, PROJECT)).toEqual(PROJECT);
  });

  it("keeps a click across a reload", () => {
    const store = memoryStore();
    const after = approveInBrowser(store, PROJECT, second.id, true, "2026-11-27");
    expect(after[second.id]).toEqual({ on: "2026-11-27" });
    expect(loadBrowserLedger(store, PROJECT)).toEqual(after);
  });

  it("remembers an undo too, even of a project approval", () => {
    const store = memoryStore();
    const after = approveInBrowser(store, PROJECT, first.id, false, "2026-11-27");
    expect(after).toEqual({});
    expect(loadBrowserLedger(store, PROJECT)).toEqual({});
  });

  it("ignores ids the registry does not know", () => {
    const store = memoryStore();
    expect(approveInBrowser(store, PROJECT, "no-such-piece", true, "2026-11-27")).toBe(PROJECT);
    expect(store.data.size).toBe(0);
  });

  it("reads a broken or tampered value as the project's ledger, or drops the bad entries", () => {
    expect(loadBrowserLedger(memoryStore("{not json"), PROJECT)).toEqual(PROJECT);
    expect(loadBrowserLedger(memoryStore(JSON.stringify({ [second.id]: { on: "yesterday" } })), PROJECT)).toEqual({});
  });

  it("reset forgets the visitor's review and returns the project's", () => {
    const store = memoryStore();
    approveInBrowser(store, PROJECT, second.id, true, "2026-11-27");
    expect(resetBrowserLedger(store, PROJECT)).toBe(PROJECT);
    expect(store.data.has(APPROVALS_STORAGE_KEY)).toBe(false);
  });

  it("never throws when storage is blocked: the click still applies", () => {
    expect(loadBrowserLedger(blocked, PROJECT)).toEqual(PROJECT);
    expect(approveInBrowser(blocked, PROJECT, second.id, true, "2026-11-27")).toEqual(
      applyApproval(PROJECT, second.id, true, "2026-11-27"),
    );
    expect(resetBrowserLedger(blocked, PROJECT)).toBe(PROJECT);
  });

  it("compares ledgers by content, not key order", () => {
    const a = { [first.id]: { on: "2026-11-26" }, [second.id]: { on: "2026-11-27" } };
    const b = { [second.id]: { on: "2026-11-27" }, [first.id]: { on: "2026-11-26" } };
    expect(sameLedger(a, b)).toBe(true);
    expect(sameLedger(a, PROJECT)).toBe(false);
  });

  it("dates a click in the visitor's own calendar", () => {
    expect(localToday(new Date(2026, 0, 5, 23, 30))).toBe("2026-01-05");
  });
});
