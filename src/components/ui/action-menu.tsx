import { useEffect, useRef } from "react";
import type { LucideIcon } from "lucide-react";
import { DropdownMenu } from "radix-ui";

import { cn } from "@/lib/cn";

/**
 * The action menu: several actions on one item, behind a button.
 *
 * **Actions, not values.** A select picks something that goes into a form;
 * this menu **acts** at once — rename, remove, share. If the choice is stored
 * and only counts on save, it is a select.
 *
 * **Radix provides keyboard and focus:** arrows move and wrap, a letter jumps
 * to the item, Enter and Space run it, Escape closes and returns focus to the
 * button.
 *
 * **Every item has text**; the icon only reinforces it. **The dangerous item
 * goes last, separated and in the error color** — and, when it cannot be
 * undone, it confirms through an [`AlertDialog`](./dialog.tsx). An unavailable
 * item says why, on its own line.
 *
 * **A menu with a single action is not a menu:** it is a button. Decide by the
 * number of actions, not by looks.
 *
 * **Focus after the action.** On close the menu returns focus to the button
 * that opened it. When the action removes that button — deleting the photo
 * that carried it — point to the new target with `usePendingFocus`, below.
 */

export const ActionMenu = DropdownMenu.Root;
export const ActionMenuTrigger = DropdownMenu.Trigger;

export function ActionMenuContent({
  className,
  align = "end",
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof DropdownMenu.Content>) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        align={align}
        sideOffset={sideOffset}
        // Never against the screen edge: on phones the menu opens close to it.
        collisionPadding={8}
        className={cn(
          "z-50 min-w-48 max-w-[calc(100vw-1rem)] rounded-md border border-border bg-surface-raised p-1 floating-edge",
          "animate-[ui-fade-in_var(--motion-fast)_var(--motion-ease-out)]",
          className,
        )}
        {...props}
      />
    </DropdownMenu.Portal>
  );
}

type ActionMenuItemProps = React.ComponentProps<typeof DropdownMenu.Item> & {
  icon?: LucideIcon;
  /** Remove, cancel: in the error color, and last. */
  destructive?: boolean;
  /** A supporting line — on an unavailable item, the reason. */
  description?: string;
};

export function ActionMenuItem({
  icon: Icon,
  destructive = false,
  description,
  className,
  children,
  ...props
}: ActionMenuItemProps) {
  return (
    <DropdownMenu.Item
      className={cn(
        "flex cursor-pointer select-none items-start gap-3 rounded-md px-3 py-2.5 text-sm outline-none",
        destructive ? "text-error" : "text-primary",
        destructive
          ? "data-[highlighted]:bg-[color-mix(in_srgb,var(--state-error)_10%,transparent)]"
          : "data-[highlighted]:bg-surface-highlight",
        "data-[disabled]:cursor-not-allowed data-[disabled]:text-subtle",
        className,
      )}
      style={{ minHeight: "var(--tap-target)" }}
      {...props}
    >
      {Icon ? <Icon size={18} aria-hidden className="mt-px shrink-0" /> : null}
      <span className="min-w-0 flex-1">
        <span className="block">{children}</span>
        {description ? (
          // The reason does not fade with the item: whoever cannot use it
          // needs to read why.
          <span className="mt-0.5 block text-xs text-secondary">{description}</span>
        ) : null}
      </span>
    </DropdownMenu.Item>
  );
}

export function ActionMenuSeparator({ className, ...props }: React.ComponentProps<typeof DropdownMenu.Separator>) {
  return <DropdownMenu.Separator className={cn("mx-1 my-1 h-px bg-divider", className)} {...props} />;
}

/** The title of a group of items — when the menu is about something specific. */
export function ActionMenuLabel({ className, ...props }: React.ComponentProps<typeof DropdownMenu.Label>) {
  return <DropdownMenu.Label className={cn("px-3 pb-1 pt-2 text-xs font-medium text-subtle", className)} {...props} />;
}

/**
 * Focus after an action that changes the screen.
 *
 * `focusLater(() => element)` records the target; it is applied once the new
 * screen is ready. Put `onCloseAutoFocus` on the menu content: without it the
 * menu would return focus to the button that opened it — which may have gone
 * with the action. **Radix returns focus in a `setTimeout`, after the new
 * screen**, which is why the "already focused" flag lives a moment longer.
 */
export function usePendingFocus() {
  const target = useRef<(() => HTMLElement | null | undefined) | null>(null);
  const focused = useRef(false);

  useEffect(() => {
    const next = target.current;
    if (!next) return;
    // The menu survived the action and is still closing: its focus trap would
    // pull focus straight back, and lose it when the menu goes (focus briefly
    // sits on `body` in between, so where focus is says nothing). Leave the
    // target to `onCloseAutoFocus`, which runs once the trap is gone. When the
    // action took the menu away with its row, there is no menu left, and the
    // target is applied here.
    if (document.querySelector('[role="menu"]')) return;
    target.current = null;
    const el = next();
    if (!el) return;
    el.focus();
    focused.current = true;
    // No cleanup on purpose: the next render would cancel the timer and the
    // flag would stay on for the next menu.
    window.setTimeout(() => {
      focused.current = false;
    }, 50);
  });

  return {
    focusLater(next: () => HTMLElement | null | undefined) {
      target.current = next;
    },
    onCloseAutoFocus(event: Event) {
      if (target.current) {
        event.preventDefault();
        const next = target.current;
        target.current = null;
        next()?.focus();
        return;
      }
      if (focused.current) {
        event.preventDefault();
        focused.current = false;
      }
    },
  };
}
