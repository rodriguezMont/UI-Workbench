import { describe, expect, it } from "vitest";

import { IMAGE_FORMATS, checkImageFile, describeOutput, isLowResolution, rotatedSize } from "./image-formats";

describe("the image formats", () => {
  it("the output size keeps the declared aspect ratio", () => {
    for (const f of Object.values(IMAGE_FORMATS)) expect(f.width / f.height, f.id).toBeCloseTo(f.aspect, 5);
  });

  it("the logo is the only one cropped as a circle — and it is saved square", () => {
    const round = Object.values(IMAGE_FORMATS).filter((f) => f.shape === "round");
    expect(round.map((f) => f.id)).toEqual(["logo"]);
    expect(IMAGE_FORMATS.logo.width).toBe(IMAGE_FORMATS.logo.height);
  });
});

describe("the box of a rotated image", () => {
  it("a quarter turn swaps width and height", () => {
    expect(rotatedSize(1600, 1200, 90)).toEqual({ width: 1200, height: 1600 });
    expect(rotatedSize(1600, 1200, -90)).toEqual({ width: 1200, height: 1600 });
  });

  it("0 or 180 degrees changes nothing", () => {
    expect(rotatedSize(1600, 1200, 0)).toEqual({ width: 1600, height: 1200 });
    expect(rotatedSize(1600, 1200, 180)).toEqual({ width: 1600, height: 1200 });
  });

  it("any other angle grows both", () => {
    const r = rotatedSize(100, 100, 45);
    expect(r.width).toBeGreaterThan(100);
    expect(r.height).toBeGreaterThan(100);
  });
});

describe("the small-image warning", () => {
  it("warns below half the output width, and only there", () => {
    const cover = IMAGE_FORMATS.cover;
    expect(isLowResolution({ x: 0, y: 0, width: 799, height: 200 }, cover)).toBe(true);
    expect(isLowResolution({ x: 0, y: 0, width: 800, height: 200 }, cover)).toBe(false);
  });
});

describe("describing the produced file", () => {
  it("says size, type and weight", () => {
    expect(describeOutput(84 * 1024, "image/webp", IMAGE_FORMATS.cover)).toBe("1600×400 · WEBP · 84 KB");
  });

  it("a tiny file does not become zero", () => {
    expect(describeOutput(10, "image/jpeg", IMAGE_FORMATS.logo)).toBe("512×512 · JPEG · 1 KB");
  });
});

describe("checking the chosen file", () => {
  const MB = 1024 * 1024;

  it("accepts JPG, PNG and WebP within the limit", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp"]) expect(checkImageFile({ size: MB, type }, 5 * MB), type).toBeNull();
  });

  it("refuses what is not an accepted image, before the size", () => {
    expect(checkImageFile({ size: 99 * MB, type: "image/gif" }, 5 * MB)).toMatch(/JPG, PNG, or WebP/);
    expect(checkImageFile({ size: 1, type: "application/pdf" }, 5 * MB)).toMatch(/isn't an image/);
  });

  it("refuses above the limit and says both numbers", () => {
    expect(checkImageFile({ size: 6.2 * MB, type: "image/png" }, 5 * MB)).toBe("The image is 6.2 MB, and the limit is 5 MB.");
  });
});
