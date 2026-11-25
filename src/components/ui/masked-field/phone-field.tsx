import { useId, useMemo, useState } from "react";

import { cn } from "@/lib/cn";
import { applyMask } from "@/lib/mask";
import { DEFAULT_COUNTRY, checkPhone, countries, examplePhone, phoneSpec, readPasted, toE164, type CountryCode } from "@/lib/phone";
import { messages } from "@/messages";

import { FieldMessages, describedByOf } from "../fieldset";
import { MaskedField } from "../masked-field";
import { Select } from "../select";

const m = messages.ui.phone;

/**
 * **A phone with a country**: the country code in a searchable select, and the
 * number in a masked field whose shape follows it.
 *
 * - **The US preselected**, and the rest of the world by name in the interface
 *   language. The code comes before the name ("+1 United States") because it
 *   is what survives when the column truncates. **No flags**: as SVG they
 *   weigh, and as emoji they do not render on Windows.
 * - **Real validation** (`phone.ts`, `max` metadata): an area code that does
 *   not exist is caught, and the sentence says what to check. Like every mask,
 *   a courtesy: the server checks again. The error waits until the person
 *   leaves the number.
 * - **Pasting "+351 912 345 678" switches the country** on its own.
 * - **The submitted value is E.164** (`+12133734253`), in a hidden input —
 *   empty while the number is not valid.
 *
 * **One label, one supporting line.** The visible label sits over both
 * controls, and the hint and error under both: with room for both side by
 * side, it is as tall as a field and aligns with its neighbor. Screen readers
 * hear "Country code for Phone" and "Phone", each on its own control.
 */
export function PhoneField({
  label,
  name,
  value,
  defaultValue,
  onValueChange,
  hint,
  error,
  disabled,
  required,
  className,
}: {
  label: string;
  /** Name in the submission — the E.164 value goes. */
  name?: string;
  /** E.164: `+12133734253`. */
  value?: string;
  defaultValue?: string;
  /** Receives E.164, or empty while the number is not valid. */
  onValueChange?: (value: string) => void;
  hint?: React.ReactNode;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}) {
  const base = useId();
  const ids = { hintId: `${base}-hint`, errorId: `${base}-error` };

  const initial = readValue(value ?? defaultValue ?? "");
  const [country, setCountry] = useState<CountryCode>(initial.country);
  const [number, setNumber] = useState(initial.national);
  const [left, setLeft] = useState(false);

  // Controlled: the outside value rewrites only when it disagrees with what is
  // on screen — otherwise every key of an incomplete number (which reports
  // empty) would erase it.
  const [seen, setSeen] = useState(value);
  if (value !== seen) {
    setSeen(value);
    if (value !== undefined && value !== toE164(number, country)) {
      const read = readValue(value);
      setCountry(read.country);
      setNumber(read.national);
    }
  }

  const options = useMemo(() => countries().map((c) => ({ value: c.code, label: `+${c.callingCode} ${c.name}` })), []);
  const shownError = error ?? (left ? checkPhone(number, country) : null) ?? undefined;

  function change(nextNumber: string, nextCountry: CountryCode) {
    const before = toE164(number, country);
    setNumber(nextNumber);
    setCountry(nextCountry);
    const after = toE164(nextNumber, nextCountry);
    if (after !== before) onValueChange?.(after);
  }

  return (
    <div className={cn("@container w-full", className)}>
      {/* Visible and hidden from screen readers: each control has its own label. */}
      <span aria-hidden className="mb-1.5 block text-sm font-medium text-primary">
        {label}
      </span>
      {name ? <input type="hidden" name={name} value={toE164(number, country)} /> : null}
      {/* Side by side only with room for both — by the field's own width, not
          the screen's: in a narrow column of a wide form the number would cut,
          and on a phone the country would truncate. Below 24rem, they stack. */}
      <div className="grid items-start gap-2 @min-[24rem]:grid-cols-[9.5rem_minmax(0,1fr)]">
        <Select
          label={m.countryCodeOf(label)}
          hiddenLabel
          searchable
          searchPlaceholder={m.countrySearch}
          options={options}
          value={country}
          onValueChange={(next) => {
            const c = next as CountryCode;
            // The number already typed takes the new country's shape.
            change(applyMask(phoneSpec(c), number), c);
          }}
          disabled={disabled}
        />
        <MaskedField
          mask={phoneSpec(country)}
          label={label}
          hiddenLabel
          icon="phone"
          placeholder={examplePhone(country)}
          autoComplete="tel-national"
          value={number}
          onValueChange={(n) => change(n, country)}
          onPaste={(e) => {
            const read = readPasted(e.clipboardData.getData("text"), country);
            if (!read) return;
            e.preventDefault();
            change(applyMask(phoneSpec(read.country), read.national), read.country);
          }}
          onBlur={() => setLeft(true)}
          aria-invalid={shownError ? true : undefined}
          aria-describedby={describedByOf(ids, hint, shownError)}
          disabled={disabled}
          required={required}
        />
      </div>
      <FieldMessages {...ids} hint={hint} error={shownError} />
    </div>
  );
}

/** E.164 → country and formatted number. Empty or unreadable: the default country, empty. */
function readValue(e164: string): { country: CountryCode; national: string } {
  const read = e164 ? readPasted(e164, DEFAULT_COUNTRY) : null;
  return read
    ? { country: read.country, national: applyMask(phoneSpec(read.country), read.national) }
    : { country: DEFAULT_COUNTRY, national: "" };
}
