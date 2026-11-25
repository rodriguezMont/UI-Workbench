import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/**
 * The token rules the eye does not catch.
 *
 * Contrast is measured here, in both schemes, from the CSS itself: a ratio
 * typed into a comment keeps looking right after the color changes. The other
 * checks guard the decisions behind the token layer — roles never named after
 * a color, and a theme that maps only roles that exist.
 */

const read = (name: string) => readFileSync(fileURLToPath(new URL(name, import.meta.url)), "utf8");
const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");

const tokensCss = stripComments(read("./tokens.css"));
const themeCss = stripComments(read("./theme.css"));

type Scheme = "light" | "dark";
type Rgba = { r: number; g: number; b: number; a: number };

/** Every custom property declared in a top-level `:root { … }` block. */
function rootDeclarations(css: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const block of css.matchAll(/(?:^|\n):root\s*\{([^}]*)\}/g)) {
    for (const decl of (block[1] ?? "").split(";")) {
      const match = /^\s*(--[a-z0-9-]+)\s*:\s*([\s\S]+?)\s*$/.exec(decl);
      if (match) out.set(match[1]!, match[2]!.replace(/\s+/g, " "));
    }
  }
  return out;
}

const tokens = rootDeclarations(tokensCss);

/** Splits `a, b(c, d), e` on the commas that are not inside parentheses. */
function splitArgs(text: string): string[] {
  const args: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    else if (ch === "," && depth === 0) {
      args.push(text.slice(start, i).trim());
      start = i + 1;
    }
  }
  args.push(text.slice(start).trim());
  return args;
}

/** `name(inner)` → inner, when the whole value is that one function call. */
function callArgs(value: string, name: string): string[] | null {
  const prefix = `${name}(`;
  if (!value.startsWith(prefix) || !value.endsWith(")")) return null;
  return splitArgs(value.slice(prefix.length, -1));
}

function parseColor(value: string, scheme: Scheme, seen: string[] = []): Rgba {
  const v = value.trim();

  const varRef = /^var\((--[a-z0-9-]+)\)$/.exec(v);
  if (varRef) return resolve(varRef[1]!, scheme, seen);

  const ld = callArgs(v, "light-dark");
  if (ld) return parseColor(scheme === "light" ? ld[0]! : ld[1]!, scheme, seen);

  if (v === "transparent") return { r: 0, g: 0, b: 0, a: 0 };

  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v);
  if (hex) {
    const h = hex[1]!.length === 3 ? [...hex[1]!].map((c) => c + c).join("") : hex[1]!;
    const n = parseInt(h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
  }

  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[/,]\s*([\d.]+%?))?\s*\)$/.exec(v);
  if (rgb) {
    const alpha = rgb[4] === undefined ? 1 : rgb[4].endsWith("%") ? parseFloat(rgb[4]) / 100 : parseFloat(rgb[4]);
    return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]), a: alpha };
  }

  const mix = callArgs(v, "color-mix");
  if (mix) {
    expect(mix[0], `color-mix space in ${v}`).toBe("in srgb");
    const part = (arg: string) => {
      const m = /^(.*?)(?:\s+([\d.]+)%)?$/.exec(arg)!;
      return { color: parseColor(m[1]!, scheme, seen), weight: m[2] === undefined ? null : Number(m[2]) / 100 };
    };
    const a = part(mix[1]!);
    const b = part(mix[2]!);
    const wa = a.weight ?? 1 - (b.weight ?? 0.5);
    const wb = b.weight ?? 1 - wa;
    // CSS interpolates premultiplied by alpha.
    const alpha = a.color.a * wa + b.color.a * wb;
    const channel = (k: "r" | "g" | "b") =>
      alpha === 0 ? 0 : (a.color[k] * a.color.a * wa + b.color[k] * b.color.a * wb) / alpha;
    return { r: channel("r"), g: channel("g"), b: channel("b"), a: alpha };
  }

  throw new Error(`Unsupported color value: ${v}`);
}

function resolve(name: string, scheme: Scheme, seen: string[] = []): Rgba {
  if (seen.includes(name)) throw new Error(`Circular token: ${[...seen, name].join(" → ")}`);
  const value = tokens.get(name);
  if (value === undefined) throw new Error(`Unknown token: ${name}`);
  return parseColor(value, scheme, [...seen, name]);
}

/** A translucent color painted over an opaque one. */
function over(top: Rgba, bottom: Rgba): Rgba {
  const k = (c: "r" | "g" | "b") => top[c] * top.a + bottom[c] * (1 - top.a);
  return { r: k("r"), g: k("g"), b: k("b"), a: 1 };
}

