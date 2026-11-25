import { describe, expect, it } from "vitest";

import { messages } from "@/messages";

import { applyMask } from "./mask";
import { checkPhone, countries, examplePhone, phoneSpec, readPasted, toE164 } from "./phone";

describe("countries", () => {
  it("lists the US first, the rest by name", () => {
    const list = countries();
    expect(list[0]).toMatchObject({ code: "US", callingCode: "1", name: "United States" });
    const names = list.slice(1).map((c) => c.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "en-US")));
  });

  it("gives every country a name and a calling code", () => {
    for (const c of countries()) {
      expect(c.name, c.code).not.toBe("");
      expect(c.callingCode, c.code).toMatch(/^\d+$/);
    }
  });
});

describe("the country mask", () => {
  it("draws each country the way it writes numbers", () => {
    expect(applyMask(phoneSpec("US"), "2133734253")).toBe("(213) 373-4253");
    expect(applyMask(phoneSpec("PT"), "912345678")).toBe("912 345 678");
    expect(phoneSpec("US").max).toBe(10);
  });

  it("drops the country's own prefix however the number arrives", () => {
    expect(applyMask(phoneSpec("US"), "+1 213 373 4253")).toBe("(213) 373-4253");
  });

  it("uses a real US example as the placeholder", () => {
    expect(examplePhone("US")).toMatch(/^\(\d{3}\) \d{3}-\d{4}$/);
  });
});

describe("checking", () => {
  it("does not treat empty as an error, and passes a valid number", () => {
    expect(checkPhone("", "US")).toBeNull();
    expect(checkPhone("(213) 373-4253", "US")).toBeNull();
  });

  it("says what is missing on a short number, with an example", () => {
    expect(checkPhone("(213) 373", "US")).toBe(messages.ui.phone.incomplete(examplePhone("US")));
  });

  it("points at the area code when a US number does not exist", () => {
    expect(checkPhone("(123) 456-7890", "US")).toBe(messages.ui.phone.notInUS);
  });
});

describe("the submitted value", () => {
  it("is E.164 for a valid number and empty otherwise", () => {
    expect(toE164("(213) 373-4253", "US")).toBe("+12133734253");
    expect(toE164("(123) 456-7890", "US")).toBe("");
    expect(toE164("", "US")).toBe("");
  });
});

describe("pasting", () => {
  it("switches the country when the paste carries another code", () => {
    expect(readPasted("+351 912 345 678", "US")).toEqual({ country: "PT", national: "912345678" });
  });

  it("leaves a plain national number to the mask", () => {
    expect(readPasted("213 373 4253", "US")).toBeNull();
  });
});
