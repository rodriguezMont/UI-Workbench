import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";

import { cn } from "@/lib/cn";
import { messages } from "@/messages";

import { Button } from "./button";
import { Fieldset, useFieldsetState } from "./fieldset";

const m = messages.ui.ratingInput;

/**
 * Giving a score, from 1 to 5. Reading one is the [`Rating`](./rating.tsx).
 *
 * **Underneath are five browser radios**, inside a group with a legend: the
 * arrows change the score, Tab enters and leaves the group in one stop, and
 * the value goes into the form submission with `name`. The star is only paint.
 *
 * **Every star has a name, and the name is a word.** "3 out of 5, Okay" for
 * listeners; and the same word is written beside the row for sighted users,
 * because five identical stars do not say on their own whether 3 is fine or
 * poor.
 *
 * **Each star is a 44px target**, edge to edge: one's border is the next one's,
 * with no gap where a finger lands on nothing and no overlap. **The row is
 * pulled back 8px**: the drawn star is 28 in a 44 cell, and without it the row
 * started 8px after the legend. The supporting line follows the cells — the
 * glyph in the first, the text right after it.
 *
 * **Already rated is another face, not the same control filled in.** With
 * `submittedNote`, the score shows to be read — stars without targets, when it
 * was sent, and "Change rating". Only that button brings the radios back,
 * with focus on the chosen star. The cells are the same size in both modes:
 * switching does not make the row jump. The value stays in the submission
 * through a hidden input.
 *
 * **The hover preview needs script; the choice does not.** Before hydration a
 * radio still checks and submits — only the stars' paint waits for React.
 */

const MAX = 5;

type RatingInputProps = {
  legend: string;
  name: string;
  hint?: string;
  error?: string;
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /** The score was already sent: it opens to be read, with "Change rating". It says when ("Sent on Nov 12"). */
  submittedNote?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
};

export function RatingInput({ legend, hint, error, disabled, className, ...rest }: RatingInputProps) {
  return (
    <Fieldset legend={legend} hint={hint} error={error} disabled={disabled} messages="cell" className={className}>
      {/* Inside the group, to read its error and the reason it is disabled. */}
      <Stars {...rest} legend={legend} disabled={disabled} />
    </Fieldset>
  );
}

function wordOf(n: number): string | undefined {
  return m.words[n - 1];
}

function Stars({
  legend,
  name,
  value,
  defaultValue,
  onValueChange,
  submittedNote,
  disabled,
  required,
}: Omit<RatingInputProps, "hint" | "error" | "className">) {
  const { invalid, reasonId } = useFieldsetState();
  const [inner, setInner] = useState(defaultValue ?? 0);
  const [hovered, setHovered] = useState(0);
  const [editing, setEditing] = useState(!submittedNote);
  const row = useRef<HTMLDivElement>(null);
  // Only after "Change rating": on page load, focus does not move by itself.
  const changed = useRef(false);
  const current = value ?? inner;
  // What the row shows: the mouse preview wins while it is over the row.
  const painted = (editing && hovered) || current;

  useEffect(() => {
    if (!editing || !changed.current) return;
    row.current?.querySelector<HTMLInputElement>("input:checked")?.focus();
  }, [editing]);

  const choose = (n: number) => {
    if (value === undefined) setInner(n);
    onValueChange?.(n);
  };

  const star = (n: number) => (
    <Star
      size={28}
      strokeWidth={1.75}
      fill={n <= painted ? "currentColor" : "none"}
      aria-hidden
      className={cn(
        "pointer-events-none transition-colors duration-[var(--motion-instant)] ease-[var(--motion-ease)]",
        n <= painted ? "text-accent" : invalid ? "text-error" : "text-border-strong",
      )}
    />
  );

  const word = (
    // The word is the score's reading for sighted users. Listeners already
    // hear it in each star's name — hence `aria-hidden`.
    <span
      aria-hidden
      className={cn(
        "min-w-20 text-sm",
        painted ? "font-medium text-primary" : "text-subtle",
        // Fades with the stars: a lit word next to a disabled row seems to say
        // it alone still responds.
        disabled && "opacity-50",
      )}
    >
      {painted ? wordOf(painted) : m.none}
    </span>
  );

  if (!editing) {
    return (
      <>
        <div className="flex flex-wrap items-center gap-x-3">
          <div
            role="img"
            aria-label={m.summary(legend, current, MAX, wordOf(current) ?? m.none)}
            // The same pull-back as the row of radios: switching modes moves nothing.
            className="-ml-2 flex"
          >
            {Array.from({ length: MAX }, (_, i) => (
              <span key={i} className="flex size-11 items-center justify-center">
                {star(i + 1)}
              </span>
            ))}
          </div>
          {word}
        </div>
        {/* The value still goes in the submission, with no radio on screen. */}
        {current ? <input type="hidden" name={name} value={current} /> : null}
        {/* In the column of the legend and the first star: it is content, not a
            hint, so it has no glyph to indent for. */}
        <div className="flex flex-wrap items-center gap-x-3 text-sm text-secondary">
          <p>{submittedNote}</p>
          <Button
            type="button"
            variant="link"
            className="px-0"
            onClick={() => {
              changed.current = true;
              setEditing(true);
            }}
          >
            {m.change}
          </Button>
        </div>
      </>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3">
      <div ref={row} className="-ml-2 flex" onMouseLeave={() => setHovered(0)}>
        {Array.from({ length: MAX }, (_, i) => {
          const n = i + 1;
          return (
            <label
              key={n}
              onMouseEnter={() => !disabled && setHovered(n)}
              className={cn(
                "relative flex size-11 items-center justify-center rounded-md",
                disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                // The input is invisible, so the focus ring belongs to the label.
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-[var(--focus-ring)]",
              )}
            >
              <input
                type="radio"
                name={name}
                value={n}
                checked={current === n}
                onChange={() => choose(n)}
                required={required}
                aria-invalid={invalid || undefined}
                aria-label={m.star(n, MAX, wordOf(n) ?? "")}
                aria-describedby={reasonId}
                className="absolute inset-0 m-0 cursor-[inherit] appearance-none opacity-0"
              />
              {star(n)}
            </label>
          );
        })}
      </div>
      {word}
    </div>
  );
}
