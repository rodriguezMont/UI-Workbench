import { useState } from "react";

import { CARD_MASK, EXPIRY_MASK, checkCardName, checkCardNumber, checkCvv, checkExpiry, cvvLength } from "@/lib/card";
import { messages } from "@/messages";

import { Field } from "./field";
import { Fieldset } from "./fieldset";
import { MaskedField } from "./masked-field";

const m = messages.ui.cardForm;

/**
 * The credit card: **the four required fields, and nothing else**.
 *
 * **It sends nothing anywhere, on purpose.** Many payment providers collect
 * the number in their own hosted page or embedded field, and then these fields
 * go away and only the frame stays. What does not depend on that choice is the
 * interaction, and that is what lives here.
 *
 * **Nothing here stores, logs or repeats the number.** The fields have no
 * `name`, so no form around them carries them away by accident, and the value
 * only exists while the screen does. `onChange` hands the caller the data to
 * pass straight to a payment provider.
 *
 * **What changes with the card is only the format**: American Express has 15
 * digits in 4-6-5 groups and a 4-digit code; the rest have 16 in groups of
 * four, with a 3-digit code. No card network logos: each network has its own
 * usage rules, and nothing here depends on them.
 *
 * **No sentence here promises what the product does with the number** — "we
 * never store your card" depends on how payments are wired, and a promise that
 * cannot be kept is worse than silence.
 *
 * **An error shows after the person leaves the field** — half a number typed
 * is not a mistake. The checks are a courtesy (Luhn, the expiration date, the
 * code's length); whether the card exists and has credit is the issuer's answer.
 */

export type CardData = {
  /** Digits only. */
  number: string;
  name: string;
  /** `MM/YY`. */
  expiry: string;
  cvv: string;
  /** All four fields filled in, with no format error. */
  complete: boolean;
};

type CardFields = { number: string; name: string; expiry: string; cvv: string };

const errorsOf = (card: CardFields) => ({
  number: checkCardNumber(card.number),
  name: checkCardName(card.name),
  expiry: checkExpiry(card.expiry),
  cvv: checkCvv(card.cvv, card.number),
});

type CardFormProps = {
  legend?: string;
  hint?: string;
  /** The group's error — what only the issuer knows: "Card declined". */
  error?: string;
  onChange?: (card: CardData) => void;
  disabled?: boolean;
  className?: string;
};

export function CardForm({ legend = m.legend, hint, error, onChange, disabled, className }: CardFormProps) {
  const [card, setCard] = useState<CardFields>({ number: "", name: "", expiry: "", cvv: "" });
  const [left, setLeft] = useState<Partial<Record<keyof CardFields, boolean>>>({});

  const digits = card.number.replace(/\D/g, "");
  const errors = errorsOf(card);
  const codeLength = cvvLength(digits);

  function change(field: keyof CardFields, value: string) {
    const next = { ...card, [field]: value };
    setCard(next);
    const valid = Object.values(errorsOf(next)).every((e) => e === null);
    onChange?.({
      number: next.number.replace(/\D/g, ""),
      name: next.name,
      expiry: next.expiry,
      cvv: next.cvv,
      complete: valid && Boolean(next.number && next.name.trim() && next.expiry && next.cvv),
    });
  }

  /** The error only shows once the person has left the field. */
  const errorOf = (field: keyof CardFields) => (left[field] ? errors[field] : null) ?? undefined;
  const onLeave = (field: keyof CardFields) => () => setLeft((current) => ({ ...current, [field]: true }));

  return (
    <Fieldset legend={legend} hint={hint} error={error} disabled={disabled} className={className}>
      <div className="grid gap-3">
        <MaskedField
          mask={CARD_MASK}
          label={m.number}
          placeholder={m.numberPlaceholder}
          icon="card"
          autoComplete="cc-number"
          inputMode="numeric"
          value={card.number}
          onValueChange={(v) => change("number", v)}
          onBlur={onLeave("number")}
          error={errorOf("number")}
          disabled={disabled}
          required
        />

        <Field
          label={m.name}
          placeholder={m.namePlaceholder}
          autoComplete="cc-name"
          allow="name"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          value={card.name}
          onChange={(e) => change("name", e.currentTarget.value)}
          onBlur={onLeave("name")}
          error={errorOf("name")}
          hint={m.nameHint}
          disabled={disabled}
          required
        />

        {/* The date and the code are short: side by side, even on phones. */}
        <div className="grid grid-cols-2 items-start gap-3">
          <MaskedField
            mask={EXPIRY_MASK}
            label={m.expiry}
            placeholder={m.expiryPlaceholder}
            autoComplete="cc-exp"
            inputMode="numeric"
            value={card.expiry}
            onValueChange={(v) => change("expiry", v)}
            onBlur={onLeave("expiry")}
            error={errorOf("expiry")}
            disabled={disabled}
            required
          />
          <Field
            label={m.cvv}
            placeholder={"0".repeat(codeLength)}
            autoComplete="cc-csc"
            inputMode="numeric"
            maxLength={codeLength}
            value={card.cvv}
            onChange={(e) => change("cvv", e.currentTarget.value.replace(/\D/g, ""))}
            onBlur={onLeave("cvv")}
            error={errorOf("cvv")}
            hint={codeLength === 4 ? m.cvvFront : m.cvvBack}
            disabled={disabled}
            required
          />
        </div>
      </div>
    </Fieldset>
  );
}
