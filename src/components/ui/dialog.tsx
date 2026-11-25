import { X } from "lucide-react";
import { AlertDialog as RadixAlert, Dialog as RadixDialog } from "radix-ui";

import { cn } from "@/lib/cn";
import { messages } from "@/messages";

/**
 * Two dialogs, and the difference between them is not cosmetic.
 *
 * - **`Dialog`** interrupts to ask for something that can be abandoned: a
 *   short form, a detail. It closes on `Escape`, on a click outside and on X.
 * - **`AlertDialog`** interrupts to demand a choice. **It does not close on a
 *   click outside and has no X** — leaving requires saying "cancel". It is the
 *   right one for what cannot be undone: deleting, cancelling a subscription.
 *
 * Using the first where the second belongs is how a stray click becomes a
 * deletion.
 *
 * Radix provides the expensive part: focus trapped while open, focus back on
 * the trigger when closed, `aria-modal`, and the rest of the page hidden from
 * screen readers. None of it is visible, and all of it breaks silently when
 * written by hand.
 *
 * Product screens usually reach these through [`Overlay`](./overlay.tsx),
 * which picks a dialog or a sheet by screen width.
 */

const OVERLAY = [
  "fixed inset-0 z-50 scrim",
  "data-[state=open]:animate-[ui-fade-in_var(--motion-fast)_var(--motion-ease-out)]",
].join(" ");

const CONTENT = [
  "fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2",
  // Opaque, with the light edge of floating panels: a translucent dialog would
  // let the page show through, and a dialog interrupts what is behind it.
  "rounded-lg border border-border bg-surface-raised p-5 floating-edge",
  // A column: with a fixed height, the footer goes to the bottom instead of
  // leaving empty space under it.
  "flex flex-col",
  "data-[state=open]:animate-[ui-dialog-in_var(--motion-base)_var(--motion-ease-out)]",
  // The max height and inner scroll exist for the phone keyboard: without them
  // a dialog with a form pushes its buttons off screen.
  "max-h-[calc(100dvh-2rem)] overflow-y-auto",
].join(" ");

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;
export const DialogClose = RadixDialog.Close;

const CLOSE =
  "flex shrink-0 items-center justify-center rounded-md text-secondary transition-colors duration-[var(--motion-instant)] hover:text-primary";

export function DialogContent({
  className,
  children,
  title,
  description,
  media,
  ...props
}: React.ComponentProps<typeof RadixDialog.Content> & {
  /** Required: it is the dialog's accessible name. */
  title: string;
  description?: string;
  /**
   * **The celebration layout.** With a small image or mark, it opens the
   * header on the left with the close button on the right; below, the title on
   * one line, the text and `children` full width, centered. For a moment worth
   * celebrating (a request sent, a goal reached) — never for asking a decision.
   */
  media?: React.ReactNode;
}) {
  const close = (
    <RadixDialog.Close
      aria-label={messages.ui.dialog.close}
      className={cn(CLOSE, "-mr-1 -mt-1")}
      style={{ minHeight: "var(--tap-target)", minWidth: "var(--tap-target)" }}
    >
      <X size={20} aria-hidden />
    </RadixDialog.Close>
  );

  if (media) {
    return (
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={OVERLAY} />
        <RadixDialog.Content
          className={cn(CONTENT, "@container max-w-[23rem] items-center px-5 pb-8 pt-5 text-center sm:px-7", className)}
          {...props}
        >
          <div className="mb-10 flex w-full items-center justify-between">
            {media}
            {close}
          </div>
          {/* One-line title: the size follows the dialog width, between the
              body size and `text-lg`, so the title is never smaller than the text. */}
          <RadixDialog.Title className="text-[clamp(1rem,6cqw,1.125rem)] font-bold">{title}</RadixDialog.Title>
          {description ? (
            <RadixDialog.Description className="mt-4 text-base text-pretty text-secondary">
              {description}
            </RadixDialog.Description>
          ) : null}
          <div className="mt-10 w-full">{children}</div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    );
  }

  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className={OVERLAY} />
      <RadixDialog.Content className={cn(CONTENT, className)} {...props}>
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <RadixDialog.Title className="text-base font-bold">{title}</RadixDialog.Title>
            {description ? (
              <RadixDialog.Description className="text-sm text-secondary">{description}</RadixDialog.Description>
            ) : null}
          </div>
          {close}
        </div>
        {children}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}

export const AlertDialog = RadixAlert.Root;
export const AlertDialogTrigger = RadixAlert.Trigger;
export const AlertDialogCancel = RadixAlert.Cancel;
export const AlertDialogAction = RadixAlert.Action;

export function AlertDialogContent({
  className,
  children,
  title,
  description,
  ...props
}: React.ComponentProps<typeof RadixAlert.Content> & {
  title: string;
  description?: string;
}) {
  return (
    <RadixAlert.Portal>
      <RadixAlert.Overlay className={OVERLAY} />
      <RadixAlert.Content className={cn(CONTENT, className)} {...props}>
        <RadixAlert.Title className="text-base font-bold">{title}</RadixAlert.Title>
        {description ? (
          <RadixAlert.Description className="mt-1 text-sm text-secondary">{description}</RadixAlert.Description>
        ) : null}
        {children}
      </RadixAlert.Content>
    </RadixAlert.Portal>
  );
}
