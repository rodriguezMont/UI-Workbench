import { describe, expect, it } from "vitest";

import { formatInteger, formatOneDecimal, formatPercent, formatThousandsFloor } from "./format";

describe("one decimal", () => {
  it("uses a point and keeps the decimal on round numbers", () => {
    expect(formatOneDecimal(4.3)).toBe("4.3");
    expect(formatOneDecimal(4)).toBe("4.0");
    expect(formatOneDecimal(0.8)).toBe("0.8");
  });
});

describe("integers", () => {
  it("groups thousands with a comma", () => {
    expect(formatInteger(1284)).toBe("1,284");
    expect(formatInteger(999)).toBe("999");
  });
});

describe("thousands, rounded down", () => {
  it("rounds down and says there is more", () => {
    expect(formatThousandsFloor(69842)).toBe("69K+");
    expect(formatThousandsFloor(1000)).toBe("1K+");
    expect(formatThousandsFloor(1234567)).toBe("1,234K+");
  });

  it('below a thousand, the whole number — never "0K+"', () => {
    expect(formatThousandsFloor(999)).toBe("999");
    expect(formatThousandsFloor(121)).toBe("121");
  });
});

describe("percent", () => {
  it("no decimal from 10% up", () => {
    expect(formatPercent(0.12)).toBe("12%");
    expect(formatPercent(1.5)).toBe("150%");
  });

  it("one decimal below 10%, so a small change does not read as zero", () => {
    expect(formatPercent(0.045)).toBe("4.5%");
    expect(formatPercent(0.004)).toBe("0.4%");
  });
});

describe("whole percent and dollars", () => {
  it("a share stays whole, even below 10%", async () => {
    const { formatWholePercent } = await import("./format");
    expect(formatWholePercent(0.6)).toBe("60%");
    expect(formatWholePercent(0.04)).toBe("4%");
    expect(formatWholePercent(1.1)).toBe("110%");
  });

  it("dollars in whole amounts, with grouped thousands", async () => {
    const { formatDollars } = await import("./format");
    expect(formatDollars(12400)).toBe("$12,400");
    expect(formatDollars(89.6)).toBe("$90");
  });
});
