import { useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  Bell,
  Calendar,
  ChevronRight,
  CircleCheck,
  CircleX,
  Clock,
  Download,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  Settings,
  Share2,
  Star,
  Trash2,
  User,
  type LucideIcon,
} from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { messages } from "@/messages";

import { Piece, PieceNote, State } from "../Piece";
import { SectionPage } from "./SectionPage";
import { ContrastTable, StateFills, StateInAForm, StateInks, StateValues } from "./foundation-demos";

const t = messages.workbench.demos;

// ── Reading numbers from the screen ──────────────────────────────────────────
// The foundation pieces show sizes, radii and durations. A number typed next
// to a sample keeps looking right after the CSS changes; a number read from
// the rendered element cannot drift. So every figure below is measured.

/**
 * A value read from the rendered element, and read again whenever it resizes
 * (a breakpoint, a narrower window). `read` is the effect's dependency, so it
 * must be stable: every reader lives at module level.
 */
function useMeasured<T extends Element>(read: (el: T) => string) {
  const ref = useRef<T>(null);
  const [value, setValue] = useState<string | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    // The observer calls back once on `observe`: that is the first reading.
    const observer = new ResizeObserver(() => setValue(read(el)));
    observer.observe(el);
    return () => observer.disconnect();
  }, [read]);
  return [ref, value ?? t.measured.pending] as const;
}

/** `14px` → `14px`, `13.3333px` → `13.3px`; anything that is not a length passes through. */
function px(value: string): string {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? `${Math.round(n * 10) / 10}px` : value;
}

const readType = (el: Element) => {
  const cs = getComputedStyle(el);
  return `${px(cs.fontSize)} / ${px(cs.lineHeight)} · ${cs.fontWeight}`;
};
const readWeight = (el: Element) => getComputedStyle(el).fontWeight;
const readWidth = (el: Element) => px(String(el.getBoundingClientRect().width));
const readRadius = (el: Element) => px(getComputedStyle(el).borderTopLeftRadius);
/** The box height and the height of the `touch-area` pseudo-element — the area a finger can hit. */
const readTouch = (el: Element) =>
  t.grid.touchReadout(
    Math.round(el.getBoundingClientRect().height),
    Math.round(Number.parseFloat(getComputedStyle(el, "::after").height)),
  );
const readHeight = (el: Element) => px(String(el.getBoundingClientRect().height));
const tokenReader = (name: string) => (el: Element) => getComputedStyle(el).getPropertyValue(name).trim();

/** A measured figure, set apart from the prose around it. */
function Readout({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("whitespace-nowrap font-mono text-xs text-subtle", className)}>{children}</span>;
}

const SURFACES = [
  "surface",
  "surface-raised",
  "surface-sunken",
  "surface-chrome",
  "surface-hover",
  "surface-highlight",
  "surface-placeholder",
  "surface-emblem",
] as const;
const TEXT = ["text-primary", "text-secondary", "text-subtle", "accent", "link"] as const;
const BOUNDARIES = ["border", "border-strong", "focus-ring"] as const;
const FILLS = [
  { fill: "accent", ink: "text-on-accent" },
  { fill: "action", ink: "action-text" },
  { fill: "action-alt", ink: "text-inverse" },
  { fill: "signal", ink: "text-on-signal" },
  { fill: "surface-contrast", ink: "text-on-contrast" },
] as const;
const STATES = ["error", "success", "warning"] as const;

function Swatch({ name, children }: { name: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="flex h-16 items-center justify-center rounded-md border border-border text-sm"
        style={{ background: `var(--${name})` }}
      >
        {children}
      </div>
      <code className="font-mono text-xs text-secondary">--{name}</code>
    </div>
  );
}

function Ink({ name }: { name: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="flex h-16 items-center rounded-md border border-border bg-surface px-3" style={{ color: `var(--${name})` }}>
        {t.roles.sample}
      </p>
      <code className="font-mono text-xs text-secondary">--{name}</code>
    </div>
  );
}

