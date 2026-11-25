/**
 * The only place that reads and writes `approvals.json` on disk. It runs in
 * the dev server (see `approvals-plugin.ts`), never in the browser and never
 * in a production build — the deployed workbench is read-only by construction.
 *
 * **The id never becomes part of a path.** The file is one fixed file; the id
 * is a key in an object, and only after it is found in the registry. There is
 * no path concatenation for a traversal to attack.
 *
 * Imports are relative on purpose: the Vite config loads this file, and the
 * `@/` alias does not exist while the config itself is being loaded.
 */
import { readFileSync, writeFileSync } from "node:fs";

import { parseLedger, sortLedger, type Ledger } from "./approvals";
import { findComponent } from "./registry";

export class ApprovalError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type RequestHeaders = Record<string, string | string[] | undefined>;

const header = (headers: RequestHeaders, name: string) => {
  const value = headers[name];
  return Array.isArray(value) ? value[0] : value;
};

/**
 * **The request must come from the workbench itself.**
 *
 * Without this, any page open in the same browser could write here while the
 * dev server runs: a cross-site form post is a "simple" request with no
 * preflight, and this endpoint has no session cookie for `SameSite` to hold
 * back. Piece ids are public literals, so a hostile page could stamp every
 * one, and forged seals would travel into the next commit.
 *
 * `Sec-Fetch-Site` is the most precise signal — the browser classifies the
 * origin itself. Without it, `Origin` must match the host; no `Origin` at all
 * means a client that is not a browser, and those do not approve anything.
 */
function assertSameOrigin(headers: RequestHeaders): void {
  const site = header(headers, "sec-fetch-site");
  if (site) {
    if (site !== "same-origin") throw new ApprovalError(403, "Cross-site request refused.");
    return;
  }
  const origin = header(headers, "origin");
  const host = header(headers, "host");
  if (!origin || !host || new URL(origin).host !== host) {
    throw new ApprovalError(403, "Cross-site request refused.");
  }
}

/**
 * **Approving is a human act, and an automated browser is not human.** The
 * layout ruler clicks hundreds of controls in a headless browser; a check that
 * failed halfway once left the page in another state, and a later click landed
 * on a seal. This is not a defense against forgery — whoever forges changes
 * the header, and for that the pull request diff is what counts. **It is a
 * defense against the accident**, which is what happens and repeats.
 */
function assertNotAutomated(headers: RequestHeaders): void {
  const agent = header(headers, "user-agent") ?? "";
  if (/HeadlessChrome|Playwright|Puppeteer/i.test(agent)) {
    throw new ApprovalError(403, "Approving is a human act; an automated browser does not approve.");
  }
}

export function checkRequest(headers: RequestHeaders): void {
  assertSameOrigin(headers);
  assertNotAutomated(headers);
}

/**
 * **A missing file and an unreadable file are not the same thing**, and
 * confusing them destroys work. Missing is the legitimate starting point:
 * nothing approved. A file that exists and does not parse — an interrupted
 * write, a stray comma, a merge conflict marker — returned as `{}` would show
 * every piece as "in review", and the next click would write a file with ONE
 * approval over twenty. So reading tells the two apart, and writing refuses
 * in the second case.
 */
export function readLedgerFile(path: string): Ledger {
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") return {};
    throw new ApprovalError(409, `Couldn't read ${path}.`);
  }
  try {
    return parseLedger(JSON.parse(raw));
  } catch {
    throw new ApprovalError(409, `${path} exists but is not valid JSON. Fix it before approving.`);
  }
}

/** For display, a broken ledger never takes the workbench down: it reads as empty. */
export function readLedgerForDisplay(path: string): Ledger {
  try {
    return readLedgerFile(path);
  } catch {
    return {};
  }
}

/**
 * Writes with **sorted keys and one line per piece**, for the diff — the
 * pull request diff is what keeps approval a human act, and an unstable order
 * would turn every click into a whole-file change.
 */
export function setApproval(path: string, id: string, approved: boolean, today: string): Ledger {
  const entry = findComponent(id);
  if (!entry) throw new ApprovalError(400, "Piece not in the registry.");
  if (entry.built === false) throw new ApprovalError(400, "A piece without a shape cannot be approved.");

  // `readLedgerFile`, not `readLedgerForDisplay`: here the error must surface.
  // Writing over a ledger that could not be read is the one way this screen
  // could destroy work.
  const ledger = readLedgerFile(path);

  if (approved) ledger[id] = { on: today };
  else delete ledger[id];

  const sorted = sortLedger(ledger);
  writeFileSync(path, `${JSON.stringify(sorted, null, 2)}\n`, "utf8");
  return sorted;
}
