import { Separator as RadixSeparator } from "radix-ui";

import { cn } from "@/lib/cn";

/**
 * A divider.
 *
 * **Decorative by default** — hidden from the accessibility tree, because a
 * line that only separates visually is not information for someone listening
 * to the page. Pass `decorative={false}` when the division carries meaning; it
 * then becomes `role="separator"`.
 */
export function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof RadixSeparator.Root>) {
  return (
    <RadixSeparator.Root
      orientation={orientation}
      decorative={decorative}
      className={cn("shrink-0 bg-divider", orientation === "horizontal" ? "h-px w-full" : "h-full w-px", className)}
      {...props}
    />
  );
}