function Group({ title, note, wide = false, children }: { title: string; note?: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-xs font-medium uppercase tracking-wide text-subtle">
        {title}
        {note ? <span className="ml-2 normal-case tracking-normal text-secondary">{note}</span> : null}
      </h3>
      {wide ? children : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{children}</div>}
    </section>
  );
}

function Roles() {
  const g = t.roles.groups;
  return (
    <Piece id="roles" variant="plain">
      <div className="flex flex-col gap-8">
        <Group title={g.surface}>
          {SURFACES.map((name) => (
            <Swatch key={name} name={name} />
          ))}
        </Group>
        <Group title={g.text}>
          {TEXT.map((name) => (
            <Ink key={name} name={name} />
          ))}
        </Group>
        <Group title={g.boundary}>
          {BOUNDARIES.map((name) => (
            <div key={name} className="flex flex-col gap-1.5">
              <div className="h-16 rounded-md border-2 bg-surface" style={{ borderColor: `var(--${name})` }} />
              <code className="font-mono text-xs text-secondary">--{name}</code>
            </div>
          ))}
        </Group>
        <Group title={g.accent}>
          {FILLS.map(({ fill, ink }) => (
            <Swatch key={fill} name={fill}>
              <span style={{ color: `var(--${ink})` }}>{t.roles.sample}</span>
            </Swatch>
          ))}
        </Group>
        <Group title={g.state}>
          {STATES.map((state) => (
            <Swatch key={state} name={`state-${state}-fill`}>
              <span style={{ color: `var(--text-on-${state})` }}>{t.roles.sample}</span>
            </Swatch>
          ))}
          {STATES.map((state) => (
            <Ink key={`${state}-ink`} name={`state-${state}`} />
          ))}
        </Group>
        <Group title={g.chart}>
          <Swatch name="chart-1" />
          <Swatch name="chart-1-soft" />
          <Swatch name="chart-2" />
          <Swatch name="ornament-gradient" />
        </Group>
        <Group title={g.feature} note={t.roles.notes.feature}>
          <div className="col-span-2 flex flex-col gap-1 rounded-lg bg-surface-feature p-5">
            <span className="text-4xl font-bold text-figure">1,284</span>
            <span className="text-on-feature">{t.roles.sample}</span>
            <span className="text-sm text-on-feature-muted">{t.roles.sample}</span>
          </div>
        </Group>
        <Group title={g.forcedDark} note={t.roles.notes.forcedDark}>
          <div data-theme="dark" className="col-span-2 flex flex-col gap-1 rounded-lg border border-border bg-surface p-5">
            <span className="text-primary">{t.roles.sample}</span>
            <span className="text-secondary">{t.roles.sample}</span>
            <span className="text-accent">{t.roles.sample}</span>
          </div>
        </Group>
        <Group title={t.roles.contrastTitle} note={t.roles.contrastNote} wide>
          <ContrastTable />
        </Group>
        <PieceNote paragraphs={t.roles.explain} />
      </div>
    </Piece>
  );
}

/** A logo with its rendered height under it, read from the screen. */
function LogoSample({ variant, height }: { variant: "full" | "mark"; height: number }) {
  const [ref, value] = useMeasured<HTMLSpanElement>(readHeight);
  return (
    <span className="inline-flex flex-col items-center gap-1.5">
      <span ref={ref} className="inline-flex">
        <Logo variant={variant} height={height} />
      </span>
      <Readout>{value}</Readout>
    </span>
  );
}

// ── Typography ───────────────────────────────────────────────────────────────

/**
 * The steps as the workbench and the components actually use them: each
 * class here is the one written where that kind of text appears.
 */
const TYPE_SCALE = [
  { step: "display", className: "text-4xl font-bold" },
  { step: "page", className: "text-3xl font-bold" },
  { step: "section", className: "text-xl font-bold" },
  { step: "card", className: "text-base font-bold" },
  { step: "body", className: "text-base" },
  { step: "field", className: "field-text" },
  { step: "supporting", className: "text-sm" },
  { step: "caption", className: "text-xs font-medium" },
] as const satisfies readonly { step: keyof typeof t.typography.steps; className: string }[];

