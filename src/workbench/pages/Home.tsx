import { Check } from "lucide-react";
import { Link } from "react-router";

import { cn } from "@/lib/cn";
import { messages } from "@/messages";

import { STATE_HINT, stateOf, tallyOfAll, tallyOfSection } from "../approvals";
import { useLedger } from "../ledger";
import { COMPONENTS, SECTIONS, componentsOf } from "../registry";
import { StatusBadge } from "../StatusBadge";

const m = messages.workbench.home;

/** The map: every section, what each holds, and how much of it is approved. */
export function Home() {
  const { ledger } = useLedger();
  const all = tallyOfAll(ledger);

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold">{m.title}</h1>
        {/* The numbers come from the registry, so this line never ages. */}
        <p className="max-w-[var(--measure)] text-secondary">{m.lead(COMPONENTS.length, SECTIONS.length)}</p>

        {/* Two counts, and only two. "To build" would answer neither "what is
            left to review" nor "what is left to build": it shows inside the
            section that has it, never here. */}
        <dl className="flex flex-wrap gap-8 pt-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-subtle">{m.approved}</dt>
            <dd className="text-2xl font-bold tabular-nums text-signal-label">{all.approved}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-subtle">{m.notApproved}</dt>
            <dd className="text-2xl font-bold tabular-nums">{all.pending}</dd>
          </div>
        </dl>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((section, i) => {
          const items = componentsOf(section.id);
          const count = tallyOfSection(section.id, ledger);
          const reviewable = count.approved + count.pending;
          const complete = reviewable > 0 && count.pending === 0;

          const card = (
            <>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-medium">
                  {i + 1}. {section.name}
                </h2>
                {section.built ? (
                  <span className={cn("text-xs tabular-nums", complete ? "font-medium text-signal-label" : "text-subtle")}>
                    {m.ofApproved(count.approved, reviewable)}
                  </span>
                ) : (
                  <span className="text-xs text-subtle">{m.toBuild}</span>
                )}
              </div>
              <p className="mt-1 text-sm text-secondary">{section.summary}</p>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {items.map((c) => {
                  const state = stateOf(c, ledger);
                  return (
                    <li key={c.id}>
                      {/* An approved piece carries the check, so its state
                          does not depend on color alone. */}
                      <span
                        title={c.summary}
                        className={cn(
                          "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs",
                          state === "approved" && "border-signal text-signal-label",
                          state === "in-review" && "border-border text-secondary",
                          state === "to-build" && "border-dashed border-border text-subtle",
                        )}
                      >
                        {state === "approved" ? <Check size={12} aria-hidden className="text-signal" /> : null}
                        {c.name}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </>
          );

          const base = "block rounded-lg border border-border bg-surface p-4 transition-colors duration-[var(--motion-fast)]";

          return section.built ? (
            <Link key={section.id} to={`/${section.id}`} className={cn(base, "hover:border-accent")}>
              {card}
            </Link>
          ) : (
            <div key={section.id} className={cn(base, "opacity-70")}>
              {card}
            </div>
          );
        })}
      </section>

      <section className="rounded-lg border border-border bg-surface p-4">
        <h2 className="font-medium">{m.sealTitle}</h2>
        <ul className="mt-3 space-y-2 text-sm text-secondary">
          {(["approved", "in-review", "to-build"] as const).map((state) => (
            <li key={state} className="flex items-center gap-3">
              <StatusBadge state={state} />
              <span>{STATE_HINT[state]}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 max-w-[var(--measure)] text-sm text-subtle">{m.sealText}</p>
      </section>
    </div>
  );
}
