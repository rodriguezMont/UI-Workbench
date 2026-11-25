import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/**
 * Rules every library file must follow, checked on the source text. Each one
 * is a decision that breaks silently: nothing looks wrong on screen until a
 * consumer copies the file into an app with another router, or until the page
 * switches to the other color scheme.
 */

const SRC = fileURLToPath(new URL("../..", import.meta.url));
const LIBRARY_DIRS = ["components", "lib"].map((d) => join(SRC, d));

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

const files = LIBRARY_DIRS.flatMap(sources).map((path) => ({
  path: relative(SRC, path).replaceAll("\\", "/"),
  lines: readFileSync(path, "utf8").split("\n"),
}));

/** `file:line` for every non-comment line matching the pattern. */
function offenders(pattern: RegExp): string[] {
  return files.flatMap(({ path, lines }) =>
    lines
      .map((line, i) => ({ line, i }))
      .filter(({ line }) => pattern.test(line) && !/^\s*(\/\/|\*|\/\*)/.test(line))
      .map(({ i }) => `${path}:${i + 1}`),
  );
}

describe("library conventions", () => {
  it("finds the library files", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it("no component imports a router — links come in from outside", () => {
    expect(
      offenders(/from\s+["'](react-router(-dom)?|next\/(link|navigation|router)|@tanstack\/react-router|wouter)["']/),
    ).toEqual([]);
  });

  it("a text role never paints a background", () => {
    // Text roles flip from dark to light ink across schemes: as a fill they
    // would lighten an overlay in dark mode. Backgrounds have their own roles.
    expect(offenders(/\b(bg|from|via|to)-(primary|secondary|subtle|inverse)\b/)).toEqual([]);
  });

  it("hover and highlight never sink into the page background", () => {
    // The page background is darker than a card in light and near-black in
    // dark: as a hover it would open a hole in dark mode.
    expect(offenders(/(hover|highlighted\]|active):bg-surface-sunken/)).toEqual([]);
  });

  it("components read roles, never the scales or literal colors", () => {
    expect(offenders(/var\(--(neutral|accent)-\d+/)).toEqual([]);
    expect(offenders(/#[0-9a-fA-F]{3,8}\b|\b(rgba?|hsla?|oklch)\(/)).toEqual([]);
  });
});
