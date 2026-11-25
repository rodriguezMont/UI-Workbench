import { useId, useRef, useState } from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/cn";
import { messages } from "@/messages";

import { ChoiceLabel, FieldMessages, describedByOf, useFieldsetState } from "./fieldset";
import { Spinner } from "./progress";

const m = messages.ui.switch;

/**
 * The switch: turns on or off something **that applies right away**.
 *
 * **The difference from a checkbox is timing, not looks.** A checkbox is an
 * answer that only counts when the form is submitted; a switch is the effect
 * itself — "Email me when someone replies" turns on at the tap, with no Save
 * button. A switch inside a form with "Save" lies about when things happen.
 *
 * **`<input type="checkbox" role="switch">`**: switch semantics on the
 * browser's control, for the reasons in the [checkbox](./checkbox.tsx). A
 * screen reader announces "on/off" instead of "checked".
 *
 * **Nothing by color alone**: the thumb changes side — position is the shape
 * — and carries a check when on. The off track uses `--border-strong`, which
 * has the 3:1 of a UI boundary against the surface.
 *
 * **Label on the left, switch on the right**: it is the preferences list,
 * where people read the row and the control lines up at the edge. The row is
 * the checkbox's ([`ChoiceLabel`](./fieldset.tsx)), mirrored: description
 * attached to the label, and the hint with its glyph in the switch's column.
 *
 * ## Saving, and failing
 *
 * **Applying right away means going to the server on the tap**, and the
 * screen cannot lie about what was saved. While saving, the switch already
 * shows the new position, the thumb spins, the supporting line says
 * "Saving…" and **a second tap does nothing** — without disabling it, so focus
 * stays put. If it fails, **the switch goes back** and the error says what
 * happened. Both changes are announced: the supporting line is a live region,
 * and only what changes in it is read — an error already present on load is
 * not announced.
 *
 * Going back lives in `useSwitchSave`, below, and not in each screen: it is
 * what guarantees no screen forgets to undo.
 */

type SwitchProps = Omit<React.ComponentProps<"input">, "id" | "type" | "role"> & {
  label: React.ReactNode;
  /** Part of the option, attached to the label: what turning this on does. */
  description?: string;
  hint?: string;
  error?: string;
  /** The change is on its way to the server. */
  saving?: boolean;
};

export function Switch({ label, description, hint, error, saving = false, className, onClick, onChange, ...rest }: SwitchProps) {
  const base = useId();
  const id = `${base}-switch`;
  const labelId = `${base}-label`;
  const descriptionId = `${base}-description`;
  const ids = { hintId: `${base}-hint`, errorId: `${base}-error` };
  const group = useFieldsetState();
  const invalid = Boolean(error) || group.invalid;
  const pending = saving && !error ? m.saving : undefined;

  return (
    <div className={cn("w-full", className)}>
      <ChoiceLabel
        side="end"
        htmlFor={id}
        labelId={labelId}
        label={label}
        description={description}
        descriptionId={descriptionId}
        control={
          <span className="relative inline-flex shrink-0">
            <input
              {...rest}
              id={id}
              type="checkbox"
              role="switch"
              aria-invalid={invalid || undefined}
              aria-busy={saving || undefined}
              aria-labelledby={description ? labelId : rest["aria-labelledby"]}
              aria-describedby={
                [description ? descriptionId : null, describedByOf(ids, hint || pending, error), group.reasonId, rest["aria-describedby"]]
                  .filter(Boolean)
                  .join(" ") || undefined
              }
              // While saving, a tap changes nothing — and without `disabled`,
              // so focus stays on the switch. React reports a checkbox's change
              // from the same click, so the guard covers both handlers.
              onClick={(e) => {
                if (!saving) return onClick?.(e);
                // Controlled, React puts the DOM back to `checked` by itself;
                // cancelling the click as well would leave the two out of step.
                if (rest.checked === undefined) e.preventDefault();
              }}
              onChange={(e) => {
                if (!saving) onChange?.(e);
              }}
              className={cn(
                "peer h-6 w-11 cursor-[inherit] appearance-none rounded-full bg-border-strong",
                "transition-colors duration-[var(--motion-fast)] ease-[var(--motion-ease)]",
                "checked:bg-accent",
                invalid && "ring-2 ring-error ring-offset-2 ring-offset-surface",
                saving && "cursor-progress",
                "focus-visible:rounded-full",
              )}
            />
            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute left-0.5 top-0.5 flex size-5 items-center justify-center rounded-full bg-surface text-accent shadow-sm",
                "transition-[translate] duration-[var(--motion-fast)] ease-[var(--motion-ease)]",
                "peer-checked:translate-x-5",
                !saving && "[&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100",
              )}
            >
              {saving ? <Spinner size={12} strokeWidth={3} className="text-secondary" /> : <Check size={12} strokeWidth={3} />}
            </span>
          </span>
        }
      />
      {/* A live region: "Saving…" and the error of a revert are announced when
          they change; what comes with the page is not. */}
      <div aria-live="polite">
        <FieldMessages {...ids} hint={hint} error={error} pending={pending} choice="end" />
      </div>
    </div>
  );
}

/**
 * The switch that applies right away: shows the new position, saves and,
 * **if it fails, goes back** and says why. While saving, new taps are ignored —
 * the same rule as the `Switch`'s `saving`, here on the state's side.
 */
export function useSwitchSave(initial: boolean, save: (next: boolean) => Promise<void>) {
  const [checked, setChecked] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  // React state arrives one render later; a double tap does not wait.
  const inFlight = useRef(false);

  async function toggle(next: boolean) {
    if (inFlight.current) return;
    inFlight.current = true;
    setChecked(next);
    setSaving(true);
    setError(undefined);
    try {
      await save(next);
    } catch {
      setChecked(!next);
      setError(m.saveFailed);
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  }

  return {
    checked,
    saving,
    error,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => toggle(e.currentTarget.checked),
  };
}
