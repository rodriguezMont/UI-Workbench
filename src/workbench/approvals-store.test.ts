import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ApprovalError, checkRequest, readLedgerForDisplay, setApproval } from "./approvals-store";
import { COMPONENTS } from "./registry";

// A piece still without a shape, if the registry has one left: the store looks
// pieces up in the registry, so it cannot be made up here.
const toBuild = COMPONENTS.find((c) => c.built === false)?.id;

// Every test writes to its own temporary file — never to the real ledger.
let dir = "";
let file = "";

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "ledger-"));
  file = join(dir, "approvals.json");
});

afterEach(() => rmSync(dir, { recursive: true, force: true }));

const statusOf = (fn: () => unknown) => {
  try {
    fn();
  } catch (error) {
    return error instanceof ApprovalError ? error.status : "other";
  }
  return "ok";
};

describe("checkRequest", () => {
  const browser = "Mozilla/5.0 Chrome/140";

  it("accepts a same-origin request from a person's browser", () => {
    expect(statusOf(() => checkRequest({ "sec-fetch-site": "same-origin", "user-agent": browser }))).toBe("ok");
    expect(
      statusOf(() => checkRequest({ origin: "http://localhost:5180", host: "localhost:5180", "user-agent": browser })),
    ).toBe("ok");
  });

  it("refuses cross-site requests and clients that are not browsers", () => {
    expect(statusOf(() => checkRequest({ "sec-fetch-site": "cross-site", "user-agent": browser }))).toBe(403);
    expect(
      statusOf(() => checkRequest({ origin: "https://elsewhere.example", host: "localhost:5180", "user-agent": browser })),
    ).toBe(403);
    expect(statusOf(() => checkRequest({ host: "localhost:5180", "user-agent": "curl/8" }))).toBe(403);
  });

  it("refuses an automated browser even from the same origin", () => {
    expect(
      statusOf(() => checkRequest({ "sec-fetch-site": "same-origin", "user-agent": "Mozilla/5.0 HeadlessChrome/140" })),
    ).toBe(403);
  });
});

describe("setApproval", () => {
  it("starts from a missing file and writes sorted, one line per piece", () => {
    setApproval(file, "tabs", true, "2026-11-25");
    setApproval(file, "badge", true, "2026-11-26");
    expect(readFileSync(file, "utf8")).toBe(
      '{\n  "badge": {\n    "on": "2026-11-26"\n  },\n  "tabs": {\n    "on": "2026-11-25"\n  }\n}\n',
    );
  });

  it("removes an approval when undone", () => {
    setApproval(file, "tabs", true, "2026-11-25");
    expect(setApproval(file, "tabs", false, "2026-11-25")).toEqual({});
  });

  it("refuses ids outside the registry", () => {
    expect(statusOf(() => setApproval(file, "no-such-piece", true, "2026-11-25"))).toBe(400);
  });

  it.runIf(toBuild)("refuses pieces without a shape", () => {
    expect(statusOf(() => setApproval(file, toBuild!, true, "2026-11-25"))).toBe(400);
  });

  it("refuses to write over a ledger it cannot read, and keeps it intact", () => {
    writeFileSync(file, '{ "badge": { "on": "2026-11-25" }, }');
    expect(statusOf(() => setApproval(file, "tabs", true, "2026-11-25"))).toBe(409);
    expect(readFileSync(file, "utf8")).toBe('{ "badge": { "on": "2026-11-25" }, }');
  });
});

describe("readLedgerForDisplay", () => {
  it("never throws: a broken ledger reads as empty", () => {
    writeFileSync(file, "<<<<<<< conflict");
    expect(readLedgerForDisplay(file)).toEqual({});
  });
});
