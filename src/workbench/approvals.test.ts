import { describe, expect, it } from "vitest";

import { approvedOn, parseLedger, sortLedger, stateOf, tally, tallyOfSection } from "./approvals";
import { COMPONENTS, SECTIONS, componentsOf, findComponent } from "./registry";

const built = findComponent("button")!;
// Any piece still without a shape: read from the registry, so the tests do
// not break each time a group gets built.
const toBuild = COMPONENTS.find((c) => c.built === false)!;

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
    // A section with pieces of both kinds, whichever it is today.
    const mixed = SECTIONS.find((s) => {
      const pieces = componentsOf(s.id);
      return pieces.some((c) => c.built === false) && pieces.some((c) => c.built !== false);
    })!;
    const pieces = componentsOf(mixed.id);
    const done = pieces.find((c) => c.built !== false)!;
    const counts = tallyOfSection(mixed.id, { [done.id]: { on: "2026-11-25" } });
    expect(counts.approved).toBe(1);
    expect(counts.toBuild).toBe(pieces.filter((c) => c.built === false).length);
  });
});

describe("sortLedger", () => {
  it("orders keys so each change is one line in the diff", () => {
    expect(Object.keys(sortLedger({ tabs: { on: "2026-01-01" }, badge: { on: "2026-01-01" } }))).toEqual(["badge", "tabs"]);
  });
});
