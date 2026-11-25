import { describe, expect, it } from "vitest";

import { dayExists, daysInMonth, pad, parseIsoDate, toIsoDate } from "./iso-date";

describe("iso-date", () => {
  it("pads months, days and years", () => {
    expect(pad(7)).toBe("07");
    expect(pad(12)).toBe("12");
    expect(pad(26, 4)).toBe("0026");
  });

  it("knows how long each month is, leap years included", () => {
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2028, 2)).toBe(29);
    expect(daysInMonth(2026, 4)).toBe(30);
    expect(daysInMonth(2026, 12)).toBe(31);
  });

  it("refuses days that do not exist", () => {
    expect(dayExists({ y: 2026, m: 2, d: 29 })).toBe(false);
    expect(dayExists({ y: 2028, m: 2, d: 29 })).toBe(true);
    expect(dayExists({ y: 2026, m: 13, d: 1 })).toBe(false);
    expect(dayExists({ y: 2026, m: 1, d: 0 })).toBe(false);
  });

  it("parses yyyy-mm-dd and writes it back", () => {
    expect(parseIsoDate("2026-09-17")).toEqual({ y: 2026, m: 9, d: 17 });
    expect(toIsoDate({ y: 2026, m: 9, d: 7 })).toBe("2026-09-07");
  });

  it("returns null for malformed or nonexistent dates", () => {
    expect(parseIsoDate("2026-9-17")).toBeNull();
    expect(parseIsoDate("09/17/2026")).toBeNull();
    expect(parseIsoDate("2026-02-30")).toBeNull();
  });
});
