import { Tabs as RadixTabs } from "radix-ui";

import { cn } from "@/lib/cn";

/**
 * Tabs — switch views **without switching routes**.
 *
 * The rule for tab versus route: if the state deserves an address the person
 * can share or come back to, it is a route. A tab is for a slice that only
 * makes sense inside the screen it lives on.
 *
 * Radix provides the expensive, invisible part: arrow keys move between tabs,
 * `Home` and `End` jump to the ends, and `aria-selected` follows on its own.
 */
export function Tabs({ className, ...props }: React.ComponentProps<typeof RadixTabs.Root>) {
  return <RadixTabs.Root className={cn("w-full", className)} {...props} />;
}

/**
 * The tab list, in two layouts.
 *
 * **`scroll` (default): when the tabs do not fit, the list scrolls sideways —
 * a label never disappears.** Four tabs can easily outgrow 375px; scrolling
 * works for any number of tabs and any label length, and the tab cut at the
 * edge is itself the hint that there is more. Three details it requires:
 *
 * - **The bottom line is a background, not a border.** Inside a scrolling
 *   container a border and the tabs' negative margins would be clipped; a
 *   background stays put while the content scrolls, so the line spans the
 *   whole list.
 * - **`p-1 -m-1 scroll-px-1` leave room for the focus ring.** `overflow-x`
 *   clips any outline that leaves the box, and the ring is the same on every
 *   control — it does not shrink here. The negative margin restores the
 *   layout; `scroll-padding` makes `scrollIntoView` stop 4px from the edge
 *   instead of clipping the ring.
 * - **Hidden scrollbar.** Touch devices hide it anyway; with a mouse, the cut
 *   tab and the arrow keys say the same without a gray strip under the tabs.
 *
 * **`equal`: equal columns that fill the width and never scroll.** Narrow, the
 * icon sits above the label; from 36rem of list width, side by side. Up to
 * four tabs — it does not scale to many.
 */
export function TabsList({
  variant = "scroll",
  className,
  ...props
}: React.ComponentProps<typeof RadixTabs.List> & { variant?: "scroll" | "equal" }) {
  return (
    <RadixTabs.List
      className={cn(
        "bg-[linear-gradient(var(--border),var(--border))] bg-[length:100%_1px] bg-bottom bg-no-repeat bg-origin-content",
        variant === "scroll"
          ? [
              "-m-1 flex items-center gap-1 overflow-x-auto p-1 scroll-px-1",
              "[scrollbar-width:none] scroll-smooth motion-reduce:scroll-auto",
            ]
          : [
              "@container/tabs grid auto-cols-fr grid-flow-col",
              "[&>[role=tab]]:flex [&>[role=tab]]:min-h-14 [&>[role=tab]]:min-w-0 [&>[role=tab]]:flex-col [&>[role=tab]]:items-center [&>[role=tab]]:justify-center [&>[role=tab]]:gap-1 [&>[role=tab]]:px-1 [&>[role=tab]]:text-xs",
              "@min-[36rem]/tabs:[&>[role=tab]]:min-h-[var(--tap-target)] @min-[36rem]/tabs:[&>[role=tab]]:flex-row @min-[36rem]/tabs:[&>[role=tab]]:gap-2 @min-[36rem]/tabs:[&>[role=tab]]:text-sm",
            ],
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({ className, onFocus, ...props }: React.ComponentProps<typeof RadixTabs.Trigger>) {
  return (
    <RadixTabs.Trigger
      // A tab that receives focus scrolls into view. Arrow keys already do
      // this; a tap on a half-hidden tab would otherwise activate it while it
      // stays cut off.
      onFocus={(e) => {
        onFocus?.(e);
        e.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest" });
      }}
      className={cn(
        "min-h-[var(--tap-target)] shrink-0 whitespace-nowrap border-b-2 border-transparent px-3 text-sm font-medium text-secondary",
        "transition-colors duration-[var(--motion-instant)] ease-[var(--motion-ease)]",
        "hover:text-primary",
        // The active state does not rely on color alone: the bottom border is
        // its shape.
        "data-[state=active]:border-accent data-[state=active]:text-accent-label data-[state=active]:[&_svg]:text-accent",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

/**
 * A panel. Pass `forceMount` to keep every panel in the HTML and hide the
 * inactive ones with CSS only — search engines read content inside a closed
 * tab, which they would not find if it were never rendered.
 */
export function TabsContent({ className, ...props }: React.ComponentProps<typeof RadixTabs.Content>) {
  return <RadixTabs.Content className={cn("pt-4 data-[state=inactive]:hidden", className)} {...props} />;
}
