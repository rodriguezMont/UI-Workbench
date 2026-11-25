import { createContext, useContext, useId } from "react";
import { Info, XCircle, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/cn";

import { Spinner } from "./progress";

/**
 * A field group: legend, hint and error for a set of controls.
 *
 * **Why `<fieldset>` and not a `div` with a title.** A screen reader announces
 * the legend when entering the group — "Contact method, group" — and that is
 * what gives meaning to a radio called "Email". A loose title is read once,
 * far from the control, and whoever tabs straight to the option never hears it.
 *
 * **The error belongs to the group, not the option.** "Choose a contact
 * method" is not a defect of the "Phone" radio; it is the set's. So the message
 * points at the `fieldset`, and each control inside only gets `aria-invalid`
 * through context.
 *
 * **The hint-and-error wiring of the whole form lives here**
 * (`FieldMessages` and `describedByOf`): field, select, checkbox, switch and
 * this group all use the same two functions, so a change to the rule lands
 * everywhere at once.
 */

type GroupState = {
  invalid: boolean;
  /**
   * The id of the group's hint when the group is disabled: it is the reason,
   * and every control inside points at it — a disabled `fieldset` locks them
   * all without any of them receiving the prop, and disabled without a reason
   * is a defect. With the group enabled it is empty: the hint is already read
   * on entering it.
   */
  reasonId?: string;
};

const GroupContext = createContext<GroupState>({ invalid: false });

/** Choice controls read the group's state from here. */
export function useFieldsetState(): GroupState {
  return useContext(GroupContext);
}

/** Where the control's column sits, so the supporting line aligns with it. */
export type ChoiceSide = boolean | "start" | "end" | "cell";

/**
 * The supporting line under a control: the hint, or the error in its place.
 *
 * **The error replaces the hint.** Showing both repeated the same thing
 * ("At least 8 characters" and "Needs 8 characters"). So **the error must say
 * what is missing**, carrying what the hint would say: "5 more characters —
 * the password needs 8", never "Invalid password".
 *
 * **The hint stays visible when the value is right**, so it is always
 * descriptive — "At least 8 characters", "As shown on the storefront" — never
 * a to-do ("Type at least 8"). Hiding it when the value turns right would make
 * the field jump on every key.
 *
 * **A disabled field says why, and the reason lives here**, in the hint —
 * without the control's opacity: whoever cannot edit needs to read the reason.
 *
 * **`choice`: under a checkbox**, not a field. The text starts at the label's
 * column and the glyph sits in the box's column; the hint gets a glyph too,
 * which separates it from the option's description; and no top gap, so the
 * hint stays attached to its label. `"end"` mirrors it for a control on the
 * right (the switch); `"cell"` aligns with a row of 44px cells (rating stars).
 *
 * **`pending`: what is happening now** ("Saving…"). It takes the hint's place
 * while it lasts, with a spinning glyph, and loses to the error.
 */
export function FieldMessages({
  hintId,
  errorId,
  hint,
  error,
  pending,
  choice,
  className,
}: {
  hintId: string;
  errorId: string;
  hint?: React.ReactNode;
  error?: string;
  pending?: string;
  choice?: ChoiceSide;
  className?: string;
}) {
  if (!hint && !error && !pending) return null;
  const side = choice === true ? "start" : choice || null;
  const glyph = (Icon: LucideIcon | null, spinning = false) => (
    <span
      className={cn(
        "flex shrink-0 justify-center pt-0.5",
        side === "start" && "w-5",
        side === "end" && "order-last w-11",
        side === "cell" && "-ml-2 w-11",
      )}
    >
      {spinning || !Icon ? <Spinner size={16} /> : <Icon size={16} aria-hidden />}
    </span>
  );
  const line = cn(
    "flex items-start text-sm",
    side === "start" && "gap-3",
    side === "end" && "gap-4",
    !side && "mt-1.5 gap-1.5",
  );
  const text = (content: React.ReactNode) => (side === "end" ? <span className="min-w-0 flex-1">{content}</span> : content);
  return (
    // Under a choice, 8px below: without it the hint sat 12px from its own box
    // and 12px from the next, and the eye could not tell whose it was.
    <div className={cn(side && "pb-2", className)}>
      {error ? (
        <p id={errorId} className={cn(line, "font-medium text-error")}>
          {glyph(XCircle)}
          {text(error)}
        </p>
      ) : pending ? (
        <p id={hintId} className={cn(line, "text-secondary")}>
          {glyph(null, true)}
          {text(pending)}
        </p>
      ) : side ? (
        <p id={hintId} className={cn(line, "text-secondary")}>
          {glyph(Info)}
          {text(hint)}
        </p>
      ) : (
        <p id={hintId} className="mt-1.5 text-sm text-secondary">
          {hint}
        </p>
      )}
    </div>
  );
}

/**
 * The row of a choice control: the control, the label and the description.
 * **One for checkbox and radio**, so an alignment fix lands in both.
 *
 * **The label centers on the control, with or without a description**, and
 * the description sits right under it in the label's column. Everything lives
 * inside the `<label>`, so tapping the description also chooses. No glyph —
 * the glyph belongs to the hint (`FieldMessages`).
 *
 * **`side="end"`**: the control on the right, for the switch.
 */
export function ChoiceLabel({
  htmlFor,
  control,
  label,
  labelId,
  description,
  descriptionId,
  side = "start",
}: {
  htmlFor: string;
  /** The `input`, already painted. */
  control: React.ReactNode;
  label: React.ReactNode;
  labelId: string;
  description?: string;
  descriptionId: string;
  side?: "start" | "end";
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        "block cursor-pointer text-sm text-primary",
        // By the input's state, not the prop: inside a disabled `Fieldset` the
        // input locks without the prop existing.
        "has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50",
      )}
    >
      <span className={cn("flex items-center", side === "start" ? "gap-3" : "gap-4")} style={{ minHeight: "var(--tap-target)" }}>
        {side === "start" ? control : null}
        <span id={labelId} className="min-w-0 flex-1 py-2">
          {label}
        </span>
        {side === "end" ? control : null}
      </span>
      {description ? (
        <span
          id={descriptionId}
          className={cn(
            "-mt-2.5 block pb-2 text-secondary",
            // The control's column: 20 + 12 at the start; 44 + 16 at the end.
            side === "start" ? "pl-8" : "pr-15",
          )}
        >
          {description}
        </span>
      ) : null}
    </label>
  );
}

