import { describe, expect, it } from "vitest";

import { applyMask, maskWithCaret, nationalPhoneDigits } from "./mask";

describe("ZIP code", () => {
  it("formats five digits, and stops there", () => {
    expect(applyMask("zip", "9021")).toBe("9021");
    expect(applyMask("zip", "90210")).toBe("90210");
    expect(applyMask("zip", "902101234")).toBe("90210");
  });

  it("drops letters and punctuation", () => {
    expect(applyMask("zip", "90a2-10")).toBe("90210");
  });
});

describe("US phone", () => {
  it("draws area code, exchange and line as they arrive", () => {
    expect(applyMask("phone", "2")).toBe("(2");
    expect(applyMask("phone", "2133")).toBe("(213) 3");
    expect(applyMask("phone", "2133734")).toBe("(213) 373-4");
    expect(applyMask("phone", "2133734253")).toBe("(213) 373-4253");
  });

  it("drops the +1 of a pasted number instead of shifting every digit", () => {
    expect(applyMask("phone", "+1 (213) 373-4253")).toBe("(213) 373-4253");
    expect(nationalPhoneDigits("1-213-373-4253")).toBe("2133734253");
  });
});

describe("date", () => {
  it("formats MM/DD/YYYY", () => {
    expect(applyMask("date", "1225")).toBe("12/25");
    expect(applyMask("date", "12252026")).toBe("12/25/2026");
  });

  it("refuses digits that can never make a month, a day or a year", () => {
    // Typed "65/15/6155": 6 and 5 cannot start a month, 1 can; then 5 cannot
    // follow a 1 in the month, 1 can — and the 5s and the 6 cannot start a day.
    expect(applyMask("date", "65156155")).toBe("11");
    expect(applyMask("date", "13")).toBe("1");
    expect(applyMask("date", "00")).toBe("0");
    expect(applyMask("date", "0132")).toBe("01/3");
    expect(applyMask("date", "0130")).toBe("01/30");
    expect(applyMask("date", "01310999")).toBe("01/31");
    expect(applyMask("date", "01311999")).toBe("01/31/1999");
  });
});

describe("currency", () => {
  it("enters digits from the right, with en-US separators", () => {
    expect(applyMask("currency", "5")).toBe("0.05");
    expect(applyMask("currency", "18000")).toBe("180.00");
    expect(applyMask("currency", "123456789")).toBe("1,234,567.89");
  });

  it("keeps a lone zero as a value and ignores leading zeros", () => {
    expect(applyMask("currency", "0")).toBe("0.00");
    expect(applyMask("currency", "0012")).toBe("0.12");
  });
});

describe("integer", () => {
  it("groups thousands", () => {
    expect(applyMask("integer", "1500")).toBe("1,500");
    expect(applyMask("integer", "0")).toBe("0");
  });
});

describe("the caret", () => {
  it("stays right after a digit typed in the middle", () => {
    // "(213) 3|73-425" receives a 9: the hyphen moves, the caret does not.
    expect(maskWithCaret("phone", "(213) 3973-425", 8, "(213) 373-425")).toEqual({
      value: "(213) 397-3425",
      caret: 8,
    });
  });

  it("deletes the digit behind a separator instead of getting stuck on it", () => {
    // Backspace right after "-" in "(213) 373-|4253" removes the 3.
    expect(maskWithCaret("phone", "(213) 3734253", 9, "(213) 373-4253", "backward")).toEqual({
      value: "(213) 374-253",
      caret: 8,
    });
  });

  it("goes to the end when a whole prefixed number is pasted", () => {
    expect(maskWithCaret("phone", "+1 213 373 4253", 15, "")).toEqual({ value: "(213) 373-4253", caret: 14 });
  });
});
