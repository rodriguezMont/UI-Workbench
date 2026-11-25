import { useId } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/cn";

import { CheckboxBox } from "./checkbox";
import { useFieldsetState } from "./fieldset";

/**
 * The checkbox card: the same box, with an icon, a title and a supporting line.
 *
 * **For a few options worth seeing side by side** — payment methods, add-ons
 * to a plan. Up to about six cards; beyond that, the
 * [checkbox list](./checkbox-list.tsx), because too many cards become a mosaic
 * the eye does not scan.
 *
 * **The whole card is the target**, and the box stays in view in the corner:
 * a checked card changes border and background, but the check is what says
 * "checked" without relying on color. Underneath it is the same
 * [`CheckboxBox`](./checkbox.tsx) — submitted through `name`, with no hidden
 * input.
 *
 * **The focus ring belongs to the card**, not the box: a 20px ring inside a
 * 300px card cannot be found.
 *
 * **Disabled says why in its own description** — which is the accessible
 * description, so a screen reader hears the reason with it.
 *
 * **Always inside a [`Fieldset`](./fieldset.tsx)**, which gives the legend and
 * the group's error; the caller lays the cards out in a grid.
 */

type CheckboxCardProps = Omit<React.ComponentProps<"input">, "id" | "type" | "children"> & {
  label: string;
  description?: string;
  /** The option's object, like a field's icon. */
  icon?: LucideIcon;
};

export function CheckboxCard({ label, description, icon: Icon, className, ...rest }: CheckboxCardProps) {
  const base = useId();
  const id = `${base}-card`;
  const labelId = `${base}-label`;
  const descriptionId = `${base}-description`;
  const { invalid, reasonId } = useFieldsetState();

  return (
    <label
      htmlFor={id}
      className={cn(
        "group flex cursor-pointer items-start gap-3 rounded-md border-2 bg-surface p-3 text-sm",
        "transition-colors duration-[var(--motion-instant)] ease-[var(--motion-ease)]",
        invalid ? "border-error" : "border-border-strong",
        "has-[:enabled]:hover:border-accent",
        "has-[:checked]:border-accent has-[:checked]:bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]",
        "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus-ring)]",
        "has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50",
        className,
      )}
      style={{ minHeight: "var(--tap-target)" }}
    >
      {Icon ? <Icon size={20} aria-hidden className="shrink-0 text-secondary group-has-[:checked]:text-accent" /> : null}
      <span className="min-w-0 flex-1">
        <span id={labelId} className="block font-medium text-primary">
          {label}
        </span>
        {description ? (
          <span id={descriptionId} className="mt-0.5 block text-secondary">
            {description}
          </span>
        ) : null}
      </span>
      <CheckboxBox
        {...rest}
        id={id}
        invalid={invalid}
        aria-labelledby={labelId}
        aria-describedby={[description ? descriptionId : null, reasonId].filter(Boolean).join(" ") || undefined}
        // The ring lives on the card.
        className="focus-visible:outline-none"
      />
    </label>
  );
}
