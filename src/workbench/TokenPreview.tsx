import { messages } from "@/messages";

import { Section } from "./Section";

/**
 * A plain look at the token roles in both schemes. It only paints the roles
 * so they can be judged by eye; contrast is measured by `tokens.test.ts`.
 */

const t = messages.workbench.tokens;

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

function InkSample({ name }: { name: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p
        className="flex h-16 items-center rounded-md border border-border bg-surface px-3"
        style={{ color: `var(--${name})` }}
      >
        {t.sample}
      </p>
      <code className="font-mono text-xs text-secondary">--{name}</code>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-medium text-secondary">{title}</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{children}</div>
    </section>
  );
}

export function TokenSection() {
  return (
    <Section id="tokens" heading={t.heading} intro={t.intro}>
      <div className="flex flex-col gap-8">
        <Group title={t.groups.surface}>
          {SURFACES.map((name) => (
            <Swatch key={name} name={name} />
          ))}
        </Group>

        <Group title={t.groups.text}>
          {TEXT.map((name) => (
            <InkSample key={name} name={name} />
          ))}
        </Group>

        <Group title={t.groups.boundary}>
          {BOUNDARIES.map((name) => (
            <div key={name} className="flex flex-col gap-1.5">
              <div className="h-16 rounded-md border-2 bg-surface" style={{ borderColor: `var(--${name})` }} />
              <code className="font-mono text-xs text-secondary">--{name}</code>
            </div>
          ))}
        </Group>

        <Group title={t.groups.accent}>
          {FILLS.map(({ fill, ink }) => (
            <Swatch key={fill} name={fill}>
              <span style={{ color: `var(--${ink})` }}>{t.sample}</span>
            </Swatch>
          ))}
        </Group>

        <Group title={t.groups.state}>
          {STATES.map((state) => (
            <Swatch key={state} name={`state-${state}-fill`}>
              <span style={{ color: `var(--text-on-${state})` }}>{t.sample}</span>
            </Swatch>
          ))}
          {STATES.map((state) => (
            <InkSample key={`${state}-ink`} name={`state-${state}`} />
          ))}
        </Group>

        <Group title={t.groups.chart}>
          <Swatch name="chart-1" />
          <Swatch name="chart-1-soft" />
          <Swatch name="chart-2" />
          <Swatch name="ornament-gradient" />
        </Group>

        <Group title={t.groups.feature}>
          <div className="col-span-2 flex flex-col gap-1 rounded-lg bg-surface-feature p-5">
            <span className="text-4xl font-bold text-figure">1,284</span>
            <span className="text-on-feature">{t.sample}</span>
            <span className="text-sm text-on-feature-muted">{t.sample}</span>
          </div>
        </Group>

        <div data-theme="dark" className="flex flex-col gap-4 rounded-lg border border-border bg-surface-sunken p-4">
          <p className="text-sm text-secondary">{t.forcedDark}</p>
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="text-primary">{t.sample}</p>
            <p className="text-secondary">{t.sample}</p>
            <p className="text-accent">{t.sample}</p>
          </div>
        </div>
      </div>
    </Section>
  );
}
