import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The favicon is served as is, so a browser parses it as strict XML: one
// malformed character and the tab shows no icon at all, with no error on the
// page itself. These are the rules it broke once, or could.
const svg = readFileSync(new URL("../public/favicon.svg", import.meta.url), "utf8");

describe("the favicon", () => {
  it("is an SVG with its namespace, linked from index.html", () => {
    expect(svg.trimStart().startsWith("<svg")).toBe(true);
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
    expect(html).toContain('<link rel="icon" type="image/svg+xml" href="/favicon.svg" />');
  });

  it("has no double hyphen inside a comment, which XML forbids", () => {
    const comments = [...svg.matchAll(/<!--([\s\S]*?)-->/g)].map((m) => m[1] ?? "");
    for (const body of comments) {
      expect(body).not.toContain("--");
      expect(body.endsWith("-")).toBe(false);
    }
  });

  it("has no bare ampersand or less-than outside markup", () => {
    expect(svg).not.toMatch(/&(?![a-z]+;|#\d+;|#x[0-9a-f]+;)/i);
    const text = svg.replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]+>/g, "");
    expect(text).not.toContain("<");
  });
});
