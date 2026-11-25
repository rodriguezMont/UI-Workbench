import { describe, expect, it } from "vitest";

import { compareValues, filterRows, pageOf, searchRows, sortRows } from "./table";

type Row = { name: string; plan: string; visitors: number };

const ROWS: Row[] = [
  { name: "Émile Studio", plan: "Pro", visitors: 120 },
  { name: "Zenith Labs", plan: "Free", visitors: 120 },
  { name: "Brightline Café", plan: "Pro", visitors: 9 },
  { name: "Acme Analytics", plan: "Team", visitors: 1000 },
];

describe("the comparison", () => {
  it("numbers by magnitude, not as text", () => {
    expect(compareValues(9, 1000)).toBeLessThan(0);
    expect(compareValues(1000, 9)).toBeGreaterThan(0);
  });

  it("text in alphabetical order: an accent does not push a name to the end", () => {
    expect(compareValues("Émile", "Frank")).toBeLessThan(0);
    expect(compareValues("Zenith", "Émile")).toBeGreaterThan(0);
  });

  it("digits inside text compare as numbers", () => {
    expect(compareValues("Plan 2", "Plan 10")).toBeLessThan(0);
  });

  it("empty goes last, both ways", () => {
    expect(compareValues(undefined, "a")).toBeGreaterThan(0);
    expect(compareValues("a", "")).toBeLessThan(0);
    expect(compareValues("", undefined)).toBe(0);
  });
});

describe("sorting", () => {
  it("sorts both ways without touching the caller's list", () => {
    const original = [...ROWS];
    expect(sortRows(ROWS, (r) => r.visitors, "asc").map((r) => r.visitors)).toEqual([9, 120, 120, 1000]);
    expect(sortRows(ROWS, (r) => r.visitors, "desc").map((r) => r.visitors)).toEqual([1000, 120, 120, 9]);
    expect(ROWS).toEqual(original);
  });

  it("a tie keeps the arrival order", () => {
    const tie = sortRows(ROWS, (r) => r.visitors, "asc").filter((r) => r.visitors === 120);
    expect(tie.map((r) => r.name)).toEqual(["Émile Studio", "Zenith Labs"]);
  });
});

describe("searching", () => {
  const fields = [(r: Row) => r.name, (r: Row) => r.plan];

  it("ignores accents and case", () => {
    expect(searchRows(ROWS, "cafe", fields).map((r) => r.name)).toEqual(["Brightline Café"]);
    expect(searchRows(ROWS, "EMILE", fields)).toHaveLength(1);
  });

  it("scans every declared column", () => {
    expect(searchRows(ROWS, "pro", fields)).toHaveLength(2);
  });

  it("an empty term returns everything", () => {
    expect(searchRows(ROWS, "   ", fields)).toHaveLength(4);
  });
});

describe("filters", () => {
  it("within a column it is or; across columns it is and", () => {
    const plan = { value: (r: Row) => r.plan, selected: ["Pro", "Team"] };
    expect(filterRows(ROWS, [plan])).toHaveLength(3);
    const large = { value: (r: Row) => (r.visitors > 100 ? "yes" : "no"), selected: ["yes"] };
    expect(filterRows(ROWS, [plan, large]).map((r) => r.name)).toEqual(["Émile Studio", "Acme Analytics"]);
  });

  it("with nothing checked, it does not filter", () => {
    expect(filterRows(ROWS, [{ value: (r) => r.plan, selected: [] }])).toHaveLength(4);
  });
});

describe("the page", () => {
  const numbers = Array.from({ length: 42 }, (_, i) => i + 1);

  it("slices and counts", () => {
    const p = pageOf(numbers, 0, 10);
    expect(p.rows).toHaveLength(10);
    expect([p.pages, p.index, p.first, p.last]).toEqual([5, 0, 1, 10]);
  });

  it("the last page may be short", () => {
    const p = pageOf(numbers, 4, 10);
    expect(p.rows).toEqual([41, 42]);
    expect([p.first, p.last]).toEqual([41, 42]);
  });

  it("a page that no longer exists falls back to the last one", () => {
    const p = pageOf(numbers.slice(0, 7), 4, 10);
    expect([p.index, p.pages, p.rows.length]).toEqual([0, 1, 7]);
  });

  it("an empty list still has one page, and counts zero", () => {
    expect(pageOf([], 0, 10)).toEqual({ rows: [], pages: 1, index: 0, first: 0, last: 0 });
  });
});
