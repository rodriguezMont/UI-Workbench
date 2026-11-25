import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/cn";

/**
 * The button: it acts on the screen. If a click changes the address, it is a
 * [`TextLink`](./link.tsx) — or a link rendered through `asChild`.
 *
 * **No literal color here.** Everything goes through role tokens — `--action`
 * for the fill, `--border-strong` for the outline, `--focus-ring` for the
 * focus ring (from the base layer). Changing the theme changes values, never
 * this file.
 *
 * **The 44px floor belongs to the touch area, not to the box.** `md`, `lg` and
 * `icon` already have a box of 44 or more, so the two coincide. `sm` and
 * `icon-sm` are the declared exceptions: a 36px box for dense contexts — a
 * header, a filter bar, a photo corner — with `touch-area` extending the hit
 * area to 44 outside the box. In forms the size is always `md`, the height of
 * a field.
 *
 * `min-h`, not `h`: the box may grow, never shrink.
 *
 * **The destructive variant is for CONFIRMING, not for offering.** A full red
 * target on screen invites an expensive mistake. The trigger of a destructive
 * action is `secondary` or `ghost`; `destructive` lives in the second step,
 * inside the dialog, once the person has read what they are about to lose.
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-md font-medium",
    "transition-[background-color,border-color,color,opacity]",
    "duration-[var(--motion-instant)] ease-[var(--motion-ease)]",
    // The ring itself comes from the base layer's `:focus-visible` rule; this
    // only keeps it clear of the box.
    "outline-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        /** The action the screen exists to receive. One per screen. */
        primary: "bg-action text-action-text hover:opacity-90 active:opacity-80",
        /**
         * A sibling of equal weight, next to the primary only — when a screen
         * offers two paths that matter the same. Never on its own in place of
         * the primary.
         */
        alternate: "bg-action-alt text-inverse hover:opacity-90 active:opacity-80",
        /** The legitimate alternative, without competing with the primary. */
        secondary: "border border-border-strong bg-surface text-primary hover:border-action",
        /** A supporting action: no weight, no outline, still clickable. */
        ghost: "text-secondary hover:bg-surface-hover hover:text-primary",
        /** Looks like a link, acts like a button: undo, cancel, "show more". */
        link: "text-link underline underline-offset-2 hover:opacity-80",
        /** Only for the CONFIRMATION step of something irreversible. */
        destructive: "bg-error-fill text-on-error hover:opacity-90 active:opacity-80",
        /**
         * On top of a photo, which can be any color: its own background and
         * shadow, round.
         */
        overlay:
          "rounded-full bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] text-primary shadow-md hover:bg-surface",
      },
      size: {
        /** 36px box; the touch area stays 44 through `touch-area`. */
        sm: "relative touch-area min-h-9 px-3 text-sm",
        md: "min-h-[var(--tap-target)] px-4 text-sm",
        lg: "min-h-12 px-6 text-base",
        /** Square, icon only. An accessible label becomes mandatory. */
        icon: "min-h-[var(--tap-target)] w-[var(--tap-target)] p-0",
        /**
         * A 36px square whose touch area stays 44: for where three 44px
         * buttons would not fit without overlapping.
         */
        "icon-sm": "relative touch-area size-9 min-h-9 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /**
     * Renders the child in place of the `<button>`, inheriting the styles.
     * This is how a router link looks like a button without nesting a
     * `<button>` inside an `<a>`.
     */
    asChild?: boolean;
  };

export function Button({ className, variant, size, asChild = false, type, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      // HTML defaults `type` to `submit`, so a button without one inside a
      // form submits it by accident. Here the default is the harmless one.
      type={asChild ? undefined : (type ?? "button")}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
