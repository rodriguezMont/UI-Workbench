import { Children, createContext, isValidElement, useContext, useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useLocation, useNavigationType } from "react-router";

import { cn } from "@/lib/cn";
import { locale, messages } from "@/messages";

import { approvedOn, stateOf, type PieceState } from "./approvals";
import { useLedger } from "./ledger";
import { findComponent, type ComponentEntry } from "./registry";
import { Rich } from "./rich";
import { StatusBadge } from "./StatusBadge";

const m = messages.workbench;

/** `2026-11-25` → `Nov 25`. The year adds nothing on screen. */
const shortDate = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "UTC" });
function dayAndMonth(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? iso : shortDate.format(date);
}

/**
 * The seal, and the only way to approve a piece.
 *
 * `aria-pressed` because it toggles a state, and the label says what the
 * click **does**, not what it shows — a keyboard user hears "Approve Button",
 * not "approved".
 *
 * It is a button everywhere: under the dev server a click writes the project's
 * ledger; on the published build it is kept in the visitor's browser
 * (`ledger.tsx`).
 */
function ApprovalSeal({ entry, approved }: { entry: ComponentEntry; approved: boolean }) {
  const { ledger, setApproved } = useLedger();
  const [busy, setBusy] = useState(false);
  const on = approvedOn(entry, ledger);
  const text = approved && on ? m.seal.approvedOn(dayAndMonth(on)) : m.seal.approve;

  const box = (
    <span
      aria-hidden
      className={cn(
        "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border",
        approved ? "border-signal bg-signal text-on-signal" : "border-current",
      )}
    >
      {approved ? <Check size={12} strokeWidth={3} /> : null}
    </span>
  );

  return (
    <button
      type="button"
      disabled={busy}
      aria-pressed={approved}
      aria-label={approved ? m.seal.undoNamed(entry.name) : m.seal.approveNamed(entry.name)}
      onClick={async () => {
        setBusy(true);
        await setApproved(entry.id, !approved);
        setBusy(false);
      }}
      style={{ minHeight: "var(--tap-target)" }}
      className={cn(
        "inline-flex items-center gap-2 rounded-md border px-3 text-sm font-medium",
        "transition-colors duration-[var(--motion-instant)] ease-[var(--motion-ease)]",
        "disabled:opacity-60",
        approved
          ? "border-signal text-signal-label hover:bg-surface-hover"
          : "border-border-strong text-secondary hover:border-accent hover:text-accent",
      )}
    >
      {box}
      {text}
    </button>
  );
}

// A piece title is `h2` on a page without sectors; inside a `Sector` it is
// `h3`, or the sector title and the piece title would be siblings and
// heading navigation would lose the hierarchy.
const PieceHeadingLevel = createContext<"h2" | "h3">("h2");

const slug = (text: string) =>
  text
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/**
 * A sector inside a section: groups pieces under a title and lowers their
 * heading level. It counts nothing and approves nothing — the registry is
 * still the map.
 */
export function Sector({ title, summary, children }: { title: string; summary: string; children: React.ReactNode }) {
  const id = `sector-${slug(title)}`;
  return (
    <section aria-labelledby={id} className="space-y-4">
      <header className="border-b border-border pb-2">
        <h2 id={id} className="text-xl font-bold">
          {title}
        </h2>
        <p className="mt-0.5 text-sm text-secondary">{summary}</p>
      </header>
      <div className="space-y-8">
        <PieceHeadingLevel.Provider value="h3">{children}</PieceHeadingLevel.Provider>
      </div>
    </section>
  );
}

/**
 * The frame of one component in the workbench.
 *
 * It exists so that **every piece presents itself the same way**: name, state
 * seal, what it is, and its real states side by side. A workbench where every
 * section invents its own format stops being useful for comparing — and
 * comparing is what it does better than reading code.
 *
 * The header comes from the **registry**, not from props: if the name or the
 * state were typed here, the map's counts and the piece could disagree.
 *
 * **States sit in a two-column grid from `lg`**, so two states are a glance
 * apart instead of a scroll apart; on phones, one column.
 *
 * **A piece collapses.** In review, it opens; approved, it starts collapsed —
 * the page opens as a list of what is left to look at. The drawer animates its
 * height (`grid-template-rows` from 0fr to 1fr) with the motion tokens, so
 * reduced motion sees no animation. **Collapsed, it leaves the Tab order**
 * (`inert`); if focus was inside, it returns to the toggle. A `#id` in the
 * address opens the piece — except on reload, when the person was already
 * there — and `?open=all` opens every piece (the layout ruler uses it).
 */
