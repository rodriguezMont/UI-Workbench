import { createContext, useContext, useId } from "react";

import { cn } from "@/lib/cn";

import { ChoiceLabel, Fieldset, useFieldsetState } from "./fieldset";

/**
 * A single choice among a few options, all in view.
 *
 * **The browser's `<input type="radio">`**, for the same reasons as the
 * [checkbox](./checkbox.tsx), and here they weigh even more: grouping by
 * `name` already gives arrows between the options and **a single Tab stop**
 * for the whole group — the behavior a script library reimplements, the
 * browser delivers for free.
 *
 * **Radio or select.** Up to five short options, radios: people compare by
 * reading, without opening anything. More than that, or long labels, the
 * [`Select`](./select.tsx).
 *
 * **Always inside a group with a legend.** A radio alone does not exist — an
 * option called "Email" only means something under "Contact method".
 */

type RadioGroupState = {
  name: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  required?: boolean;
};

const RadioGroupContext = createContext<RadioGroupState | null>(null);

type RadioGroupProps = {
  legend: string;
  hint?: string;
  error?: string;
  hiddenLegend?: boolean;
  /** Without `name`, the group makes one up — but a form submission needs it. */
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  /** Side by side only for short options; wraps when they do not fit. */
  orientation?: "vertical" | "horizontal";
  className?: string;
  children: React.ReactNode;
};

export function RadioGroup({
  legend,
  hint,
  error,
  hiddenLegend,
  name,
  value,
  defaultValue,
  onValueChange,
  disabled,
  required,
  orientation = "vertical",
  className,
  children,
}: RadioGroupProps) {
  const fallback = useId();
  return (
    <Fieldset legend={legend} hint={hint} error={error} hiddenLegend={hiddenLegend} disabled={disabled} className={className}>
      <RadioGroupContext.Provider value={{ name: name ?? fallback, value, defaultValue, onValueChange, required }}>
        <div className={cn(orientation === "horizontal" ? "flex flex-wrap gap-x-6" : "flex flex-col")}>{children}</div>
      </RadioGroupContext.Provider>
    </Fieldset>
  );
}

type RadioProps = {
  value: string;
  label: React.ReactNode;
  /**
   * A supporting line right under the label, inside the touch target. On a
   * disabled option, it is what says why.
   */
  description?: string;
  disabled?: boolean;
};

export function Radio({ value, label, description, disabled }: RadioProps) {
  const group = useContext(RadioGroupContext);
  const { invalid, reasonId } = useFieldsetState();
  const base = useId();
  const id = `${base}-option`;
  const labelId = `${base}-label`;
  const descriptionId = `${base}-description`;
  if (!group) {
    throw new Error("<Radio> must be inside <RadioGroup>.");
  }

  // Controlled when the group receives `value`; otherwise the browser keeps
  // the state and the form submits it on its own.
  const checked = group.value !== undefined ? { checked: group.value === value } : { defaultChecked: group.defaultValue === value };

  return (
    <ChoiceLabel
      htmlFor={id}
      labelId={labelId}
      label={label}
      description={description}
      descriptionId={descriptionId}
      control={
        <input
          id={id}
          type="radio"
          name={group.name}
          value={value}
          disabled={disabled}
          required={group.required}
          aria-invalid={invalid || undefined}
          // With a description, the name is only the label, and the
          // description comes after — as in the checkbox. So does the reason
          // of a disabled group.
          aria-labelledby={description ? labelId : undefined}
          aria-describedby={[description ? descriptionId : null, reasonId].filter(Boolean).join(" ") || undefined}
          onChange={(e) => {
            if (e.currentTarget.checked) group.onValueChange?.(value);
          }}
          {...checked}
          className={cn(
            "size-5 shrink-0 cursor-[inherit] appearance-none rounded-full border-2 bg-surface",
            "transition-[border-color,background-color,box-shadow] duration-[var(--motion-instant)] ease-[var(--motion-ease)]",
            invalid ? "border-error" : "border-border-strong",
            "enabled:hover:border-accent",
            // The dot is a surface ring inside a filled disc: the checked shape,
            // with no glyph and no second element.
            "checked:border-accent checked:bg-accent checked:shadow-[inset_0_0_0_3px_var(--surface)]",
            // The global ring rounds at `--radius-sm`; on a circle, a circle.
            "focus-visible:rounded-full",
          )}
        />
      }
    />
  );
}
