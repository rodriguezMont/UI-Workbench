import { describe, expect, it } from "vitest";

import { messages } from "@/messages";

import {
  MONTH_NAMES,
  checkDate,
  dateToIso,
  displayToIso,
  formatTime,
  isoToDate,
  isoToDisplay,
  joinDateTime,
  monthAllowed,
  splitDateTime,
  timeSlots,
  yearAllowed,
  yearPageStart,
} from "./date-time";

const m = messages.ui.datePicker;

describe("a date between the screen and the submission", () => {
  it("goes both ways without swapping month and day", () => {
    expect(displayToIso("09/17/2026")).toBe("2026-09-17");
    expect(isoToDisplay("2026-09-17")).toBe("09/17/2026");
    expect(displayToIso("01/02/2026")).toBe("2026-01-02");
  });

  it("refuses what the calendar does not have", () => {
    expect(displayToIso("02/31/2026")).toBeNull();
    expect(displayToIso("02/29/2026")).toBeNull();
    expect(displayToIso("02/29/2028")).toBe("2028-02-29");
    expect(displayToIso("01/00/2026")).toBeNull();
    expect(displayToIso("13/17/2026")).toBeNull();
    // Day first is not this locale's order.
    expect(displayToIso("17/09/2026")).toBeNull();
    expect(isoToDisplay("2026-02-31")).toBe("");
  });

  it("refuses an incomplete one", () => {
    expect(displayToIso("09/17/26")).toBeNull();
    expect(displayToIso("")).toBeNull();
  });

  it("the Date is local midnight — never the previous day by time zone", () => {
    const d = isoToDate("2026-09-17")!;
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 8, 17, 0]);
    expect(dateToIso(d)).toBe("2026-09-17");
    expect(isoToDate("2026-09-31")).toBeUndefined();
  });
});

describe("the error of a typed date", () => {
  it("empty is not an error; a right one neither", () => {
    expect(checkDate("")).toBeNull();
    expect(checkDate("09/17/2026")).toBeNull();
  });

  it("says what is missing, or that the day does not exist", () => {
    expect(checkDate("09/17")).toBe(m.incomplete);
    expect(checkDate("02/31/2026")).toBe(m.doesNotExist("02/31/2026"));
    expect(m.doesNotExist("02/31/2026")).toBe("That date doesn't exist: 02/31/2026.");
  });

  it("says the limit, in the screen's format", () => {
    const bounds = { min: "2026-09-01", max: "2026-09-30" };
    expect(checkDate("08/31/2026", bounds)).toBe(m.tooEarly("09/01/2026"));
    expect(checkDate("10/01/2026", bounds)).toBe(m.tooLate("09/30/2026"));
    expect(checkDate("09/01/2026", bounds)).toBeNull();
    expect(checkDate("09/30/2026", bounds)).toBeNull();
  });
});

describe("the times on offer", () => {
  it("every half hour, all day, by default", () => {
    const slots = timeSlots();
    expect(slots).toHaveLength(48);
    expect(slots[0]).toBe("00:00");
    expect(slots.at(-1)).toBe("23:30");
  });

  it("follows the step and the range, both ends included", () => {
    expect(timeSlots({ step: 15, min: "08:00", max: "09:00" })).toEqual(["08:00", "08:15", "08:30", "08:45", "09:00"]);
  });

  it("a bad range or step is the caller's bug, not an empty list", () => {
    expect(() => timeSlots({ min: "25:00" })).toThrow();
    expect(() => timeSlots({ step: 0 })).toThrow();
    expect(() => timeSlots({ step: 7.5 })).toThrow();
  });
});

describe("a time on screen", () => {
  // `\s`: newer ICU puts a narrow no-break space before the AM/PM.
  it("is written in 12 hours, as the US reads it", () => {
    expect(formatTime("14:30")).toMatch(/^2:30\sPM$/);
    expect(formatTime("09:05")).toMatch(/^9:05\sAM$/);
  });

  it("midnight and noon are 12, never 0", () => {
    expect(formatTime("00:00")).toMatch(/^12:00\sAM$/);
    expect(formatTime("12:00")).toMatch(/^12:00\sPM$/);
  });

  it("an invalid time is not written", () => {
    expect(formatTime("24:00")).toBe("");
    expect(formatTime("2:30 PM")).toBe("");
    expect(formatTime("")).toBe("");
  });
});

describe("date and time together", () => {
  it("join only when both exist", () => {
    expect(joinDateTime("2026-09-17", "14:30")).toBe("2026-09-17T14:30");
    expect(joinDateTime("2026-09-17", "")).toBe("");
    expect(joinDateTime("", "14:30")).toBe("");
  });

  it("split back, dropping the invalid part", () => {
    expect(splitDateTime("2026-09-17T14:30")).toEqual({ date: "2026-09-17", time: "14:30" });
    expect(splitDateTime("2026-09-17")).toEqual({ date: "2026-09-17", time: "" });
    expect(splitDateTime("")).toEqual({ date: "", time: "" });
    expect(splitDateTime("2026-02-31T25:00")).toEqual({ date: "", time: "" });
  });
});

describe("moving by month and year", () => {
  it("twelve months, in the interface's language", () => {
    expect(MONTH_NAMES).toHaveLength(12);
    expect(MONTH_NAMES[0]).toBe("January");
    expect(MONTH_NAMES[8]).toBe("September");
  });

  it("the page of years is stable and holds the year", () => {
    expect(yearPageStart(2026)).toBe(2016);
    expect(yearPageStart(2027)).toBe(2016);
    expect(yearPageStart(2028)).toBe(2028);
  });

  it("a month counts if any of its days fits the bounds", () => {
    const bounds = { min: "2026-09-10", max: "2026-10-20" };
    expect(monthAllowed(2026, 7, bounds)).toBe(false);
    expect(monthAllowed(2026, 8, bounds)).toBe(true);
    expect(monthAllowed(2026, 9, bounds)).toBe(true);
    expect(monthAllowed(2026, 10, bounds)).toBe(false);
    expect(monthAllowed(1990, 0)).toBe(true);
  });

  it("a year counts if any of its days fits the bounds", () => {
    const bounds = { min: "2026-09-10", max: "2027-01-05" };
    expect(yearAllowed(2025, bounds)).toBe(false);
    expect(yearAllowed(2026, bounds)).toBe(true);
    expect(yearAllowed(2027, bounds)).toBe(true);
    expect(yearAllowed(2028, bounds)).toBe(false);
  });
});