const WEIGHTS = [
  { weight: "regular", className: "font-normal" },
  { weight: "medium", className: "font-medium" },
  { weight: "bold", className: "font-bold" },
] as const satisfies readonly { weight: keyof typeof t.typography.weightNames; className: string }[];

function TypeStep({ step, className }: (typeof TYPE_SCALE)[number]) {
  const [ref, value] = useMeasured<HTMLParagraphElement>(readType);
  return (
    <li className="flex flex-col gap-1.5 py-3 sm:flex-row sm:items-baseline sm:gap-6">
      <p ref={ref} className={cn("min-w-0 flex-1", className)}>
        {t.typography.sample}
      </p>
      <div className="flex shrink-0 flex-col gap-0.5 sm:w-64 sm:items-end sm:text-right">
        <span className="text-xs text-secondary">{t.typography.steps[step]}</span>
        <Readout>
          <code className="text-primary">{className}</code> · {value}
        </Readout>
      </div>
    </li>
  );
}

function WeightSample({ weight, className }: (typeof WEIGHTS)[number]) {
  const [ref, value] = useMeasured<HTMLParagraphElement>(readWeight);
  return (
    <li className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
      <p ref={ref} className={className}>
        {t.typography.weightNames[weight]}
      </p>
      <Readout>
        <code className="text-primary">{className}</code> · {value}
      </Readout>
    </li>
  );
}

function MeasureSample() {
  const [ref, value] = useMeasured<HTMLParagraphElement>(readWidth);
  return (
    <div className="flex w-full flex-col gap-2">
      <p ref={ref} className="max-w-[var(--measure)] border-r-2 border-dashed border-accent pr-3">
        {t.typography.measureSample}
      </p>
      <Readout>
        <code className="text-primary">max-w-[var(--measure)]</code> · {value}
      </Readout>
    </div>
  );
}

function Typography() {
  const ty = t.typography;
  return (
    <Piece id="typography">
      <State label={ty.scale} note={ty.scaleNote} wide>
        <ul className="w-full divide-y divide-border rounded-lg border border-border bg-surface px-4">
          {TYPE_SCALE.map((s) => (
            <TypeStep key={s.step} {...s} />
          ))}
        </ul>
      </State>
      <State label={ty.weights} note={ty.weightsNote}>
        <ul className="flex w-full flex-col gap-2">
          {WEIGHTS.map((w) => (
            <WeightSample key={w.weight} {...w} />
          ))}
        </ul>
      </State>
      <State label={ty.families} note={ty.familiesNote}>
        <dl className="flex w-full flex-col gap-3">
          <div>
            <dt className="text-xs text-secondary">{ty.sans}</dt>
            <dd className="font-sans">{ty.sample}</dd>
          </div>
          <div>
            <dt className="text-xs text-secondary">{ty.mono}</dt>
            <dd className="font-mono text-sm">{ty.monoSample}</dd>
          </div>
        </dl>
      </State>
      <State label={ty.measure} note={ty.measureNote} wide>
        <MeasureSample />
      </State>
      <PieceNote paragraphs={[ty.note, ty.noteField]} />
    </Piece>
  );
}

// ── Grid and rhythm ──────────────────────────────────────────────────────────

/** Steps of `--space-unit`; also Tailwind's spacing steps (`gap-3` is 3 of them). */
const SPACE_STEPS = [1, 2, 3, 4, 6, 8, 12, 16] as const;
const RADII = ["sm", "md", "lg", "full"] as const;

function SpaceStep({ n }: { n: number }) {
  const [ref, value] = useMeasured<HTMLDivElement>(readWidth);
  return (
    <li className="flex items-center gap-3">
      <code className="w-6 shrink-0 text-right font-mono text-xs text-primary">{n}</code>
      <div ref={ref} className="h-3 shrink-0 rounded-sm bg-accent" style={{ width: `calc(var(--space-unit) * ${n})` }} />
      <Readout>{value}</Readout>
    </li>
  );
}