export function Piece({
  id,
  variant = "states",
  children,
}: {
  /** The registry id. A wrong id is reported on screen instead of rendering empty. */
  id: string;
  /**
   * `states` — the two-column grid, to compare states side by side.
   * `plain` — no grid; for content that is not "states of one piece", such as
   * a palette, which a two-column grid would split in half.
   */
  variant?: "states" | "plain";
  children: React.ReactNode;
}) {
  const { ledger } = useLedger();
  const entry = findComponent(id);
  // The note line is reserved in every state **if any state has a note** —
  // and only then; reserving it always left a gap under labels with none.
  const hasNotes = Children.toArray(children).some(
    (c) => isValidElement<{ note?: string }>(c) && c.type === State && Boolean(c.props.note),
  );

  if (!entry) {
    return (
      <section className="rounded-lg border border-accent bg-surface p-4">
        <p className="text-sm font-medium text-accent">{m.piece.missing(id)}</p>
        <p className="mt-1 text-sm text-secondary">{m.piece.missingHint}</p>
      </section>
    );
  }

  return (
    <PieceBody entry={entry} state={stateOf(entry, ledger)} variant={variant} hasNotes={hasNotes}>
      {children}
    </PieceBody>
  );
}

function PieceBody({
  entry,
  state,
  variant,
  hasNotes,
  children,
}: {
  entry: ComponentEntry;
  state: PieceState;
  variant: "states" | "plain";
  hasNotes: boolean;
  children: React.ReactNode;
}) {
  const { search } = useLocation();
  const arrival = useNavigationType();
  const level = useContext(PieceHeadingLevel);
  const all = new URLSearchParams(search).get("open") === "all";
  // Decided once, on mount: approving an open piece does not close it in the
  // middle of the review.
  const [open, setOpen] = useState(() => all || state === "in-review");
  // Open and settled: only then may the content overflow the drawer (shadow,
  // focus ring, a touch area at the edge). While animating, it is clipped.
  const [settled, setSettled] = useState(true);
  const openNow = useRef(open);
  useEffect(() => {
    openNow.current = open;
  }, [open]);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const contentId = `${entry.id}-content`;

  // A link to the piece opens it — also one that arrives after mount. Not on
  // reload: the anchor is left over from the previous visit.
  useEffect(() => {
    const reload =
      arrival === "POP" &&
      (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined)?.type === "reload";
    const openIfTargeted = () => {
      if (window.location.hash !== `#${entry.id}` || openNow.current) return;
      setSettled(false);
      setOpen(true);
    };
    if (!reload) openIfTargeted();
    window.addEventListener("hashchange", openIfTargeted);
    return () => window.removeEventListener("hashchange", openIfTargeted);
  }, [entry.id, arrival]);

  function toggle() {
    // Collapsing with focus inside would drop focus into nothing.
    if (open && contentRef.current?.contains(document.activeElement)) toggleRef.current?.focus();
    setSettled(false);
    setOpen((o) => !o);
  }

  return (
    <section id={entry.id} className="glass scroll-mt-24 rounded-lg border border-border">
      {/* The seal leaves the text flow, and the text wraps in what remains:
          sharing one wrapping line, a long summary would push the seal down
          and every card would get a different header. On phones the toggle
          stays in the corner and the seal drops below the summary. Tab order
          is the HTML order: text, seal, toggle. */}
      <header
        className={cn(
          "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-1 border-b px-5 py-3",
          "sm:grid-cols-[minmax(0,1fr)_auto_auto]",
          "transition-[border-color] duration-[var(--motion-slow)] ease-[var(--motion-ease)]",
          open ? "border-border" : "border-transparent",
        )}
      >
        <div className="col-start-1 row-start-1 min-w-0 self-center sm:self-start">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {level === "h3" ? (
              <h3 className="text-base font-bold">{entry.name}</h3>
            ) : (
              <h2 className="text-base font-bold">{entry.name}</h2>
            )}
            <span className="max-sm:hidden">
              <StatusBadge state={state} />
            </span>
          </div>
          <p data-summary="" className="mt-0.5 text-sm text-secondary sm:mt-1">
            {entry.summary}
          </p>
        </div>
        {state === "to-build" ? null : (
          <div className="col-start-1 row-start-2 mt-2 justify-self-start sm:col-start-2 sm:row-start-1 sm:mt-0">
            <ApprovalSeal entry={entry} approved={state === "approved"} />
          </div>
        )}
        <button
          ref={toggleRef}
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={contentId}
          aria-label={open ? m.piece.collapse(entry.name) : m.piece.expand(entry.name)}
          className={cn(
            "col-start-2 row-start-1 flex shrink-0 items-center justify-center rounded-md border border-border-strong text-secondary sm:col-start-3",
            "transition-colors duration-[var(--motion-instant)] ease-[var(--motion-ease)]",
            "hover:border-accent hover:text-accent",
          )}
          style={{ minHeight: "var(--tap-target)", minWidth: "var(--tap-target)" }}
        >
          <ChevronDown
            size={20}
            aria-hidden
            className={cn("transition-transform duration-[var(--motion-base)] ease-[var(--motion-ease)]", open && "rotate-180")}
          />
        </button>
      </header>
      {/* The drawer: the grid row goes from 0fr to 1fr, so the height animates
          without measuring a pixel. The content fades and moves down with it. */}
      <div
        id={contentId}
        className={cn(
          // `minmax(0, 1fr)`: without it the grid grows to the content's
          // minimum, and a wide table would push the page instead of scrolling.
          "grid grid-cols-[minmax(0,1fr)] transition-[grid-template-rows] duration-[var(--motion-slow)] ease-[var(--motion-ease)]",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
        inert={!open}
        onTransitionEnd={(e) => {
          if (e.target === e.currentTarget && open) setSettled(true);
        }}
      >
        <div ref={contentRef} className={cn("min-h-0 min-w-0", open && settled ? "overflow-visible" : "overflow-hidden")}>
          {/* `data-demo` separates the COMPONENT from the frame, so the layout
              ruler measures the piece, not the workbench around it. */}
          <div
            data-demo
            className={cn(
              "p-5",
              "transition-[opacity,translate] duration-[var(--motion-slow)] ease-[var(--motion-ease)]",
              open ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0",
              variant === "states" ? "grid gap-x-8 gap-y-7 lg:grid-cols-2" : "space-y-4",
            )}
          >
            <NotesContext.Provider value={hasNotes}>{children}</NotesContext.Provider>
          </div>
        </div>
      </div>
    </section>
  );
}

/** The piece tells its states whether the note line exists. Outside a piece, it does. */
const NotesContext = createContext(true);

/**
 * A named state inside a piece. The label is what gets compared.
 *
 * `wide` spans both columns — for a state that **needs** the width, such as a
 * banner or a table. Using it for taste undoes the grid.
 *
 * **The header always has the same height: one label line, one note line.**
 * A state without a note reserves the line, and neither line wraps —
 * `truncate` is the safety net, never the design: a note that does not fit is
 * rewritten shorter.
 */
export function State({
  label,
  note,
  wide,
  fill,
  action,
  children,
}: {
  label: string;
  note?: string;
  wide?: boolean;
  /**
   * The demo takes the row's full height. For panels side by side — two error
   * states, two stat cards — so neighbors end on the same line.
   */
  fill?: boolean;
  /**
   * A control that drives the demo — "Load again" — set beside the label, so
   * it takes no line of its own under the demo.
   */
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const hasNotes = useContext(NotesContext);
  return (
    // `min-w-0`: a wide child — a full-width input, a long file name — would
    // burst the grid column without it.
    <div className={cn("min-w-0", wide && "lg:col-span-2", fill && "flex flex-col")}>
      <div className="mb-2.5 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <span className="block truncate text-xs font-medium uppercase leading-4 tracking-wide text-subtle">
            {label}
          </span>
          {hasNotes ? (
            // `data-note`: prose ABOUT the demo, kept apart from the demo itself.
            <span data-note className="mt-0.5 block h-4 truncate text-xs leading-4 text-secondary">
              {note}
            </span>
          ) : null}
        </div>
        {/* Negative margins: the button is taller than the label and note, and
            must not push the demo below its neighbors. */}
        {action ? <div className="-my-1.5 shrink-0">{action}</div> : null}
      </div>
      <div className={cn("flex flex-wrap gap-3", fill ? "flex-1 items-stretch" : "items-center")}>{children}</div>
    </div>
  );
}

/**
 * The explanation box: why the piece is the way it is, always last — people
 * read the why after looking. It spans the piece's columns.
 *
 * **Each paragraph opens with its claim in bold** (`**…**` in the copy, see
 * `Rich`), so the box can be scanned by its leads. **Prose in two columns from
 * `lg`**, filling the box: a single paragraph spans both, instead of leaving
 * half of it empty. No reading-measure cap here — inside a two-column box the
 * column is the measure.
 */
export function PieceNote({ paragraphs }: { paragraphs: readonly string[] }) {
  return (
    <div data-note className="rounded-md border border-border bg-surface-sunken p-4 lg:col-span-2">
      <div className="grid gap-x-8 gap-y-3 text-sm leading-relaxed text-secondary lg:grid-cols-2">
        {paragraphs.map((paragraph) => (
          <p key={paragraph} className={paragraphs.length === 1 ? "lg:col-span-2" : undefined}>
            <Rich text={paragraph} />
          </p>
        ))}
      </div>
    </div>
  );
}
