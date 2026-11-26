import { useEffect, useRef, useState } from "react";
import { FolderKanban } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { Loading, Skeleton, SkeletonCard } from "@/components/ui/loading";
import { ProgressBar, RouteProgress } from "@/components/ui/progress";
import { cn } from "@/lib/cn";
import { messages } from "@/messages";

import { State } from "../Piece";

/**
 * The live demos of the States section, kept apart from the section page so
 * the page stays a list of pieces and states.
 */

const t = messages.workbench.demos;

/**
 * The empty search as it works: a suggestion is a button, and choosing one
 * runs the search again with that term — never on its own.
 */
export function EmptySearchDemo() {
  const e = t.empty;
  const [term, setTerm] = useState<string | null>(null);
  if (term === null) {
    return <Empty title={e.withSuggestions} description={e.withSuggestionsHint} suggestions={e.terms} onSuggestion={setTerm} />;
  }
  return (
    <div className="w-full rounded-lg border border-border bg-surface p-4">
      <p role="status" className="text-sm font-medium text-primary">
        {e.resultsFor(term)}
      </p>
      <ul className="mt-2 divide-y divide-border text-sm text-secondary">
        {e.results.map((r) => (
          <li key={r} className="py-2">
            {r}
          </li>
        ))}
      </ul>
      <Button variant="ghost" size="sm" className="mt-2" onClick={() => setTerm(null)}>
        {e.clear}
      </Button>
    </div>
  );
}

/** A project card at the skeleton card's measurements, so the swap does not move anything. */
function ProjectCard({ name, meta, tags }: { name: string; meta: string; tags: readonly string[] }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex gap-4">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-surface-sunken text-secondary">
          <FolderKanban size={24} aria-hidden />
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="truncate text-base leading-5 font-medium text-primary">{name}</p>
          <p className="truncate text-xs leading-3 text-secondary">{meta}</p>
          <div className="flex gap-2 pt-1">
            {tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CardSkeletonDemo() {
  return (
    <Loading label={t.loading.region} className="w-full">
      {t.loading.projects.map((p) => (
        <SkeletonCard key={p.name} />
      ))}
    </Loading>
  );
}

/**
 * The same list with data — and "Load again" beside the state's label, to
 * watch the swap without the button taking a line under the cards.
 */
export function LoadedCardsState({ label, note }: { label: string; note: string }) {
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!loading) return;
    const done = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(done);
  }, [loading]);

  return (
    <State
      label={label}
      note={note}
      action={
        <Button variant="secondary" size="sm" onClick={() => setLoading(true)} disabled={loading}>
          {t.loading.again}
        </Button>
      }
    >
      {loading ? (
        <CardSkeletonDemo />
      ) : (
        <div className="w-full space-y-3">
          {t.loading.projects.map((p) => (
            <ProjectCard key={p.name} {...p} />
          ))}
        </div>
      )}
    </State>
  );
}

/** The primitive on its own: shapes for a layout the card does not cover. */
export function LooseSkeletonDemo() {
  return (
    <Loading label={t.loading.region} className="w-full">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-28 w-full rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-11/12" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </Loading>
  );
}

/** A bar with the file it belongs to written above it — the state is in the words too. */
export function UploadBar({ value, tone = "default" }: { value: number; tone?: "default" | "success" | "error" }) {
  const p = t.progress;
  const text = tone === "success" ? p.uploaded : tone === "error" ? p.failedText : p.uploading;
  const color = tone === "success" ? "text-success" : tone === "error" ? "text-error" : "text-primary";
  return (
    <div className="flex w-full flex-col gap-1.5">
      <span className={cn("text-sm", color)}>{text}</span>
      <ProgressBar
        value={value}
        tone={tone}
        label={p.uploading}
        valueText={tone === "default" ? undefined : text}
      />
    </div>
  );
}

/** Uneven chunks, as an upload reports them — not a smooth clock. */
const CHUNKS = [0.06, 0.14, 0.09, 0.17, 0.05, 0.12, 0.15, 0.08, 0.14];

/**
 * **Workbench only**: a pretend upload that reports in chunks. In a
 * component, a bar driven by a clock would lie; here it stands in for a real
 * transfer.
 */
export function UploadMotionDemo() {
  // `null` until the reviewer starts it: running on load, it would be over
  // before anyone scrolled down to watch.
  const [step, setStep] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const done = step !== null && step >= CHUNKS.length;
  const value = done ? 1 : CHUNKS.slice(0, step ?? 0).reduce((a, c) => a + c, 0);

  useEffect(() => {
    if (step === null || step >= CHUNKS.length) return;
    timer.current = setTimeout(() => setStep((s) => (s ?? 0) + 1), 450);
    return () => clearTimeout(timer.current);
  }, [step]);

  return (
    <div className="flex w-full flex-col gap-3">
      <UploadBar value={value} tone={done ? "success" : "default"} />
      <div>
        <Button variant="secondary" size="sm" onClick={() => setStep(0)} disabled={step !== null && !done}>
          {step === null ? t.progress.start : t.progress.restart}
        </Button>
      </div>
    </div>
  );
}

export function RouteBarDemo() {
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    if (!navigating) return;
    const done = setTimeout(() => setNavigating(false), 1800);
    return () => clearTimeout(done);
  }, [navigating]);

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="relative h-12 overflow-hidden rounded-md border border-border bg-surface-sunken">
        {/* At rest the bar shows mid-run, so the piece is never an empty box;
            the button plays a whole navigation, start to finish. */}
        <RouteProgress active={navigating} forceVisible={!navigating} embedded />
      </div>
      <div>
        <Button variant="secondary" size="sm" onClick={() => setNavigating(true)} disabled={navigating}>
          {t.progress.simulate}
        </Button>
      </div>
    </div>
  );
}
