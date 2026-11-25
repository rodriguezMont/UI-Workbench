/**
 * The dev-server endpoint behind the approval seal.
 *
 * `apply: "serve"` means it only exists under `vite` (dev): a production build
 * has no endpoint at all, so the deployed workbench cannot write anything —
 * read-only by construction, not by a flag.
 *
 *   GET  /__workbench/approvals   → the ledger, fresh from disk
 *   POST /__workbench/approvals   → { id, approved } → the updated ledger
 */
import { join } from "node:path";

import type { Plugin } from "vite";

import { ApprovalError, checkRequest, readLedgerForDisplay, setApproval } from "./approvals-store";

export const APPROVALS_ENDPOINT = "/__workbench/approvals";
export const APPROVALS_FILE = "src/workbench/approvals.json";

/** UTC, so the date does not depend on the time zone of whoever opens the file. */
const today = () => new Date().toISOString().slice(0, 10);

export function workbenchApprovals(): Plugin {
  return {
    name: "workbench-approvals",
    apply: "serve",
    configureServer(server) {
      const file = join(server.config.root, APPROVALS_FILE);

      server.middlewares.use(APPROVALS_ENDPOINT, (req, res) => {
        const send = (status: number, body: unknown) => {
          res.statusCode = status;
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Cache-Control", "no-store");
          res.end(JSON.stringify(body));
        };

        if (req.method === "GET") return send(200, readLedgerForDisplay(file));
        if (req.method !== "POST") return send(405, { error: "Method not allowed." });

        let body = "";
        req.on("data", (chunk: Buffer) => {
          body += chunk.toString("utf8");
          // A ledger toggle is a few bytes; anything large is not one.
          if (body.length > 1024) req.destroy();
        });
        req.on("end", () => {
          try {
            checkRequest(req.headers);
            const parsed: unknown = JSON.parse(body || "{}");
            const { id, approved } = (parsed ?? {}) as { id?: unknown; approved?: unknown };
            if (typeof id !== "string" || typeof approved !== "boolean") {
              throw new ApprovalError(400, "Expected { id: string, approved: boolean }.");
            }
            send(200, setApproval(file, id, approved, today()));
          } catch (error) {
            if (error instanceof ApprovalError) return send(error.status, { error: error.message });
            send(400, { error: "Malformed request." });
          }
        });
      });
    },
  };
}