function RadiusSample({ radius }: { radius: (typeof RADII)[number] }) {
  const [ref, value] = useMeasured<HTMLDivElement>(readRadius);
  return (
    <li className="flex flex-col items-center gap-1.5">
      <div
        ref={ref}
        className="h-12 w-12 border border-border-strong bg-surface-sunken"
        style={{ borderRadius: `var(--radius-${radius})` }}
      />
      <code className="font-mono text-xs text-primary">{radius}</code>
      <Readout>{value}</Readout>
    </li>
  );
}

/**
 * A button with its touch area drawn: the dashed line is the outline of the
 * `touch-area` utility's own pseudo-element, not a rectangle drawn beside it,
 * so it changes when the utility does. `md` gets the utility too, to show the
 * area and the box coincide there — half of the lesson.
 *
 * The button is a sample, not a control: `inert` keeps it out of the Tab
 * order and the accessibility tree; the readout stays readable.
 */
function TouchSample({ size }: { size: "sm" | "icon-sm" | "md" }) {
  const [ref, value] = useMeasured<HTMLButtonElement>(readTouch);
  return (
    <div className="flex flex-col items-center gap-3">
      <div inert>
        <Button
          ref={ref}
          size={size}
          variant="secondary"
          className="relative touch-area [&::after]:outline-1 [&::after]:outline-accent [&::after]:outline-dashed"
        >
          {size === "icon-sm" ? <Plus size={16} aria-hidden /> : size}
        </Button>
      </div>
      <Readout>
        <code className="text-primary">{size}</code> · {value}
      </Readout>
    </div>
  );
}

function Grid() {
  const g = t.grid;
  return (
    <Piece id="grid">
      <State label={g.space} note={g.spaceNote}>
        <ul className="flex flex-col gap-2">
          {SPACE_STEPS.map((n) => (
            <SpaceStep key={n} n={n} />
          ))}
        </ul>
      </State>
      <State label={g.radius} note={g.radiusNote}>
        <ul className="flex flex-wrap items-end gap-5">
          {RADII.map((r) => (
            <RadiusSample key={r} radius={r} />
          ))}
        </ul>
      </State>
      <State label={g.touch} note={g.touchNote} wide>
        <div className="flex w-full flex-col gap-5">
          <p className="max-w-[var(--measure)] text-sm text-secondary">{g.touchText}</p>
          <div className="flex flex-wrap items-end gap-x-10 gap-y-5 pb-1">
            <TouchSample size="sm" />
            <TouchSample size="icon-sm" />
            <TouchSample size="md" />
          </div>
        </div>
      </State>
      <PieceNote paragraphs={[g.note]} />
    </Piece>
  );
}

// ── Motion ───────────────────────────────────────────────────────────────────

const DURATIONS = [
  { token: "--motion-instant", use: "instant" },
  { token: "--motion-fast", use: "fast" },
  { token: "--motion-base", use: "base" },
  { token: "--motion-slow", use: "slow" },
] as const satisfies readonly { token: string; use: keyof typeof t.motion.durationUses }[];

const EASINGS = [
  { token: "--motion-ease", use: "ease" },
  { token: "--motion-ease-out", use: "easeOut" },
  { token: "--motion-ease-in", use: "easeIn" },
] as const satisfies readonly { token: string; use: keyof typeof t.motion.easingUses }[];

/** One reader per token, built once, so `useMeasured` gets a stable function. */
const MOTION_READERS = Object.fromEntries(
  [...DURATIONS, ...EASINGS].map(({ token }) => [token, tokenReader(token)]),
) as Record<string, (el: Element) => string>;

/** The 40 × 40 drawing of a `cubic-bezier()` value, or nothing while it is unread. */
function bezierPath(value: string): string | null {
  const args = /cubic-bezier\(([^)]+)\)/.exec(value)?.[1]?.split(",").map(Number);
  if (!args || args.length !== 4 || args.some((n) => !Number.isFinite(n))) return null;
  const [x1, y1, x2, y2] = args as [number, number, number, number];
  const at = (x: number, y: number) => `${x * 40} ${40 - y * 40}`;
  return `M ${at(0, 0)} C ${at(x1, y1)}, ${at(x2, y2)}, ${at(1, 1)}`;
}

