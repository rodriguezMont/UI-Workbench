import { useId, useState } from "react";

import { cn } from "@/lib/cn";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  /** An icon before the label, always decorative — the label is what speaks. */
  icon?: React.ReactNode;
};

type SegmentedControlProps<T extends string> = {
  /** What is being chosen: "Sort by", "Period". Always present; sometimes only for listeners. */
  legend: string;
  /** Hides the legend from the screen when the options explain themselves — never from listeners. */
  hiddenLegend?: boolean;
  /** The field name in the form. Without it, a unique name of its own. */
  name?: string;
  options: readonly SegmentedOption<T>[];
  value?: T;
  /** Without `value` or `defaultValue`, the first option starts checked: one is always set. */
  defaultValue?: T;
  onValueChange?: (value: T) => void;
  className?: string;
};

/**
 * The segmented control: **two to four options side by side, one always
 * checked** — a sort order, the period of a chart.
 *
 * **It is a real radio group**, with each option's box drawn on its label: the
 * arrows switch, Tab enters and leaves the group in one stop, and without
 * script the form still submits the choice through `name`. No
 * `role="tablist"`: a tab switches what is shown, and this chooses a value.
 *
 * **More than four is not segmented** — it is a select. Five boxes side by
 * side do not fit at 375 without wrapping, and a control that wraps loses what
 * makes it read at a glance.
 */
export function SegmentedControl<T extends string>({
  legend,
  hiddenLegend = false,
  name,
  options,
  value,
  defaultValue,
  onValueChange,
  className,
}: SegmentedControlProps<T>) {
  const base = useId();
  const [inner, setInner] = useState<T | undefined>(defaultValue ?? options[0]?.value);
  const current = value ?? inner;

  function choose(next: T) {
    if (value === undefined) setInner(next);
    onValueChange?.(next);
  }

  return (
    <fieldset className={className}>
      <legend className={cn("mb-1.5 text-sm font-medium text-primary", hiddenLegend && "sr-only")}>{legend}</legend>
      <div className="inline-flex flex-wrap gap-1 rounded-lg bg-surface-sunken p-1">
        {options.map((option) => {
          const checked = current === option.value;
          return (
            <label
              key={option.value}
              className={cn(
                // A 36px box on a 4px track: 44 outside, and touch stays 44
                // through `touch-area`.
                "relative touch-area inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-md px-3 text-sm font-medium",
                "transition-colors duration-[var(--motion-instant)] ease-[var(--motion-ease)]",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus-ring)]",
                checked
                  ? "bg-surface text-accent-label shadow-sm ring-1 ring-accent [&_svg]:text-accent"
                  : "text-secondary hover:text-primary",
              )}
            >
              <input
                type="radio"
                name={name ?? `${base}-option`}
                value={option.value}
                className="sr-only"
                checked={checked}
                onChange={() => choose(option.value)}
              />
              {option.icon}
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
