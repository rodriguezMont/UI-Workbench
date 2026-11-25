/** A titled block of the workbench page. */
export function Section({
  id,
  heading,
  intro,
  children,
}: {
  id: string;
  heading: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-heading`} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id={`${id}-heading`} className="text-xl font-bold text-primary">
          {heading}
        </h2>
        <p className="max-w-[var(--measure)] text-sm text-secondary">{intro}</p>
      </div>
      <div className="rounded-lg border border-border bg-surface p-4 md:p-6">{children}</div>
    </section>
  );
}

/** A labeled sample inside a section. */
export function Sample({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium text-secondary">{title}</h3>
      {children}
      {note ? <p className="text-xs text-subtle">{note}</p> : null}
    </div>
  );
}
