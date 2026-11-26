import { createContext, useContext, useEffect, useState } from "react";

import { toast } from "@/components/ui/toast";
import { messages } from "@/messages";

import { parseLedger, type Ledger } from "./approvals";
import committed from "./approvals.json";
import {
  approveInBrowser,
  browserStorage,
  loadBrowserLedger,
  localToday,
  resetBrowserLedger,
  sameLedger,
} from "./browser-ledger";

/**
 * The approval ledger, shared by every page of the workbench. The seal works
 * in both places; what changes is where a click is kept.
 *
 * - **In development** (`"file"`) it starts from the committed file and then
 *   reads the current one from the dev server; the seal writes through it
 *   (`approvals-plugin.ts`) and the response is the new ledger. This is how
 *   the project's own approvals are made, and they are committed.
 * - **In a production build** (`"browser"`) there is no endpoint: each visitor
 *   reviews on their own copy, kept in their browser (`browser-ledger.ts`),
 *   starting from the committed file, and can reset to it.
 */

const ENDPOINT = "/__workbench/approvals";

const PROJECT: Ledger = parseLedger(committed);

type LedgerState = {
  ledger: Ledger;
  /** Where a click is kept: the project's file, or this visitor's browser. */
  savedIn: "file" | "browser";
  /** In the browser: whether this visitor's review differs from the project's. */
  changed: boolean;
  setApproved: (id: string, approved: boolean) => Promise<void>;
  /** In the browser: drop this visitor's review and show the project's ledger. */
  resetToProject: () => void;
};

const LedgerContext = createContext<LedgerState>({
  ledger: PROJECT,
  savedIn: "browser",
  changed: false,
  setApproved: async () => {},
  resetToProject: () => {},
});

export function LedgerProvider({ children }: { children: React.ReactNode }) {
  const savedIn = import.meta.env.DEV ? "file" : "browser";
  const [ledger, setLedger] = useState<Ledger>(() =>
    savedIn === "browser" ? loadBrowserLedger(browserStorage(), PROJECT) : PROJECT,
  );

  useEffect(() => {
    if (savedIn !== "file") return;
    let current = true;
    fetch(ENDPOINT)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: unknown) => {
        if (current && data) setLedger(parseLedger(data));
      })
      .catch(() => {
        /* without the endpoint, the committed ledger stays on screen */
      });
    return () => {
      current = false;
    };
  }, [savedIn]);

  async function setApproved(id: string, approved: boolean) {
    if (savedIn === "browser") {
      setLedger((now) => approveInBrowser(browserStorage(), now, id, approved, localToday()));
      return;
    }
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, approved }),
      });
      if (!response.ok) throw new Error(String(response.status));
      setLedger(parseLedger(await response.json()));
    } catch {
      toast.error(messages.workbench.seal.failed);
    }
  }

  function resetToProject() {
    setLedger(resetBrowserLedger(browserStorage(), PROJECT));
  }

  const changed = savedIn === "browser" && !sameLedger(ledger, PROJECT);

  return (
    <LedgerContext value={{ ledger, savedIn, changed, setApproved, resetToProject }}>{children}</LedgerContext>
  );
}

export function useLedger(): LedgerState {
  return useContext(LedgerContext);
}
