import { describe, expect, it } from "vitest";

import { decimalsOf, nudge } from "./slider";

describe("decimalsOf", () => {
  it("counts the decimals, scientific notation included", () => {
    expect(decimalsOf(1)).toBe(0);
    expect(decimalsOf(0.25)).toBe(2);
    expect(decimalsOf(0.5)).toBe(1);
    expect(decimalsOf(1e-7)).toBe(7);
  });
});

describe("nudge, the button's step", () => {
  const miles = { min: 0, max: 50, step: 1 };
  const zoom = { min: 1, max: 4, step: 0.01 };

  it("moves and stops at the ends", () => {
    expect(nudge(15, 1, miles)).toBe(16);
    expect(nudge(15, -1, miles)).toBe(14);
    expect(nudge(50, 1, miles)).toBe(50);
    expect(nudge(0, -1, miles)).toBe(0);
  });

  it("leaves no floating-point residue", () => {
    expect(nudge(1.1, 0.25, zoom)).toBe(1.35);
    expect(nudge(0.1, 0.2, { min: 0, max: 1, step: 0.1 })).toBe(0.3);
  });

  it("lands on the step's grid, counted from the minimum", () => {
    expect(nudge(12, 5, { min: 0, max: 50, step: 5 })).toBe(15);
    expect(nudge(3.9, 0.25, zoom)).toBe(4);
    expect(nudge(7, 5, { min: 2, max: 50, step: 5 })).toBe(12);
  });
});
