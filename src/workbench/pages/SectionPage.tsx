import { messages } from "@/messages";

import { componentsOf, findSection, type SectionId } from "../registry";
import { Rich } from "../rich";

const m = messages.workbench.section;

/**
 * The frame of one section: title, intro, its pieces, and — at the end —
 * the pieces still on the map without a shape, so what is missing stays in
 * view instead of disappearing from the page.
 */
export function SectionPage({ id, children }: { id: SectionId; children: React.ReactNode }) {
  const section = findSection(id);
  const toBuild = componentsOf(id).filter((c) => c.built === false);
  if (!section) return null;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">{section.name}</h1>
        {/* The rule the section protects, not a list of its pieces — that is
            the map's line. */}
        <p className="text-sm leading-relaxed text-secondary">
          <Rich text={section.intro} />
        </p>
      </header>

      <div className="space-y-8">{children}</div>

      {toBuild.length ? (
        <section aria-labelledby="to-build" className="rounded-lg border border-dashed border-border p-4">
          <h2 id="to-build" className="text-sm font-medium text-secondary">
            {m.toBuild}
          </h2>
          <p className="mt-0.5 text-xs text-subtle">{m.toBuildHint}</p>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {toBuild.map((c) => (
              <li key={c.id} id={c.id} title={c.summary} className="rounded border border-dashed border-border px-1.5 py-0.5 text-xs text-subtle">
                {c.name}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
