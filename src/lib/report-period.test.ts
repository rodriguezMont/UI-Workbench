import { describe, expect, it } from "vitest";

import { isoToAxisLabel, isoToLongLabel, monthLabels, rangeLabel, reportRanges } from "./report-period";

describe("dates on a chart", () => {
  it("on the axis, short: month in three letters and the day", () => {
    expect(isoToAxisLabel("2026-09-12")).toBe("Sep 12");
    expect(isoToAxisLabel("2026-03-01")).toBe("Mar 1");
    expect(isoToAxisLabel("2026-11-25")).toBe("Nov 25");
  });

  it("on the reading of a point, in full", () => {
    expect(isoToLongLabel("2026-09-12")).toBe("September 12");
  });

  it("does not shift a day with the time zone", () => {
    expect(isoToLongLabel("2026-01-01")).toBe("January 1");
    expect(isoToLongLabel("2026-12-31")).toBe("December 31");
  });

  it("an invalid date is no label", () => {
    expect(isoToAxisLabel("2026-02-30")).toBe("");
    expect(isoToLongLabel("yesterday")).toBe("");
  });
});

describe("the month of a monthly chart", () => {
  it("short on the axis, in full with the year on the reading", () => {
    expect(monthLabels("2026-09")).toEqual({ short: "Sep", long: "September 2026" });
    expect(monthLabels("2025-12")).toEqual({ short: "Dec", long: "December 2025" });
  });

  it("an invalid month is no label", () => {
    expect(monthLabels("2026-13")).toEqual({ short: "", long: "" });
    expect(monthLabels("September")).toEqual({ short: "", long: "" });
  });
});

describe("the reporting period — closed days only, and the previous one of the same length", () => {
  it("7 and 30 days end yesterday", () => {
    expect(reportRanges("7d", "2026-10-01")).toEqual({
      current: { from: "2026-09-24", to: "2026-09-30" },
      previous: { from: "2026-09-17", to: "2026-09-23" },
    });
    expect(reportRanges("30d", "2026-10-01")).toEqual({
      current: { from: "2026-09-01", to: "2026-09-30" },
      previous: { from: "2026-08-02", to: "2026-08-31" },
    });
  });

  it("12 months end last month, and the previous one is the year before", () => {
    expect(reportRanges("12m", "2026-10-01")).toEqual({
      current: { from: "2025-10-01", to: "2026-09-30" },
      previous: { from: "2024-10-01", to: "2025-09-30" },
    });
    // In January, last month is December of the year before.
    expect(reportRanges("12m", "2026-01-15")?.current).toEqual({ from: "2025-01-01", to: "2025-12-31" });
    // February ends on the 29th only in a leap year.
    expect(reportRanges("12m", "2028-03-10")).toMatchObject({
      current: { to: "2028-02-29" },
      previous: { to: "2027-02-28" },
    });
  });

  it("crosses months and years without losing a day", () => {
    expect(reportRanges("7d", "2026-01-03")?.current).toEqual({ from: "2025-12-27", to: "2026-01-02" });
    expect(reportRanges("7d", "2026-03-01")?.current.to).toBe("2026-02-28");
  });

  it("an invalid date invents no period", () => {
    expect(reportRanges("30d", "2026-02-30")).toBeNull();
    expect(reportRanges("30d", "")).toBeNull();
  });
});

describe("the range in words", () => {
  const today = "2026-10-01";

  it("with the fewest words", () => {
    expect(rangeLabel({ from: "2026-09-24", to: "2026-09-30" }, today)).toBe("September 24–30");
    expect(rangeLabel({ from: "2026-08-02", to: "2026-09-01" }, today)).toBe("August 2 – September 1");
  });

  it("the year only when it is not this year", () => {
    expect(rangeLabel({ from: "2025-12-27", to: "2026-01-02" }, "2026-01-03")).toBe(
      "December 27, 2025 – January 2, 2026",
    );
    expect(rangeLabel({ from: "2025-12-20", to: "2025-12-26" }, "2026-01-03")).toBe("December 20–26, 2025");
    expect(rangeLabel({ from: "2025-11-20", to: "2025-12-03" }, "2026-01-03")).toBe("November 20 – December 3, 2025");
  });

  it("whole months always carry the year", () => {
    expect(rangeLabel({ from: "2025-10-01", to: "2026-09-30" }, today, true)).toBe("October 2025 – September 2026");
  });

  it("an invalid end is no label", () => {
    expect(rangeLabel({ from: "2026-09-24", to: "2026-09-31" }, today)).toBe("");
  });
});
