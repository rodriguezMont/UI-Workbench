import { describe, expect, it } from "vitest";

import { TEXT_LIMITS, charCount, defaultMaxLength } from "./text-limits";

describe("free-text ceilings", () => {
  it("gives every free-text type a ceiling", () => {
    for (const type of ["text", "search", "email", "url", "tel", "password"]) {
      expect(defaultMaxLength(type), type).toBeGreaterThan(0);
    }
  });

  it("treats an input without a type as text", () => {
    expect(defaultMaxLength()).toBe(TEXT_LIMITS.text);
  });

  it("gives no ceiling to types that are not free text", () => {
    for (const type of ["number", "date", "time", "textarea"]) {
      expect(defaultMaxLength(type), type).toBeUndefined();
    }
  });

  it("counts characters, not UTF-16 units", () => {
    expect(charCount("café 👍")).toBe(6);
  });
});
