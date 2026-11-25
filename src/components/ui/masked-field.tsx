import { useState } from "react";

import { applyMask, maskWithCaret, type Mask, type MaskKind } from "@/lib/mask";

import { Field, type InputFieldProps } from "./field";

/**
 * The field that tidies the value while the person types: ZIP code, phone,
 * date, currency and whole numbers.
 *
 * **It is the [`Field`](./field.tsx) with a mask on top**, not a new field:
 * label, hint, error and the focus glow come from there. The formatting rule
 * lives in [`mask.ts`](../../lib/mask.ts), which is tested.
 *
 * **A mask is a courtesy, never validation.** The submitted value is the
 * formatted text; normalizing and checking it is the server's job.
 *
 * **The caret does not jump.** Typing in the middle of "(213) 373-4253" keeps
 * the caret where the person is, and Backspace or Delete over a separator
 * removes the neighboring digit instead of getting stuck on a separator the
 * mask would put back. A number pasted with "+1" loses the prefix.
 *
 * **A phone with a country picker lives next door**
 * ([`phone-field.tsx`](./masked-field/phone-field.tsx)): phone metadata weighs
 * tens of kilobytes, and this field should not carry it.
 */

const KEYBOARD: Record<MaskKind, Pick<React.ComponentProps<"input">, "inputMode" | "autoComplete" | "autoCapitalize">> = {
  zip: { inputMode: "numeric", autoComplete: "postal-code" },
  phone: { inputMode: "tel", autoComplete: "tel-national" },
  date: { inputMode: "numeric", autoComplete: "off" },
  // `decimal`, not `numeric`: on iOS the numeric pad has no separator, and
  // whoever pastes "1,234.56" from elsewhere needs it to arrive.
  currency: { inputMode: "decimal", autoComplete: "off" },
  integer: { inputMode: "numeric", autoComplete: "off" },
};

type MaskedFieldProps = Omit<InputFieldProps, "as" | "value" | "defaultValue" | "onChange" | "type"> & {
  /** A fixed mask by name, or a ready-made format (a country's phone). */
  mask: Mask;
  value?: string;
  defaultValue?: string;
  /** Receives the already formatted text. */
  onValueChange?: (value: string) => void;
};

export function MaskedField({ mask, value, defaultValue, onValueChange, ...rest }: MaskedFieldProps) {
  const [internal, setInternal] = useState(() => applyMask(mask, defaultValue ?? ""));
  const current = value !== undefined ? applyMask(mask, value) : internal;

  return (
    <Field
      // The keyboard first: the caller may override `autoComplete`.
      {...(typeof mask === "string" ? KEYBOARD[mask] : KEYBOARD.phone)}
      {...rest}
      type="text"
      value={current}
      onChange={(e) => {
        const el = e.currentTarget;
        const inputType = (e.nativeEvent as InputEvent).inputType;
        const deleted =
          inputType === "deleteContentBackward" ? "backward" : inputType === "deleteContentForward" ? "forward" : undefined;
        const { value: next, caret } = maskWithCaret(mask, el.value, el.selectionStart ?? el.value.length, current, deleted);
        // Write to the DOM before React does: React only rewrites `value` when
        // the DOM disagrees with state, and rewriting is what sends the caret
        // to the end. With both already equal, the caret stays where the mask
        // put it — even when the key was refused and the value did not change.
        el.value = next;
        el.setSelectionRange(caret, caret);
        if (value === undefined) setInternal(next);
        onValueChange?.(next);
      }}
    />
  );
}
