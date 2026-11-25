import { describe, expect, it } from "vitest";

import {
  PLOT_H,
  PLOT_W,
  areaPath,
  bandIndex,
  deltaOf,
  formatWithUnit,
  gaugeArc,
  gaugePoint,
  linePath,
  meterReading,
  meterValueText,
  nearestIndex,
  plotPoints,
  rankingRows,
  readingText,
  shareLabel,
  sortedDesc,
  sparkPoints,
  tickIndices,
  yTicks,
} from "./chart";

describe("deltaOf — the change against the previous period", () => {
  it("goes up and down by the ratio, always positive", () => {
    expect(deltaOf(112, 100)).toEqual({ kind: "up", ratio: 0.12 });
    const drop = deltaOf(92, 100);
    expect(drop.kind).toBe("down");
    expect(drop.kind === "down" && drop.ratio).toBeCloseTo(0.08);
  });

  it("calls flat what moved less than half a percent", () => {
    expect(deltaOf(1003, 1000)).toEqual({ kind: "flat" });
    expect(deltaOf(1000, 1000)).toEqual({ kind: "flat" });
  });

  it("without a base it invents no percentage — zero to 40 is a start", () => {
    expect(deltaOf(40, 0)).toEqual({ kind: "none" });
    expect(deltaOf(40, undefined)).toEqual({ kind: "none" });
    expect(deltaOf(40, null)).toEqual({ kind: "none" });
  });
});

describe("sparkPoints — the trend line", () => {
  it("runs edge to edge across the width", () => {
    const pts = sparkPoints([1, 2, 3], 100, 20).split(" ");
    expect(pts[0]!.startsWith("0,")).toBe(true);
    expect(pts[2]!.startsWith("100,")).toBe(true);
  });

  it("the highest value sits on top and the lowest at the bottom, inside the padding", () => {
    const [first, , last] = sparkPoints([1, 5, 9], 100, 20, 2)
      .split(" ")
      .map((p) => Number(p.split(",")[1]));
    expect(first).toBe(18);
    expect(last).toBe(2);
  });

  it("a constant series is a straight line in the middle, never on the floor", () => {
    const ys = sparkPoints([7, 7, 7], 100, 20).split(" ").map((p) => p.split(",")[1]);
    expect(new Set(ys)).toEqual(new Set(["10"]));
  });

  it("fewer than two points is no line", () => {
    expect(sparkPoints([5], 100, 20)).toBe("");
    expect(sparkPoints([], 100, 20)).toBe("");
  });
});

describe("yTicks — the vertical axis in clean steps", () => {
  it("starts at zero and climbs in a round step", () => {
    expect(yTicks(52)).toEqual({ top: 60, ticks: [0, 20, 40, 60] });
    expect(yTicks(1206)).toEqual({ top: 1250, ticks: [0, 250, 500, 750, 1000, 1250] });
  });

  it("picks the step with the lowest top: 104 goes to 125, not 150", () => {
    expect(yTicks(104)).toEqual({ top: 125, ticks: [0, 25, 50, 75, 100, 125] });
  });

  it("a small count gets no fractional step", () => {
    expect(yTicks(5)).toEqual({ top: 5, ticks: [0, 1, 2, 3, 4, 5] });
    expect(yTicks(2).ticks.every(Number.isInteger)).toBe(true);
  });

  it("without a positive value, a minimal axis instead of a division by zero", () => {
    expect(yTicks(0)).toEqual({ top: 1, ticks: [0, 1] });
  });
});

describe("plotPoints, linePath and areaPath — the drawing in the 1000 × 100 box", () => {
  it("runs edge to edge, with zero on the floor", () => {
    const pts = plotPoints([0, 50, 100], 100);
    expect(pts[0]).toEqual({ x: 0, y: PLOT_H });
    expect(pts[2]).toEqual({ x: PLOT_W, y: 0 });
  });

  it("a single point sits in the middle", () => {
    expect(plotPoints([7], 10)[0]!.x).toBe(PLOT_W / 2);
  });

  it("the area closes on the floor", () => {
    expect(areaPath(plotPoints([10, 20], 20))).toBe("M0 50 L1000 0 L1000 100 L0 100 Z");
    expect(linePath(plotPoints([10, 20], 20))).toBe("M0 50 L1000 0");
  });
});

