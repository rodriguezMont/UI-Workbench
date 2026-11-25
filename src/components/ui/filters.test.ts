import { describe, expect, it } from "vitest";

import { groupIsSearchable, toggleFilterValue, visibleOptions } from "./filters";

describe("toggleFilterValue", () => {
  it("checks in a group that does not exist yet", () => {
    expect(toggleFilterValue({}, "category", "shoes")).toEqual({ category: ["shoes"] });
  });

  it("unchecks what was already checked", () => {
    expect(toggleFilterValue({ category: ["shoes", "bags"] }, "category", "shoes")).toEqual({ category: ["bags"] });
  });

  it("leaves the other groups alone", () => {
    const before = { category: ["shoes"], size: ["m"] };
    expect(toggleFilterValue(before, "category", "bags")).toEqual({ category: ["shoes", "bags"], size: ["m"] });
  });

  it("does not change the selection it receives", () => {
    const before = { category: ["shoes"] };
    const after = toggleFilterValue(before, "category", "bags");
    expect(before).toEqual({ category: ["shoes"] });
    expect(after.category).not.toBe(before.category);
  });
});

describe("visibleOptions", () => {
  const group = {
    id: "category",
    legend: "Category",
    options: [
      { value: "shoes", label: "Shoes", count: 3 },
      { value: "hats", label: "Hats", count: 0 },
    ],
  };

  it("drops the option that would lead to zero", () => {
    expect(visibleOptions(group, []).map((o) => o.value)).toEqual(["shoes"]);
  });

  it("keeps a checked option even at zero", () => {
    expect(visibleOptions(group, ["hats"]).map((o) => o.value)).toEqual(["shoes", "hats"]);
  });
});

describe("groupIsSearchable", () => {
  const options = (n: number) => Array.from({ length: n }, (_, i) => ({ value: `o${i}`, label: `Option ${i}`, count: 1 }));

  it("asks for a search above ten options only", () => {
    expect(groupIsSearchable(options(10))).toBe(false);
    expect(groupIsSearchable(options(11))).toBe(true);
  });
});
