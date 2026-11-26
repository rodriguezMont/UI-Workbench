import { useLayoutEffect, useRef, useState } from "react";
import { CircleAlert, CircleCheck, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { MINIMUM, contrast, type Rgba } from "@/lib/contrast";
import { messages } from "@/messages";

import { useWorkbenchTheme } from "../theme";

/**
 * The measured demos of the Foundation section: colors read from the rendered
 * page, never typed. A number written next to a swatch keeps looking right
 * after the token changes; a number read from the screen cannot drift.
 */

const t = messages.workbench.demos;

// ── Reading a painted color ────────────────────────────────────────────────

let canvas: CanvasRenderingContext2D | null | undefined;

/**
 * Paints `layers` bottom to top on a 1 × 1 canvas and reads the pixel: any
 * CSS color the browser computes (`oklch()`, `color-mix()`, a translucent
 * ink) comes out as sRGB, already composited. `null` where there is no canvas.
 */
function paint(...layers: string[]): Rgba | null {
  if (canvas === undefined) {
    canvas = typeof document === "undefined" ? null : (document.createElement("canvas").getContext("2d", { willReadFrequently: true }) ?? null);
  }
  if (!canvas) return null;
  canvas.clearRect(0, 0, 1, 1);
  for (const layer of layers) {
    canvas.fillStyle = layer;
    canvas.fillRect(0, 0, 1, 1);
  }
  const [r = 0, g = 0, b = 0] = canvas.getImageData(0, 0, 1, 1).data;
  return { r, g, b, a: 1 };
}

const hex = ({ r, g, b }: Rgba) => `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;

// ── The contrast table ─────────────────────────────────────────────────────

type Kind = "text" | "large" | "ui";
type Pair = { fg: string; bg: string; kind: Kind; role: keyof typeof t.roles.contrast.roles };

/**
 * The pairs a reader actually meets, grouped as the page groups the roles.
 * Every pair in the token test is held to its minimum; this table shows the
 * ones worth looking at, with the ratio the page is painting right now.
 */
const PAIRS: readonly Pair[] = [
  { fg: "text-primary", bg: "surface", kind: "text", role: "primary" },
  { fg: "text-secondary", bg: "surface", kind: "text", role: "secondary" },
  { fg: "text-subtle", bg: "surface", kind: "text", role: "subtle" },
  { fg: "link", bg: "surface", kind: "text", role: "link" },
  { fg: "accent", bg: "surface", kind: "text", role: "accent" },
  { fg: "state-error", bg: "surface", kind: "text", role: "errorInk" },
  { fg: "state-success", bg: "surface", kind: "text", role: "successInk" },
  { fg: "state-warning", bg: "surface", kind: "text", role: "warningInk" },
  { fg: "text-on-accent", bg: "accent", kind: "text", role: "onAccent" },
  { fg: "text-inverse", bg: "action-alt", kind: "text", role: "onActionAlt" },
  { fg: "text-on-error", bg: "state-error-fill", kind: "text", role: "onError" },
  { fg: "text-on-success", bg: "state-success-fill", kind: "text", role: "onSuccess" },
  { fg: "text-on-warning", bg: "state-warning-fill", kind: "text", role: "onWarning" },
  { fg: "text-on-feature", bg: "surface-feature", kind: "text", role: "onFeature" },
  { fg: "text-figure", bg: "surface-feature", kind: "large", role: "figure" },
  { fg: "border-strong", bg: "surface", kind: "ui", role: "control" },
  { fg: "focus-ring", bg: "surface", kind: "ui", role: "focus" },
  { fg: "chart-1", bg: "surface", kind: "ui", role: "chart1" },
  { fg: "chart-2", bg: "surface", kind: "ui", role: "chart2" },
];

type Verdict = "aaa" | "aa" | "fails";

function verdictOf(ratio: number, kind: Kind): Verdict {
  if (kind === "text") return ratio >= MINIMUM.enhanced ? "aaa" : ratio >= MINIMUM.text ? "aa" : "fails";
  return ratio >= MINIMUM.ui ? "aa" : "fails";
}

const VERDICT_CLASS: Record<Verdict, string> = {
  aaa: "border-success text-success",
  aa: "border-success text-success",
  fails: "border-error text-error",
};

/** The sample a row shows: text in the ink, or — for non-text roles — the shape that role draws. */
function Sample({ fg, bg, kind }: Pair) {
  if (kind === "ui") {
    return (
      <span className="flex h-9 w-24 items-center justify-center rounded-md" style={{ background: `var(--${bg})` }}>
        <span className="h-5 w-14 rounded-sm" style={{ outline: `2px solid var(--${fg})`, outlineOffset: fg === "focus-ring" ? 2 : 0 }} />
      </span>
    );
  }
  return (
    <span
      className={cn("flex h-9 w-24 items-center justify-center rounded-md", kind === "large" ? "text-xl font-bold" : "text-sm")}
      style={{ background: `var(--${bg})`, color: `var(--${fg})` }}
    >
      {t.roles.contrast.sample}
    </span>
  );
}

/**
 * Every ratio is measured from the colors the page paints, and measured again
 * when the theme changes — it follows light and dark on its own.
 */
export function ContrastTable() {
  const c = t.roles.contrast;
  const theme = useWorkbenchTheme();
  const probe = useRef<HTMLDivElement>(null);
  const [ratios, setRatios] = useState<(number | null)[]>([]);

  useLayoutEffect(() => {
    const el = probe.current;
    if (!el) return;
    // The probe resolves each role to the color the page is painting now.
    const resolve = (name: string) => {
      el.style.color = `var(--${name})`;
      return getComputedStyle(el).color;
    };
    setRatios(
      PAIRS.map(({ fg, bg }) => {
        const back = resolve(bg);
        const background = paint(back);
        const foreground = paint(back, resolve(fg));
        return background && foreground ? contrast(foreground, background) : null;
      }),
    );
  }, [theme]);

  return (
    <div className="w-full overflow-x-auto">
      <div ref={probe} aria-hidden className="hidden" />
      <table className="w-full min-w-[36rem] text-left text-sm">
        <caption className="mb-2 text-left text-xs text-secondary">{c.caption(theme === "dark" ? c.dark : c.light)}</caption>
        <thead className="text-xs uppercase tracking-wide text-subtle">
          <tr className="border-b border-border">
            <th scope="col" className="py-2 pr-3 font-medium">
              {c.headers.sample}
            </th>
            <th scope="col" className="py-2 pr-3 font-medium">
              {c.headers.pair}
            </th>
            <th scope="col" className="py-2 pr-3 font-medium">
              {c.headers.role}
            </th>
            <th scope="col" className="py-2 pr-3 text-right font-medium">
              {c.headers.ratio}
            </th>
            <th scope="col" className="py-2 font-medium">
              {c.headers.verdict}
            </th>
          </tr>
        </thead>
        <tbody>
          {PAIRS.map((pair, i) => {
            const ratio = ratios[i];
            const verdict = ratio == null ? null : verdictOf(ratio, pair.kind);
            return (
              <tr key={`${pair.fg}-${pair.bg}`} className="border-b border-border last:border-0">
                <td className="py-2 pr-3">
                  <Sample {...pair} />
                </td>
                <td className="py-2 pr-3 font-mono text-xs text-primary">
                  --{pair.fg}
                  <span className="block text-subtle">on --{pair.bg}</span>
                </td>
                <td className="py-2 pr-3 text-secondary">
                  {c.roles[pair.role]}
                  <span className="block text-xs text-subtle">{c.kinds[pair.kind]}</span>
                </td>
                <td className="py-2 pr-3 text-right font-mono tabular-nums text-primary">
                  {ratio == null ? t.measured.pending : `${ratio.toFixed(2)}:1`}
                </td>
                <td className="py-2">
                  {verdict ? (
                    <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-xs font-medium", VERDICT_CLASS[verdict])}>{c.verdicts[verdict]}</span>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── State colors ───────────────────────────────────────────────────────────

const STATES = [
  { state: "error", Icon: CircleAlert },
  { state: "success", Icon: CircleCheck },
  { state: "warning", Icon: TriangleAlert },
] as const;

/** Whole class names, so Tailwind finds them in the source. */
const INK_CLASS = { error: "text-error", success: "text-success", warning: "text-warning" } as const;

/** Each state as ink on the surface: always with an icon and words. */
export function StateInks() {
  const s = t.stateColors;
  return (
    <ul className="flex w-full flex-col gap-2 text-sm font-medium">
      {STATES.map(({ state, Icon }) => (
        <li key={state} className={cn("flex items-center gap-2", INK_CLASS[state])}>
          <Icon size={16} aria-hidden />
          {s.inkSamples[state]}
        </li>
      ))}
    </ul>
  );
}

const FILL_CLASS = {
  error: "bg-error-fill text-on-error",
  success: "bg-success-fill text-on-success",
  warning: "bg-warning-fill text-on-warning",
} as const;

/** Each state as a fill, with its own ink: chips, and one banner. */
export function StateFills() {
  const s = t.stateColors;
  return (
    <div className="flex w-full flex-col gap-3">
      <ul className="flex flex-wrap gap-2">
        {STATES.map(({ state, Icon }) => (
          <li key={state} className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", FILL_CLASS[state])}>
            <Icon size={14} aria-hidden />
            {s.chips[state]}
          </li>
        ))}
      </ul>
      <p className={cn("flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium", FILL_CLASS.error)}>
        <CircleAlert size={16} aria-hidden />
        {s.banner}
      </p>
    </div>
  );
}

/** The error next to the primary action: the two must not read as the same color. */
export function StateInAForm() {
  const s = t.stateColors;
  return (
    <div className="flex w-full flex-col gap-3">
      <Field label={s.fieldLabel} defaultValue={s.fieldValue} placeholder={s.fieldPlaceholder} error={s.fieldError} />
      <div>
        <Button>{s.save}</Button>
      </div>
    </div>
  );
}

const STATE_TOKENS = STATES.flatMap(({ state }) => [`state-${state}`, `state-${state}-fill`]);

/**
 * The values, read in both schemes at once: two probes, one forced light and
 * one forced dark, so the table shows both whatever the page is showing.
 */
export function StateValues() {
  const s = t.stateColors;
  const light = useRef<HTMLDivElement>(null);
  const dark = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState<Record<string, [string | null, string | null]>>({});

  useLayoutEffect(() => {
    const read = (el: HTMLDivElement | null, name: string) => {
      if (!el) return null;
      el.style.color = `var(--${name})`;
      const rgb = paint(getComputedStyle(el).color);
      return rgb ? hex(rgb) : null;
    };
    setValues(Object.fromEntries(STATE_TOKENS.map((name) => [name, [read(light.current, name), read(dark.current, name)]])));
  }, []);

  return (
    <div className="w-full overflow-x-auto">
      <div ref={light} data-theme="light" aria-hidden className="hidden" />
      <div ref={dark} data-theme="dark" aria-hidden className="hidden" />
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-subtle">
          <tr className="border-b border-border">
            <th scope="col" className="py-2 pr-3 font-medium">
              {s.headers.token}
            </th>
            <th scope="col" className="py-2 pr-3 font-medium">
              {s.headers.light}
            </th>
            <th scope="col" className="py-2 font-medium">
              {s.headers.dark}
            </th>
          </tr>
        </thead>
        <tbody>
          {STATE_TOKENS.map((name) => {
            const [l, d] = values[name] ?? [null, null];
            return (
              <tr key={name} className="border-b border-border last:border-0">
                <td className="py-2 pr-3 font-mono text-xs text-primary">--{name}</td>
                {[
                  { value: l, scheme: "light" },
                  { value: d, scheme: "dark" },
                ].map(({ value, scheme }) => (
                  <td key={scheme} className="py-2 pr-3">
                    <span className="inline-flex items-center gap-2 font-mono text-xs text-secondary">
                      <span data-theme={scheme} aria-hidden className="size-4 rounded-sm border border-border" style={{ background: `var(--${name})` }} />
                      {value ?? t.measured.pending}
                    </span>
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