describe("nearestIndex — the date the pointer reads", () => {
  it("rounds to the nearest day and stays within the ends", () => {
    expect(nearestIndex(0, 30)).toBe(0);
    expect(nearestIndex(1, 30)).toBe(29);
    expect(nearestIndex(0.5, 30)).toBe(15);
    expect(nearestIndex(-0.2, 30)).toBe(0);
    expect(nearestIndex(1.4, 30)).toBe(29);
  });
});

describe("tickIndices — which dates get a label", () => {
  it("few dates: all of them", () => {
    expect(tickIndices(5)).toEqual([0, 1, 2, 3, 4]);
  });

  it("thirty days: first, last and an even step, without one crowding the last", () => {
    const t = tickIndices(30);
    expect(t[0]).toBe(0);
    expect(t.at(-1)).toBe(29);
    expect(t.length).toBeLessThanOrEqual(6);
    expect(t.at(-1)! - t.at(-2)!).toBeGreaterThanOrEqual(3);
  });
});

describe("formatWithUnit and readingText — what the reading says", () => {
  const visitors = { one: "visitor", other: "visitors" };

  it("singular and plural by the unit", () => {
    expect(formatWithUnit(1, visitors)).toBe("1 visitor");
    expect(formatWithUnit(1206, visitors)).toBe("1,206 visitors");
  });

  it("one series: only the value", () => {
    expect(readingText("September 16", [{ label: "Visitors", values: [45] }], 0, visitors)).toBe(
      "September 16: 45 visitors",
    );
  });

  it("two series: each value with its series' name", () => {
    const two = [
      { label: "North", values: [52] },
      { label: "South", values: [38] },
    ] as const;
    expect(readingText("September 30", two, 0, visitors)).toBe("September 30: 52 visitors (North); 38 visitors (South)");
  });
});

describe("bandIndex — the column the pointer is in", () => {
  it("each column is a whole band, and the ends do not escape", () => {
    expect(bandIndex(0, 9)).toBe(0);
    expect(bandIndex(0.1, 9)).toBe(0);
    expect(bandIndex(0.12, 9)).toBe(1);
    expect(bandIndex(0.999, 9)).toBe(8);
    expect(bandIndex(1, 9)).toBe(8);
    expect(bandIndex(-0.3, 9)).toBe(0);
  });
});

describe("sortedDesc — the comparison's order", () => {
  it("largest first, and a tie keeps the caller's order", () => {
    const items = [
      { label: "Website", value: 2 },
      { label: "Search", value: 60 },
      { label: "Social", value: 2 },
      { label: "Referral", value: 34 },
    ];
    expect(sortedDesc(items).map((i) => i.label)).toEqual(["Search", "Referral", "Website", "Social"]);
  });

  it("does not touch the list it received", () => {
    const items = [
      { label: "a", value: 1 },
      { label: "b", value: 2 },
    ];
    sortedDesc(items);
    expect(items[0]!.label).toBe("a");
  });
});

describe("rankingRows — position, folding and share of the whole", () => {
  const REGIONS = [
    { label: "South", value: 34 },
    { label: "North", value: 86 },
    { label: "West", value: 3 },
    { label: "East", value: 21 },
  ];

  it("sorts, and each percentage is the nearest to its own value", () => {
    const rows = rankingRows(REGIONS);
    expect(rows.map((r) => r.label)).toEqual(["North", "South", "East", "West"]);
    // 59.7 · 23.6 · 14.6 · 2.1 — the sum is 101, and each one is right.
    expect(rows.map((r) => r.share)).toEqual([60, 24, 15, 2]);
    expect(rows[0]!.ratio).toBeCloseTo(86 / 144);
  });

  it("a tie shares the position: 1, 2, 2, 4", () => {
    const rows = rankingRows([
      { label: "a", value: 14 },
      { label: "b", value: 9 },
      { label: "c", value: 9 },
      { label: "d", value: 2 },
    ]);
    expect(rows.map((r) => r.position)).toEqual([1, 2, 2, 4]);
    // A tie always shows the same percentage.
    expect(rows[1]!.share).toBe(rows[2]!.share);
  });

  it("folds the tail into one row with no position, at the end", () => {
    const rows = rankingRows(REGIONS, 2);
    expect(rows.map((r) => [r.label, r.value, r.position, r.folded])).toEqual([
      ["North", 86, 1, 0],
      ["South", 34, 2, 0],
      ["", 24, null, 2],
    ]);
    expect(rows[2]!.share).toBe(17);
  });

  it("does not fold a single item — it shows in full", () => {
    expect(rankingRows(REGIONS, 3)).toHaveLength(4);
    expect(rankingRows(REGIONS, 3).every((r) => r.folded === 0)).toBe(true);
  });

  it("a zero total does not divide by zero", () => {
    const rows = rankingRows([
      { label: "a", value: 0 },
      { label: "b", value: 0 },
    ]);
    expect(rows.map((r) => [r.ratio, r.share])).toEqual([
      [0, 0],
      [0, 0],
    ]);
  });

  it("a value that rounds to zero shows as < 1%", () => {
    expect(shareLabel({ share: 0, value: 3 })).toBe("< 1%");
    expect(shareLabel({ share: 0, value: 0 })).toBe("0%");
    expect(shareLabel({ share: 60, value: 86 })).toBe("60%");
  });
});

