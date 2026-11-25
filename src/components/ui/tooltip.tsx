import { createContext, useContext, useRef, useState } from "react";
import { Tooltip as RadixTooltip } from "radix-ui";

import { cn } from "@/lib/cn";

/**
 * A short explanation on hover or focus.
 *
 * **Never the only source of the information.** A tooltip does not show on
 * touch, does not print, and vanishes the moment the pointer moves. If what
 * it says is needed to act, it belongs on the screen, not in a bubble. It is
 * for the detail that helps, not the one that decides.
 *
 * **The `TooltipProvider` lives once, at the app shell.** It coordinates the
 * delay between neighboring tooltips so the second one does not wait again.
 * Per page, every screen would have to remember — and forgetting breaks
 * nothing visible, it just makes tooltips slow in a way nobody traces back.
 */
export const TooltipProvider = RadixTooltip.Provider;

/**
 * **A scroll is being dispatched.** True while a `scroll` event is being
 * handled, false again on the next task.
 *
 * This is how `TooltipRoot` tells a close caused by scrolling apart from the
 * others (Escape, blur, click): Radix calls the same `onOpenChange(false)` for
 * all of them without saying why.
 *
 * **The listener is registered when the module loads**, not on mount:
 * listeners on the same target and phase fire in registration order, and ours
 * must run before Radix's. On mount it would fail with `defaultOpen` — the
 * tooltip's effect (child) runs before `TooltipRoot`'s (parent), and Radix
 * would register first. There is no `window`, and no scrolling, on a server.
 */
let scrolling = false;
if (typeof window !== "undefined") {
  window.addEventListener(
    "scroll",
    () => {
      scrolling = true;
      window.setTimeout(() => {
        scrolling = false;
      }, 0);
    },
    { capture: true, passive: true },
  );
}

const TriggerContext = createContext<React.RefObject<HTMLElement | null> | null>(null);

/**
 * **A tooltip opened from the keyboard does not close because the page
 * scrolled.**
 *
 * Radix closes a tooltip on any scroll that contains its trigger. With a
 * mouse that makes sense — whoever scrolls is moving on. With a keyboard it
 * does not: tabbing to a trigger outside the viewport MAKES the page scroll to
 * it, and the tooltip opened and closed in the same frame. Keyboard users
 * never saw the tooltip of a control that was not already on screen.
 *
 * The rule is WCAG 1.4.13: content that appears on focus stays until focus
 * leaves or the person dismisses it. So scrolling is ignored only while the
 * trigger has keyboard focus (`:focus-visible`); blur, Escape and click still
 * close it, and a tooltip opened by the mouse still closes on scroll. The
 * positioning engine repositions the bubble while scrolling, so it follows the
 * trigger instead of floating loose.
 */
export function TooltipRoot({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof RadixTooltip.Root>) {
  const triggerRef = useRef<HTMLElement | null>(null);
  const [openState, setOpenState] = useState(defaultOpen);

  return (
    <TriggerContext value={triggerRef}>
      <RadixTooltip.Root
        {...props}
        open={openProp ?? openState}
        onOpenChange={(next) => {
          const el = triggerRef.current;
          const keyboardFocus = el !== null && el === document.activeElement && el.matches(":focus-visible");
          if (!next && scrolling && keyboardFocus) return;
          setOpenState(next);
          onOpenChange?.(next);
        }}
      />
    </TriggerContext>
  );
}

/**
 * The trigger introduces itself to `TooltipRoot` **on focus**, the only moment
 * the rule above needs it. Through the event rather than a `ref`, so the
 * caller's `ref` reaches Radix untouched, with nothing to merge. Our `onFocus`
 * runs before Radix's, so the element is registered when the bubble opens.
 */
export function TooltipTrigger({ onFocus, ...props }: React.ComponentProps<typeof RadixTooltip.Trigger>) {
  const triggerRef = useContext(TriggerContext);
  return (
    <RadixTooltip.Trigger
      {...props}
      onFocus={(e) => {
        if (triggerRef) triggerRef.current = e.currentTarget;
        onFocus?.(e);
      }}
    />
  );
}

export function TooltipContent({
  className,
  children,
  sideOffset = 6,
  // 8px from the screen edge. Without it Radix pushes the bubble inward until
  // it touches the edge, with its rounded corners cut against it.
  collisionPadding = 8,
  // A keyboard-opened tooltip survives scrolling (see `TooltipRoot`). If its
  // trigger sits in a scrolling panel and disappears behind the panel's edge,
  // the bubble — portaled to `body` — would float over something else. This
  // hides it while the trigger is out of view.
  hideWhenDetached = true,
  ...props
}: React.ComponentProps<typeof RadixTooltip.Content>) {
  return (
    <RadixTooltip.Portal>
      <RadixTooltip.Content
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        hideWhenDetached={hideWhenDetached}
        className={cn(
          "z-50 max-w-64 rounded-md bg-surface-contrast px-2.5 py-1.5 text-xs text-on-contrast shadow-md",
          // Grows out of the trigger rather than from its own center.
          "origin-[var(--radix-tooltip-content-transform-origin)]",
          "animate-[ui-tooltip-in_var(--motion-fast)_var(--motion-ease-out)]",
          className,
        )}
        {...props}
      >
        {children}
        <RadixTooltip.Arrow className="fill-[var(--surface-contrast)]" />
      </RadixTooltip.Content>
    </RadixTooltip.Portal>
  );
}