function luminance({ r, g, b }: Rgba): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a: Rgba, b: Rgba): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * A surface as it is actually painted: translucent surfaces (the highlight)
 * are composited over the surface they sit on.
 */
const PAINTED_OVER: Record<string, string> = {
  "--surface-highlight": "--surface-raised",
};

function painted(name: string, scheme: Scheme): Rgba {
  const color = resolve(name, scheme);
  const base = PAINTED_OVER[name];
  return base ? over(color, painted(base, scheme)) : color;
}

const TEXT = 4.5;
const LARGE = 3;
const UI = 3;

/** [foreground, background, minimum ratio] */
const PAIRS: [string, string, number][] = [
  ...["--surface", "--surface-sunken", "--surface-raised", "--surface-hover", "--surface-highlight"].flatMap(
    (bg): [string, string, number][] => [
      ["--text-primary", bg, TEXT],
      ["--text-secondary", bg, TEXT],
      ["--accent", bg, TEXT],
    ],
  ),
  ...["--surface", "--surface-sunken", "--surface-raised"].flatMap((bg): [string, string, number][] => [
    ["--text-subtle", bg, TEXT],
    ["--accent-label", bg, TEXT],
    ["--signal-label", bg, TEXT],
    ["--link", bg, TEXT],
    ["--state-error", bg, TEXT],
    ["--state-success", bg, TEXT],
    ["--state-warning", bg, TEXT],
    ["--border-strong", bg, UI],
    ["--focus-ring", bg, UI],
  ]),
  ["--text-secondary", "--surface-emblem", TEXT],
  ["--text-on-accent", "--accent", TEXT],
  ["--action-text", "--action", TEXT],
  ["--text-inverse", "--action-alt", TEXT],
  ["--text-on-signal", "--signal", TEXT],
  ["--text-on-error", "--state-error-fill", TEXT],
  ["--text-on-success", "--state-success-fill", TEXT],
  ["--text-on-warning", "--state-warning-fill", TEXT],
  ["--text-on-contrast", "--surface-contrast", TEXT],
  ["--text-on-feature", "--surface-feature", TEXT],
  ["--text-on-feature-muted", "--surface-feature", TEXT],
  ["--text-figure", "--surface-feature", LARGE],
  ["--accent", "--surface", UI],
  ["--chart-1", "--surface", UI],
  ["--chart-2", "--surface", UI],
];

describe.each<Scheme>(["light", "dark"])("contrast in %s", (scheme) => {
  it.each(PAIRS)("%s on %s ≥ %s:1", (fg, bg, min) => {
    const background = painted(bg, scheme);
    const foreground = over(resolve(fg, scheme), background);
    expect(contrast(foreground, background)).toBeGreaterThanOrEqual(min);
  });

  it("the two chart series differ in lightness, not only in hue", () => {
    // Told apart in grayscale and by people who do not see the hue difference.
    const one = luminance(resolve("--chart-1", scheme));
    const two = luminance(resolve("--chart-2", scheme));
    expect(contrast(resolve("--chart-1", scheme), resolve("--chart-2", scheme))).toBeGreaterThanOrEqual(1.5);
    expect(one).not.toBe(two);
  });

  it("a highlighted bar reads against its receded neighbors", () => {
    const soft = over(resolve("--chart-1-soft", scheme), painted("--surface", scheme));
    expect(contrast(resolve("--chart-1", scheme), soft)).toBeGreaterThanOrEqual(1.8);
  });
});

describe("token layer", () => {
  /** Hue words that must never name a token: roles say what, not which color. */
  const COLOR_WORDS =
    /(^|-)(red|green|blue|cyan|teal|navy|azure|indigo|violet|purple|magenta|pink|rose|orange|amber|yellow|lime|emerald|brown|black|white|gray|grey|slate|zinc|silver|gold)(-|$)/;

  const names = (css: string) => [...css.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]!);

  it("no token is named after a color", () => {
    const offenders = [...names(tokensCss), ...names(themeCss)].filter((n) => COLOR_WORDS.test(n.slice(2)));
    expect(offenders).toEqual([]);
  });

  it("the Tailwind theme maps only roles that exist, never scales", () => {
    const refs = [...themeCss.matchAll(/var\((--[a-z0-9-]+)\)/g)].map((m) => m[1]!);
    expect(refs.filter((r) => !tokens.has(r))).toEqual([]);
    expect(refs.filter((r) => /^--(neutral|accent)-\d+$/.test(r))).toEqual([]);
  });

  it("the default Tailwind palette is removed", () => {
    expect(themeCss).toMatch(/--color-\*\s*:\s*initial/);
  });
});