/** Points at what is on screen: the error when there is one, the hint when not. */
export function describedByOf(
  ids: { hintId: string; errorId: string },
  hint?: React.ReactNode,
  error?: string,
): string | undefined {
  if (error) return ids.errorId;
  return hint ? ids.hintId : undefined;
}

type FieldsetProps = Omit<React.ComponentProps<"fieldset">, "children"> & {
  legend: string;
  hint?: string;
  error?: string;
  /** A legend that is read but not shown — only when the screen already says what the group is. */
  hiddenLegend?: boolean;
  /** Aligns the supporting line with the column of the controls inside. */
  messages?: ChoiceSide;
  children: React.ReactNode;
};

export function Fieldset({ legend, hint, error, hiddenLegend, messages, disabled, className, children, ...rest }: FieldsetProps) {
  const base = useId();
  const ids = { hintId: `${base}-hint`, errorId: `${base}-error` };
  const reasonId = disabled && hint && !error ? ids.hintId : undefined;

  return (
    <GroupContext.Provider value={{ invalid: Boolean(error), reasonId }}>
      <fieldset {...rest} disabled={disabled} aria-describedby={describedByOf(ids, hint, error)} className={cn("w-full min-w-0", className)}>
        <legend
          className={cn(
            // One step above a field label: inside the group there are labels,
            // and the legend must read as their title, not as one more.
            "mb-1 text-sm font-bold text-primary",
            hiddenLegend && "sr-only",
          )}
        >
          {legend}
        </legend>
        {children}
        <FieldMessages {...ids} hint={hint} error={error} choice={messages} />
      </fieldset>
    </GroupContext.Provider>
  );
}
