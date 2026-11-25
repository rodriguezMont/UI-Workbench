import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/cn";

/**
 * A short label for a status or a category.
 *
 * **Never color alone.** A badge that tells states apart only by tone shuts
 * out anyone who does not perceive the hue: the text inside it IS the
 * information, and the color only reinforces it.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        neutral: "border-border text-secondary",
        // The color goes on the border and the icon; the text uses the
        // `-label` role, which is light ink in dark mode.
        accent: "border-accent text-accent-label [&_svg]:text-accent",
        action: "border-signal text-signal-label [&_svg]:text-signal",
        /** Filled: for the single highlight of a screen, never for several. */
        solid: "border-transparent bg-signal text-on-signal",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

type BadgeProps = React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
