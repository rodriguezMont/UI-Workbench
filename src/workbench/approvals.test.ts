import { describe, expect, it } from "vitest";

import { approvedOn, parseLedger, sortLedger, stateOf, tally, tallyOfSection } from "./approvals";
import { COMPONENTS, componentsOf, findComponent } from "./registry";

const built = findComponent("button")!;
// A piece without a shape, made up here: the registry may have none left to
// build, and the rule must still hold. Same id as `built`, so an approval on
// the ledger is there for it to ignore.
const toBuild = { ...built, built: false as const };

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
    const ledger = { [toBuild.id]: { on: "2026-11-25" } };
    expect(stateOf(toBuild, ledger)).toBe("to-build");
    expect(approvedOn(toBuild, ledger)).toBeUndefined();
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
    // Read from the registry, whatever is left to build in the section today.
    const pieces = componentsOf(built.section);
    const toBuildCount = pieces.filter((c) => c.built === false).length;
    const counts = tallyOfSection(built.section, { [built.id]: { on: "2026-11-25" } });
    expect(counts).toEqual({ approved: 1, pending: pieces.length - toBuildCount - 1, toBuild: toBuildCount });
  });
});

describe("sortLedger", () => {
  it("orders keys so each change is one line in the diff", () => {
    expect(Object.keys(sortLedger({ tabs: { on: "2026-01-01" }, badge: { on: "2026-01-01" } }))).toEqual(["badge", "tabs"]);
  });
});
