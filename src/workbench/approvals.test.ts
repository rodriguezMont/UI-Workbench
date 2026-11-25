import { describe, expect, it } from "vitest";

import { approvedOn, parseLedger, sortLedger, stateOf, tally, tallyOfSection } from "./approvals";
import { COMPONENTS, findComponent } from "./registry";

const built = findComponent("button")!;
const toBuild = findComponent("rating")!;

describe("parseLedger", () => {
  it("keeps only well-formed entries and never throws", () => {
    expect(
      parseLedger({
        button: { on: "2026-11-25" },
        badge: { on: "" },
        tabs: { on: "yesterday" },
        link: "2026-11-25",
        avatar: null,
      }),
    ).toEqual({ button: { on: "2026-11-25" } });
    expect(parseLedger(null)).toEqual({});
    expect(parseLedger([])).toEqual({});
    expect(parseLedger("nope")).toEqual({});
  });
});

describe("stateOf", () => {
  it("derives the state from the registry and the ledger", () => {
    expect(stateOf(built, {})).toBe("in-review");
    expect(stateOf(built, { button: { on: "2026-11-25" } })).toBe("approved");
  });

  it("never treats a piece without a shape as approved", () => {
    expect(stateOf(toBuild, { rating: { on: "2026-11-25" } })).toBe("to-build");
    expect(approvedOn(toBuild, { rating: { on: "2026-11-25" } })).toBeUndefined();
  });
});

describe("tally", () => {
  it("keeps 'to build' out of the approved and pending counts", () => {
    const counts = tally([built, toBuild], { button: { on: "2026-11-25" } });
    expect(counts).toEqual({ approved: 1, pending: 0, toBuild: 1 });
  });

  it("ignores approvals for ids the registry does not know", () => {
    const counts = tally(COMPONENTS, { "no-such-piece": { on: "2026-11-25" } });
    expect(counts.approved).toBe(0);
  });

  it("counts per section", () => {
    const counts = tallyOfSection("primitives", { button: { on: "2026-11-25" } });
    expect(counts.approved).toBe(1);
    expect(counts.toBuild).toBe(1); // rating
  });
});

describe("sortLedger", () => {
  it("orders keys so each change is one line in the diff", () => {
    expect(Object.keys(sortLedger({ tabs: { on: "2026-01-01" }, badge: { on: "2026-01-01" } }))).toEqual(["badge", "tabs"]);
  });
});
