import { describe, expect, it } from "vitest";

import { acceptsFile, checkFile, describeAccept, fileKey, formatBytes } from "./file-check";

const MB = 1024 * 1024;
const DOCS = "application/pdf,image/jpeg,image/png";

describe("the accepted format", () => {
  it("accepts by type, by family and by extension", () => {
    expect(acceptsFile({ name: "a.pdf", type: "application/pdf" }, DOCS)).toBe(true);
    expect(acceptsFile({ name: "a.gif", type: "image/gif" }, "image/*")).toBe(true);
    expect(acceptsFile({ name: "CONTRACT.PDF", type: "" }, ".pdf")).toBe(true);
  });

  it("refuses what is not on the list", () => {
    expect(acceptsFile({ name: "a.docx", type: "application/msword" }, DOCS)).toBe(false);
    expect(acceptsFile({ name: "a.gif", type: "image/gif" }, DOCS)).toBe(false);
  });

  it("with no list, accepts everything", () => {
    expect(acceptsFile({ name: "a.zip", type: "application/zip" }, "")).toBe(true);
  });

  it("describes formats by the names people know, without repeating one", () => {
    expect(describeAccept(DOCS)).toBe("PDF, JPG, or PNG");
    expect(describeAccept("image/jpeg,.jpg,.jpeg")).toBe("JPG");
    expect(describeAccept("application/pdf,image/png")).toBe("PDF or PNG");
    expect(describeAccept("application/pdf,image/*")).toBe("PDF or image");
  });
});

describe("the size", () => {
  it("in KB below 1 MB, never zero", () => {
    expect(formatBytes(10)).toBe("1 KB");
    expect(formatBytes(320 * 1024)).toBe("320 KB");
  });

  it("in MB with at most one decimal", () => {
    expect(formatBytes(4.2 * MB)).toBe("4.2 MB");
    expect(formatBytes(10 * MB)).toBe("10 MB");
  });
});

describe("the check before uploading", () => {
  const rule = { accept: DOCS, maxBytes: 10 * MB };

  it("lets the right file through", () => {
    expect(checkFile({ name: "a.pdf", type: "application/pdf", size: MB }, rule)).toBeNull();
  });

  it("a wrong format says which ones work", () => {
    expect(checkFile({ name: "a.docx", type: "application/msword", size: MB }, rule)).toBe(
      "“a.docx” isn't an accepted format. Upload PDF, JPG, or PNG.",
    );
  });

  it("empty is refused before the size", () => {
    expect(checkFile({ name: "a.pdf", type: "application/pdf", size: 0 }, rule)).toBe("“a.pdf” is empty.");
  });

  it("too large says the size and the limit", () => {
    expect(checkFile({ name: "a.pdf", type: "application/pdf", size: 12.4 * MB }, rule)).toBe(
      "“a.pdf” is 12.4 MB, and the limit is 10 MB.",
    );
  });

  it("the same file has the same key; another one does not", () => {
    const a = { name: "a.pdf", size: 1, lastModified: 1 };
    expect(fileKey(a)).toBe(fileKey({ ...a }));
    expect(fileKey(a)).not.toBe(fileKey({ ...a, lastModified: 2 }));
  });
});
