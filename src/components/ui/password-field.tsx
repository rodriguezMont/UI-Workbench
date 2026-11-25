import { useState } from "react";
import { Circle, CircleCheck, Eye, EyeOff } from "lucide-react";

import { TEXT_LIMITS } from "@/lib/text-limits";
import { messages } from "@/messages";

import { Field, type InputFieldProps } from "./field";

const m = messages.ui.password;

/**
 * The password field, with the eye to show what was typed.
 *
 * **It is the [`Field`](./field.tsx) with a button at the end** — label,
 * hint, error and the focus glow come from there. The button does not light
 * the field: focus on it gets the button ring; the glow is for typing.
 *
 * **Showing the password is accessibility, not convenience.** Typing blind is
 * where people with tremor, dyslexia or a phone keyboard make mistakes — and a
 * wrong password locks the account. Hidden stays the default.
 *
 * **The button says what it does**: "Show password" and "Hide password", with
 * `aria-pressed`. It is `type="button"`: Enter in the field submits the form,
 * never toggles the password.
 *
 * **`autoComplete` is required**, because password managers read it:
 * `current-password` to sign in, `new-password` to sign up or change. Getting
 * them wrong makes the manager suggest the old password where a new one is made.
 *
 * **The requirement checks itself** (`minLength`). For a password the rule IS
 * the format, and the browser checks all of it — so the check mark here is
 * true, unlike a format check on a number that may not exist. The line "At
 * least 8 characters" swaps the circle for a check when the length arrives,
 * and a screen reader hears the change once, not on every key. With an error,
 * the error takes its place — and must say how many are missing.
 *
 * Nothing here stores, logs or sends the password. Only its length is kept,
 * for the requirement.
 */

type PasswordFieldProps = Omit<
  InputFieldProps,
  // `status` out: the eye takes the right end and never leaves, so there is
  // nowhere to draw a state.
  "as" | "type" | "prefix" | "suffix" | "endAction" | "autoComplete" | "status" | "loadingLabel" | "validLabel"
> & {
  autoComplete: "current-password" | "new-password";
};

export function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const [typed, setLength] = useState(() => String(props.defaultValue ?? "").length);
  // A controlled value wins: a form that clears the password without a typing
  // event must not leave the requirement checked.
  const length = props.value !== undefined ? String(props.value).length : typed;
  const Icon = visible ? EyeOff : Eye;
  const { minLength } = props;
  const met = minLength !== undefined && length >= minLength;

  const requirement =
    minLength !== undefined ? (
      <span className="flex items-center gap-1.5">
        {met ? (
          <CircleCheck size={16} aria-hidden className="shrink-0 text-success" />
        ) : (
          <Circle size={16} aria-hidden className="shrink-0 text-subtle" />
        )}
        {m.minimum(minLength)}
        {/* Only the state is live: the text only changes when the requirement
            flips, so there is one announcement, not one per key. */}
        <span aria-live="polite" className="sr-only">
          {met ? m.met : m.notMet}
        </span>
      </span>
    ) : undefined;

  return (
    <Field
      {...props}
      hint={props.hint ?? requirement}
      onChange={(e) => {
        setLength(e.currentTarget.value.length);
        props.onChange?.(e);
      }}
      type={visible ? "text" : "password"}
      // Explicit: otherwise the ceiling would change when the password shows as `text`.
      maxLength={props.maxLength ?? TEXT_LIMITS.password}
      // No autocorrect or auto-capitalization when the password shows: the
      // phone keyboard would "fix" it.
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      endAction={
        <button
          type="button"
          aria-pressed={visible}
          aria-label={visible ? m.hide : m.show}
          onClick={() => setVisible((v) => !v)}
          disabled={props.disabled}
          // The ring goes inward: with the default offset it would leave the
          // field at the end and look like a second control stuck to the first.
          className="flex size-[var(--tap-target)] items-center justify-center rounded-md text-secondary transition-colors duration-[var(--motion-instant)] hover:text-primary focus-visible:outline-offset-[-6px] disabled:cursor-not-allowed"
        >
          <Icon size={18} aria-hidden />
        </button>
      }
    />
  );
}
