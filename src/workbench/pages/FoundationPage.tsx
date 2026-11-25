import { Logo } from "@/components/brand/logo";
import { messages } from "@/messages";

import { Piece, PieceNote, State } from "../Piece";
import { SectionPage } from "./SectionPage";

const t = messages.workbench.demos;

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

function Group({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-xs font-medium uppercase tracking-wide text-subtle">
        {title}
        {note ? <span className="ml-2 normal-case tracking-normal text-secondary">{note}</span> : null}
      </h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{children}</div>
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
        <PieceNote>
          <p className="max-w-[var(--measure)]">{t.roles.note}</p>
        </PieceNote>
      </div>
    </Piece>
  );
}

export function FoundationPage() {
  return (
    <SectionPage id="foundation">
      <Piece id="logo">
        <State label={t.logo.full} note={t.logo.fullNote}>
          <Logo height={32} />
        </State>
        <State label={t.logo.mark} note={t.logo.markNote}>
          <Logo variant="mark" height={32} />
          <Logo variant="mark" height={20} />
          <Logo variant="mark" height={16} />
        </State>
        <State label={t.logo.onFeature} note={t.logo.onFeatureNote} wide>
          <div className="rounded-lg bg-surface-feature px-5 py-4 text-on-feature">
            <Logo height={28} />
          </div>
        </State>
        <PieceNote>
          <p className="max-w-[var(--measure)]">{t.logo.note}</p>
        </PieceNote>
      </Piece>
      <Roles />
    </SectionPage>
  );
}