/** The bar that travels: a quarter of the track at rest, the whole track when played. */
function Track({ played, style }: { played: boolean; style: React.CSSProperties }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-surface-sunken">
      <div className={cn("h-full rounded-full bg-accent transition-[width]", played ? "w-full" : "w-1/4")} style={style} />
    </div>
  );
}

function DurationRow({ token, use, played }: (typeof DURATIONS)[number] & { played: boolean }) {
  const [ref, value] = useMeasured<HTMLLIElement>(MOTION_READERS[token]!);
  return (
    <li ref={ref} className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <code className="font-mono text-xs text-primary">{token}</code>
        <Readout>{value}</Readout>
      </div>
      <p className="text-xs text-secondary">{t.motion.durationUses[use]}</p>
      <Track played={played} style={{ transitionDuration: `var(${token})`, transitionTimingFunction: "var(--motion-ease)" }} />
    </li>
  );
}

function EasingRow({ token, use, played }: (typeof EASINGS)[number] & { played: boolean }) {
  const [ref, value] = useMeasured<HTMLLIElement>(MOTION_READERS[token]!);
  const path = bezierPath(value);
  return (
    <li ref={ref} className="flex items-center gap-4">
      <svg viewBox="-2 -2 44 44" width={44} height={44} aria-hidden className="shrink-0 fill-none">
        <rect x={0} y={0} width={40} height={40} className="stroke-border" strokeWidth={1} />
        {path ? <path d={path} className="stroke-accent" strokeWidth={2} strokeLinecap="round" /> : null}
      </svg>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <code className="font-mono text-xs text-primary">{token}</code>
          <Readout>{value}</Readout>
        </div>
        <p className="text-xs text-secondary">{t.motion.easingUses[use]}</p>
        <Track played={played} style={{ transitionDuration: "var(--motion-slow)", transitionTimingFunction: `var(${token})` }} />
      </div>
    </li>
  );
}

/**
 * A list of rows and the button that plays them. A button, not a hover: a
 * hover cannot be reached by keyboard or by touch.
 */
function MotionDemo({ label, children }: { label: string; children: (played: boolean) => React.ReactNode }) {
  const [played, setPlayed] = useState(false);
  return (
    <div role="group" aria-label={label} className="flex w-full flex-col gap-4">
      <ul className="flex flex-col gap-4">{children(played)}</ul>
      <Button size="sm" variant="secondary" className="self-start" onClick={() => setPlayed((p) => !p)}>
        {played ? t.motion.rewind : t.motion.play}
      </Button>
    </div>
  );
}

function Motion() {
  const mo = t.motion;
  return (
    <Piece id="motion">
      <State label={mo.durations} note={mo.durationsNote}>
        <MotionDemo label={mo.durations}>
          {(played) => DURATIONS.map((d) => <DurationRow key={d.token} {...d} played={played} />)}
        </MotionDemo>
      </State>
      <State label={mo.easings} note={mo.easingsNote}>
        <MotionDemo label={mo.easings}>
          {(played) => EASINGS.map((e) => <EasingRow key={e.token} {...e} played={played} />)}
        </MotionDemo>
      </State>
      <PieceNote paragraphs={[mo.note]} />
    </Piece>
  );
}

// ── Icons ────────────────────────────────────────────────────────────────────

/** The meaning, the icon, and the name to import it by. */
const ICON_SET = [
  { meaning: "search", Icon: Search, code: "Search" },
  { meaning: "location", Icon: MapPin, code: "MapPin" },
  { meaning: "phone", Icon: Phone, code: "Phone" },
  { meaning: "email", Icon: Mail, code: "Mail" },
  { meaning: "date", Icon: Calendar, code: "Calendar" },
  { meaning: "time", Icon: Clock, code: "Clock" },
  { meaning: "rating", Icon: Star, code: "Star" },
  { meaning: "verified", Icon: BadgeCheck, code: "BadgeCheck" },
  { meaning: "notifications", Icon: Bell, code: "Bell" },
  { meaning: "settings", Icon: Settings, code: "Settings" },
  { meaning: "account", Icon: User, code: "User" },
  { meaning: "edit", Icon: Pencil, code: "Pencil" },
  { meaning: "remove", Icon: Trash2, code: "Trash2" },
  { meaning: "download", Icon: Download, code: "Download" },
  { meaning: "share", Icon: Share2, code: "Share2" },
  { meaning: "next", Icon: ChevronRight, code: "ChevronRight" },
] as const satisfies readonly { meaning: keyof typeof t.icons.names; Icon: LucideIcon; code: string }[];

