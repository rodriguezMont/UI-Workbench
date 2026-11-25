import { useEffect, useId, useRef } from "react";
import { Check, Minus } from "lucide-react";

import { cn } from "@/lib/cn";

import { ChoiceLabel, FieldMessages, describedByOf, useFieldsetState } from "./fieldset";

/**
 * The checkbox.
 *
 * **The browser's `<input type="checkbox">`, not Radix.** It works without
 * script, it goes into the form submission without a hidden input, and the
 * keyboard and semantics are the browser's, with no risk. Only the paint
 * changes, through `appearance-none`.
 *
 * **The label is the target.** The box is 20px; the whole row is 44 and
 * toggles it. Nobody should have to hit the little square.
 *
 * **A link inside the label opens, and does not check** — "I accept the terms
 * of service". The browser guarantees it: clicking interactive content inside
 * a `<label>` does not activate the control. The rest of the row still checks.
 *
 * **Description or hint.** The `description` is part of the option ("Ships in
 * a padded envelope") and lives inside the target; the `hint` is about the
 * answer ("You can change this in your account") and lives under the row. The
 * description goes into the accessible description, not the name: a screen
 * reader says the label, then the rest.
 *
 * **Checked is not just color**: the check glyph is the shape. The third state,
 * "some", has its own glyph — and it exists for the box that summarizes a list
 * ("All notifications"), never as the answer to a question.
 *
 * **A checkbox is for what gets submitted; the switch, for what applies right
 * away.** See [`Switch`](./switch.tsx).
 */

type BoxProps = Omit<React.ComponentProps<"input">, "type"> & {
  invalid?: boolean;
  indeterminate?: boolean;
};

/**
 * Just the box: the painted `input` and its two glyphs. The checkbox and the
 * [checkbox card](./checkbox-card.tsx) wear the same one — the paint and the
 * third state cannot drift between them.
 */
export function CheckboxBox({ invalid = false, indeterminate = false, className, ref: externalRef, onChange, ...rest }: BoxProps) {
  // `indeterminate` is not an HTML attribute, only an element property:
  // without this the third state never shows.
  //
  // No dependencies on purpose: the browser clears the property on every
  // click, while the prop may stay `true` without changing. Reapplying on
  // every render and in `onChange` keeps the box saying what the state's owner
  // says.
  const inner = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (inner.current) inner.current.indeterminate = indeterminate;
  });

  // The caller's ref still receives the element — form libraries register
  // through it.
  const setRef = (el: HTMLInputElement | null) => {
    inner.current = el;
    if (typeof externalRef === "function") externalRef(el);
    else if (externalRef) externalRef.current = el;
  };

  return (
    <span className="relative flex size-5 shrink-0">
      <input
        {...rest}
        ref={setRef}
        onChange={(e) => {
          onChange?.(e);
          e.currentTarget.indeterminate = indeterminate;
        }}
        type="checkbox"
        aria-invalid={invalid || undefined}
        className={cn(
          "peer size-5 shrink-0 cursor-[inherit] appearance-none rounded-sm border-2 bg-surface",
          "transition-colors duration-[var(--motion-instant)] ease-[var(--motion-ease)]",
          invalid ? "border-error" : "border-border-strong",
          "enabled:hover:border-accent",
          "checked:border-accent checked:bg-accent",
          "indeterminate:border-accent indeterminate:bg-accent",
          className,
        )}
      />
      <Check
        size={14}
        strokeWidth={3}
        aria-hidden
        className="pointer-events-none absolute inset-0 m-auto hidden text-on-accent peer-checked:block peer-indeterminate:hidden"
      />
      <Minus
        size={14}
        strokeWidth={3}
        aria-hidden
        className="pointer-events-none absolute inset-0 m-auto hidden text-on-accent peer-indeterminate:block"
      />
    </span>
  );
}

type CheckboxProps = Omit<React.ComponentProps<"input">, "id" | "type"> & {
  label: React.ReactNode;
  /** Part of the option, inside the target: what checking this means. */
  description?: string;
  /** About the answer, under the row. */
  hint?: string;
  error?: string;
  /** "Some": only the box that summarizes a list uses it. */
  indeterminate?: boolean;
};

export function Checkbox({ label, description, hint, error, indeterminate = false, className, ...rest }: CheckboxProps) {
  const base = useId();
  const id = `${base}-box`;
  const labelId = `${base}-label`;
  const descriptionId = `${base}-description`;
  const ids = { hintId: `${base}-hint`, errorId: `${base}-error` };
  const group = useFieldsetState();

  return (
    <div className={cn("w-full", className)}>
      <ChoiceLabel
        htmlFor={id}
        labelId={labelId}
        label={label}
        description={description}
        descriptionId={descriptionId}
        control={
          <CheckboxBox
            {...rest}
            id={id}
            indeterminate={indeterminate}
            invalid={Boolean(error) || group.invalid}
            // With a description, the name is only the label; without one, the
            // `<label>` is enough.
            aria-labelledby={description ? labelId : rest["aria-labelledby"]}
            // Adds to the caller's description: a box inside a field points at
            // that field's hint, which says why both are off.
            aria-describedby={
              [description ? descriptionId : null, describedByOf(ids, hint, error), group.reasonId, rest["aria-describedby"]]
                .filter(Boolean)
                .join(" ") || undefined
            }
          />
        }
      />
      <FieldMessages {...ids} hint={hint} error={error} choice />
    </div>
  );
}