describe("meterReading — a value against a goal or a limit", () => {
  it("below the goal, the track is the goal and the phrase says how far", () => {
    expect(meterReading(96, 120)).toEqual({ fill: 0.8, mark: null, percent: "80%", remark: "24 short of the goal" });
    expect(meterReading(119, 120)?.remark).toBe("1 short of the goal");
  });

  it("never writes 100% before getting there, nor 0% with a value", () => {
    expect(meterReading(239, 240)?.percent).toBe("99%");
    expect(meterReading(1, 400)?.percent).toBe("< 1%");
    expect(meterReading(0, 400)).toMatchObject({ fill: 0, percent: "0%" });
  });

  it("past the goal: the bar fills and the goal becomes a mark", () => {
    const r = meterReading(132, 120)!;
    expect(r.fill).toBe(1);
    expect(r.mark).toBeCloseTo(120 / 132);
    expect(r.percent).toBe("110%");
    expect(r.remark).toBe("12 above the goal");
    expect(meterReading(120, 120)).toMatchObject({ mark: null, percent: "100%", remark: "goal reached" });
  });

  it("a limit only changes the phrase", () => {
    expect(meterReading(8, 10, "limit")?.remark).toBe("2 left");
    expect(meterReading(3, 3, "limit")?.remark).toBe("at the limit");
    expect(meterReading(4, 3, "limit")?.remark).toBe("1 over the limit");
    expect(meterReading(1300, 1500, "goal")?.remark).toBe("200 short of the goal");
    expect(meterReading(300, 2500, "limit")?.remark).toBe("2,200 left");
  });

  it("without a positive reference there is no meter; a negative value is zero", () => {
    expect(meterReading(10, 0)).toBeNull();
    expect(meterReading(10, Number.NaN)).toBeNull();
    expect(meterReading(-5, 10)).toMatchObject({ fill: 0, percent: "0%" });
  });
});

describe("meterValueText — what a listener hears from the meter", () => {
  it("value, reference, percentage and phrase", () => {
    const unit = { one: "signup", other: "signups" };
    expect(meterValueText(96, 120, unit, meterReading(96, 120)!)).toBe("96 of 120 signups, 80%; 24 short of the goal");
    expect(meterValueText(0, 1, unit, meterReading(0, 1)!)).toBe("0 of 1 signup, 0%; 1 short of the goal");
  });
});

describe("gaugeArc — the half-turn arc", () => {
  it("starts on the left, passes over the top and ends on the right", () => {
    expect(gaugeArc(1, 100, 100, 80)).toBe("M20 100 A80 80 0 0 1 180 100");
    expect(gaugeArc(0.5, 100, 100, 80)).toBe("M20 100 A80 80 0 0 1 100 20");
  });

  it("the point on the path: the start, the top and the end", () => {
    expect(gaugePoint(0, 100, 100, 80)).toEqual({ x: 20, y: 100 });
    expect(gaugePoint(0.5, 100, 100, 80)).toEqual({ x: 100, y: 20 });
    expect(gaugePoint(2, 100, 100, 80)).toEqual({ x: 180, y: 100 });
  });

  it("zero is no arc, and anything past 1 stops at the end", () => {
    expect(gaugeArc(0, 100, 100, 80)).toBe("");
    expect(gaugeArc(1.4, 100, 100, 80)).toBe(gaugeArc(1, 100, 100, 80));
  });
});
