import { useLayoutEffect, useRef, useState } from "react";
import { X } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/cn";
import { MINIMUM, contrast } from "@/lib/contrast";
import { messages } from "@/messages";

import { SAMPLE_LANDSCAPE } from "../samples";
import { useWorkbenchTheme } from "../theme";
import { paint } from "./foundation-demos";

/**
 * The logo piece's demos: the forms, the sizes in use, the grounds with their
 * measured contrast, one ink, the minimum, the clear space and the don'ts.
 */

const t = messages.workbench.demos;
const l = t.logo;

type Form = "full" | "stacked" | "mark";

/** One card per form: the logo, its name and where it goes. */
export function LogoForms() {
  const forms = [
    { variant: "mark", name: l.forms.mark, where: l.forms.markWhere },
    { variant: "full", name: l.forms.full, where: l.forms.fullWhere },
    { variant: "stacked", name: l.forms.stacked, where: l.forms.stackedWhere },
  ] as const satisfies readonly { variant: Form; name: string; where: string }[];
  return (
    <ul className="grid w-full gap-3 sm:grid-cols-3">
      {forms.map(({ variant, name, where }) => (
        <li key={variant} className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-5 text-center">
          <div className="flex h-24 items-center">
            <Logo variant={variant} height={variant === "stacked" ? 44 : 36} label={null} />
          </div>
          <div>
            <p className="text-sm font-bold text-primary">{name}</p>
            <p className="mt-0.5 text-xs text-secondary">{where}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Where each size is used today — the heights the code that renders it passes. */
const LOGO_USES = [
  { variant: "full", height: 28, where: "panel" },
  { variant: "full", height: 28, where: "headerWide" },
  { variant: "full", height: 24, where: "footer" },
  { variant: "full", height: 22, where: "headerPhone" },
  { variant: "full", height: 18, where: "headerNarrow" },
  { variant: "mark", height: 28, where: "panelCollapsed" },
  { variant: "mark", height: 26, where: "drawer" },
] as const satisfies readonly { variant: Form; height: number; where: keyof typeof t.logo.uses }[];

/** A logo with its rendered height, read from the screen. */
function MeasuredLogo({ variant, height }: { variant: Form; height: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState<string>(t.measured.pending);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    // The observer calls back once on `observe`: that is the first reading.
    const observer = new ResizeObserver(() => setSize(`${Math.round(el.getBoundingClientRect().height)}px`));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <span className="flex items-center gap-3">
      <span ref={ref} className="inline-flex">
        <Logo variant={variant} height={height} label={null} />
      </span>
      <span className="font-mono text-xs text-subtle">{size}</span>
    </span>
  );
}

export function LogoSizes() {
  return (
    <ul className="grid w-full gap-x-8 lg:grid-cols-2">
      {LOGO_USES.map(({ variant, height, where }) => (
        <li key={where} className="flex min-h-14 items-center justify-between gap-4 border-b border-border py-2">
          <MeasuredLogo variant={variant} height={height} />
          <span className="text-right text-sm text-secondary">{l.uses[where]}</span>
        </li>
      ))}
    </ul>
  );
}

/** The grounds a logo sits on, each with the ink that reads there. */
const LOGO_GROUNDS = [
  { bg: "surface", ink: "color", name: "surface" },
  { bg: "surface-sunken", ink: "color", name: "sunken" },
  { bg: "surface-chrome", ink: "color", name: "chrome" },
  { bg: "surface-feature", ink: "color", name: "feature" },
  { bg: "accent", ink: "mono", name: "accent" },
  { bg: "surface-contrast", ink: "mono", name: "contrast" },
] as const satisfies readonly { bg: string; ink: "color" | "mono"; name: keyof typeof t.logo.grounds }[];

/** The ink of the name (and of a mono mark) on each ground: the role that reads on it. */
const INK_ON: Record<(typeof LOGO_GROUNDS)[number]["bg"], string> = {
  surface: "text-primary",
  "surface-sunken": "text-primary",
  "surface-chrome": "text-primary",
  "surface-feature": "text-on-feature",
  accent: "text-on-accent",
  "surface-contrast": "text-on-contrast",
};

/**
 * Each ground with the logo on it, and the contrast of the mark against the
 * ground, measured from what the page paints and again when the theme
 * changes. A logo is a graphic object: its floor is 3:1.
 */
export function LogoGrounds() {
  const theme = useWorkbenchTheme();
  const probe = useRef<HTMLDivElement>(null);
  const [ratios, setRatios] = useState<(number | null)[]>([]);

  useLayoutEffect(() => {
    const el = probe.current;
    if (!el) return;
    const resolve = (name: string) => {
      el.style.color = `var(--${name})`;
      return getComputedStyle(el).color;
    };
    setRatios(
      LOGO_GROUNDS.map(({ bg, ink }) => {
        const ground = resolve(bg);
        const back = paint(ground);
        const mark = paint(ground, resolve(ink === "mono" ? INK_ON[bg] : "accent"));
        return back && mark ? contrast(mark, back) : null;
      }),
    );
  }, [theme]);

  return (
    <div className="w-full">
      <div ref={probe} aria-hidden className="hidden" />
      <ul className="grid w-full grid-cols-2 gap-3 md:grid-cols-3">
        {LOGO_GROUNDS.map(({ bg, ink, name }, i) => {
          const ratio = ratios[i];
          const passes = ratio != null && ratio >= MINIMUM.ui;
          return (
            <li key={bg} className="flex flex-col gap-2">
              <div
                className="flex h-24 items-center justify-center rounded-lg border border-border"
                style={{ background: `var(--${bg})`, color: `var(--${INK_ON[bg]})` }}
              >
                <Logo ink={ink} height={26} label={null} />
              </div>
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className="text-secondary">
                  {l.grounds[name]}
                  {ink === "mono" ? <span className="text-subtle"> · {l.monoInk}</span> : null}
                </span>
                <span className={cn("font-mono tabular-nums", ratio == null ? "text-subtle" : passes ? "text-success" : "text-error")}>
                  {ratio == null ? t.measured.pending : `${ratio.toFixed(2)}:1 ${passes ? "✓" : "✕"}`}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** One ink: positive on a light ground, negative on a dark one. */
export function LogoOneInk() {
  return (
    <div className="grid w-full grid-cols-2 gap-3">
      <figure className="flex flex-col items-center gap-2">
        <div className="flex h-24 w-full items-center justify-center rounded-lg border border-border bg-surface text-primary">
          <Logo ink="mono" height={26} label={null} />
        </div>
        <figcaption className="text-xs text-secondary">{l.positive}</figcaption>
      </figure>
      <figure className="flex flex-col items-center gap-2">
        <div className="flex h-24 w-full items-center justify-center rounded-lg border border-border bg-surface-feature text-on-feature">
          <Logo ink="mono" height={26} label={null} />
        </div>
        <figcaption className="text-xs text-secondary">{l.negative}</figcaption>
      </figure>
    </div>
  );
}

/** The smallest each form goes — the sizes the narrow header and the favicon use. */
export function LogoMinimum() {
  return (
    <ul className="flex w-full flex-wrap items-end gap-10">
      <li className="flex flex-col items-center gap-2">
        <Logo variant="mark" height={16} label={null} />
        <span className="text-xs text-secondary">{l.minMark}</span>
      </li>
      <li className="flex flex-col items-center gap-2">
        <Logo height={18} label={null} />
        <span className="text-xs text-secondary">{l.minFull}</span>
      </li>
    </ul>
  );
}

/** The clear space: a quarter of the mark's height on every side, drawn. */
export function LogoClearSpace() {
  const height = 40;
  return (
    <div className="flex w-full justify-center">
      <div className="relative rounded-sm outline-1 outline-accent outline-dashed" style={{ padding: height / 4 }}>
        <span aria-hidden className="absolute inset-0 rounded-sm bg-accent/10" />
        <span className="relative flex">
          <Logo height={height} label={null} />
        </span>
      </div>
    </div>
  );
}

/** What never to do, each shown small and crossed out. */
export function LogoDonts() {
  const donts = [
    {
      key: "stretch",
      node: (
        <span className="inline-flex scale-x-150">
          <Logo height={20} label={null} />
        </span>
      ),
    },
    {
      key: "rotate",
      node: (
        <span className="inline-flex -rotate-12">
          <Logo height={20} label={null} />
        </span>
      ),
    },
    {
      key: "recolor",
      node: (
        <span className="inline-flex text-warning">
          <Logo ink="mono" height={20} label={null} />
        </span>
      ),
    },
    {
      key: "effects",
      node: (
        <span className="inline-flex drop-shadow-[0_3px_4px_var(--accent)]">
          <Logo height={20} label={null} />
        </span>
      ),
    },
    {
      key: "busy",
      node: (
        <span className="absolute inset-0 flex items-center justify-center">
          <img src={SAMPLE_LANDSCAPE} alt="" className="absolute inset-0 size-full object-cover" />
          <span className="relative inline-flex text-primary">
            <Logo height={20} label={null} />
          </span>
        </span>
      ),
    },
  ] as const satisfies readonly { key: keyof typeof t.logo.donts; node: React.ReactNode }[];
  return (
    <ul className="grid w-full gap-3 [grid-template-columns:repeat(auto-fit,minmax(9.5rem,1fr))]">
      {donts.map(({ key, node }) => (
        <li key={key} className="flex flex-col gap-2">
          <div className="relative flex h-20 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface">
            {node}
            <X size={56} strokeWidth={1.5} aria-hidden className="absolute text-error opacity-80" />
          </div>
          <span className="text-xs text-secondary">{l.donts[key]}</span>
        </li>
      ))}
    </ul>
  );
}