const ICON_SIZES = [16, 20, 24, 32, 40] as const;

function IconSizes({ absolute }: { absolute?: boolean }) {
  return (
    <ul className="flex flex-wrap items-end gap-5">
      {ICON_SIZES.map((size) => (
        <li key={size} className="flex flex-col items-center gap-1.5">
          <Bell size={size} strokeWidth={2} absoluteStrokeWidth={absolute} aria-hidden />
          <Readout>{size}</Readout>
        </li>
      ))}
    </ul>
  );
}

const ICON_COLORS = [
  { sample: "secondary", Icon: Bell, className: "text-secondary" },
  { sample: "accent", Icon: Star, className: "text-accent" },
  { sample: "success", Icon: CircleCheck, className: "text-success" },
  { sample: "error", Icon: CircleX, className: "text-error" },
] as const satisfies readonly { sample: keyof typeof t.icons.colorSamples; Icon: LucideIcon; className: string }[];

function Icons() {
  const ic = t.icons;
  return (
    <Piece id="icons">
      <State label={ic.set} note={ic.setNote} wide>
        <ul className="grid w-full grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-2">
          {ICON_SET.map(({ meaning, Icon, code }) => (
            <li key={meaning} className="flex flex-col items-center gap-1.5 rounded-md border border-border px-2 py-3">
              <Icon size={24} strokeWidth={2} aria-hidden />
              <span className="text-xs text-secondary">{ic.names[meaning]}</span>
              <code className="max-w-full truncate font-mono text-xs text-subtle">{code}</code>
            </li>
          ))}
        </ul>
      </State>
      <State label={ic.sizes} note={ic.sizesNote}>
        <IconSizes />
      </State>
      <State label={ic.fixed} note={ic.fixedNote}>
        <IconSizes absolute />
      </State>
      <State label={ic.color} note={ic.colorNote}>
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          {ICON_COLORS.map(({ sample, Icon, className }) => (
            <li key={sample} className={cn("flex items-center gap-1.5 text-sm font-medium", className)}>
              <Icon size={16} aria-hidden />
              {ic.colorSamples[sample]}
            </li>
          ))}
        </ul>
      </State>
      <PieceNote paragraphs={[ic.note, ic.noteA11y]} />
    </Piece>
  );
}

export function FoundationPage() {
  return (
    <SectionPage id="foundation">
      <Piece id="logo">
        <State label={t.logo.full} note={t.logo.fullNote}>
          <LogoSample variant="full" height={32} />
          <LogoSample variant="full" height={24} />
        </State>
        <State label={t.logo.mark} note={t.logo.markNote}>
          <LogoSample variant="mark" height={32} />
          <LogoSample variant="mark" height={20} />
          <LogoSample variant="mark" height={16} />
        </State>
        <State label={t.logo.onFeature} note={t.logo.onFeatureNote} wide>
          <div className="rounded-lg border border-border bg-surface-feature px-5 py-4 text-on-feature">
            <Logo height={28} />
          </div>
        </State>
        <PieceNote paragraphs={[t.logo.note]} />
      </Piece>
      <Roles />
      <Piece id="state-colors">
        <State label={t.stateColors.ink} note={t.stateColors.inkNote}>
          <StateInks />
        </State>
        <State label={t.stateColors.fill} note={t.stateColors.fillNote}>
          <StateFills />
        </State>
        <State label={t.stateColors.form} note={t.stateColors.formNote}>
          <StateInAForm />
        </State>
        <State label={t.stateColors.values} note={t.stateColors.valuesNote}>
          <StateValues />
        </State>
        <PieceNote paragraphs={t.stateColors.explain} />
      </Piece>
      <Typography />
      <Grid />
      <Motion />
      <Icons />
    </SectionPage>
  );
}
