import { describe, expect, it } from "vitest";

import { contrast, over } from "./contrast";

const white = { r: 255, g: 255, b: 255, a: 1 };
const black = { r: 0, g: 0, b: 0, a: 1 };

describe("contrast", () => {
  it("runs from 1 to 21, in either order", () => {
    expect(contrast(white, black)).toBeCloseTo(21);
    expect(contrast(black, white)).toBeCloseTo(21);
    expect(contrast(white, white)).toBe(1);
  });

  it("measures the WCAG reference gray at 4.5:1 on white", () => {
    // #767676 is the classic lightest gray that passes AA on white.
    expect(contrast({ r: 0x76, g: 0x76, b: 0x76, a: 1 }, white)).toBeGreaterThanOrEqual(4.5);
    expect(contrast({ r: 0x77, g: 0x77, b: 0x77, a: 1 }, white)).toBeLessThan(4.5);
  });

  it("paints a translucent color over the one beneath it", () => {
    expect(over({ ...black, a: 0.5 }, white)).toEqual({ r: 127.5, g: 127.5, b: 127.5, a: 1 });
  });
});
