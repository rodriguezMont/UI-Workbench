import { createContext, useContext, useEffect, useState } from "react";

import { toast } from "@/components/ui/toast";
import { messages } from "@/messages";

import { parseLedger, type Ledger } from "./approvals";
import committed from "./approvals.json";

/**
 * The approval ledger, shared by every page of the workbench.
 *
 * - **In development** it starts from the committed file and then reads the
 *   current one from the dev server; the seal writes through it
 *   (`approvals-plugin.ts`) and the response is the new ledger.
 * - **In a production build** it is the committed file, read-only: there is no
 *   endpoint to write to, and the seal shows the state without a button.
 */

const ENDPOINT = "/__workbench/approvals";

type LedgerState = {
  ledger: Ledger;
  /** Whether approving is possible here: only under the dev server. */
  editable: boolean;
  setApproved: (id: string, approved: boolean) => Promise<void>;
};

const LedgerContext = createContext<LedgerState>({
  ledger: parseLedger(committed),
  editable: false,
  setApproved: async () => {},
});

export function LedgerProvider({ children }: { children: React.ReactNode }) {
  const editable = import.meta.env.DEV;
  const [ledger, setLedger] = useState<Ledger>(() => parseLedger(committed));

  useEffect(() => {
    if (!editable) return;
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
  }, [editable]);

  async function setApproved(id: string, approved: boolean) {
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

  return <LedgerContext value={{ ledger, editable, setApproved }}>{children}</LedgerContext>;
}

export function useLedger(): LedgerState {
  return useContext(LedgerContext);
}
