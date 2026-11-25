import { describe, expect, it } from "vitest";

import { OVERLAY_DIALOG_QUERY, frameForWidth, scrollToFitBelow } from "./overlay";

describe("frameForWidth — the frame follows the width", () => {
  it("is a sheet below 768 and a dialog from 768 up", () => {
    expect(frameForWidth(375)).toBe("sheet");
    expect(frameForWidth(767)).toBe("sheet");
    expect(frameForWidth(768)).toBe("dialog");
    expect(frameForWidth(1920)).toBe("dialog");
  });

  it("uses the same breakpoint in the browser query", () => {
    expect(OVERLAY_DIALOG_QUERY).toBe("(min-width: 768px)");
  });
});

describe("scrollToFitBelow", () => {
  const base = { panelHeight: 446, viewportHeight: 583 };

  it("does not scroll when the panel fits below", () => {
    expect(scrollToFitBelow({ ...base, anchorTop: 100, anchorBottom: 120 })).toBe(0);
  });

  it("scrolls exactly what is missing", () => {
    // 300 + 6 + 446 + 8 - 583 = 177, and the field stays below 84.
    expect(scrollToFitBelow({ ...base, anchorTop: 280, anchorBottom: 300 })).toBe(177);
  });

  it("never lifts the field under the sticky header", () => {
    // 257 would be missing, but the field may only rise to 84: scrolls 116.
    expect(scrollToFitBelow({ ...base, anchorTop: 200, anchorBottom: 380 })).toBe(116);
  });

  it("does not scroll backwards when the field is already at the top", () => {
    expect(scrollToFitBelow({ ...base, anchorTop: 50, anchorBottom: 540 })).toBe(0);
  });
});
