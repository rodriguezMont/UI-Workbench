import { createContext, useContext, useMemo, useRef, useState } from "react";
import { AlertDialog as RadixAlert, Dialog as RadixDialog, Slot } from "radix-ui";

import { cn } from "@/lib/cn";
import { OVERLAY_DIALOG_QUERY, type OverlayFrame } from "@/lib/overlay";

import { Button } from "./button";
import { AlertDialogContent, DialogContent } from "./dialog";
import { Sheet, SheetContent } from "./sheet";

/**
 * The overlay — **content written once, frame chosen by width at the moment
 * it opens.** Below 768px it is the [sheet](./sheet.tsx); from 768 up, the
 * [dialog](./dialog.tsx). Those two stay available as building blocks, but
 * product screens use this piece, which assembles them.
 *
 * ## The frame is chosen on open, and does not switch
 *
 * The frame is decided when the overlay opens, by the width the browser
 * reports — never on a server, which sends the same page to everyone. Every
 * overlay starts closed, so server and browser HTML always agree. **Once open,
 * the frame stays**: rotating the phone does not swap the sheet for a dialog
 * in the middle of what the person was typing.
 *
 * ## Actions are a list, and the frame arranges them
 *
 * In the sheet, stacked full width, near the thumb; in the dialog, in a row on
 * the right. Every action closes the overlay after running. They **stick to
 * the bottom** when the body scrolls, so "Show 9 results" does not disappear
 * under a long list.
 *
 * ## An alert cannot be dismissed, in either frame
 *
 * `kind="alert"`: on desktop, the alert dialog; on a phone, a sheet **without a
 * handle** that does not close on drag or outside tap. Escape counts as
 * "cancel", and focus starts on the cancel action — a stray tap never lands on
 * the irreversible one. For screen readers it is `alertdialog` in both.
 *
 * ## Several triggers
 *
 * As in Radix: `Overlay` is the root, and inside it as many `OverlayTrigger`s
 * as needed. Focus returns to **the trigger that opened it**. When opened
 * without a trigger (`open` controlled by the caller), the caller says where
 * focus goes back to with `returnFocus`; without it, focus falls to `body` and
 * keyboard users start over from the top.
 */

export type OverlayAction = {
  label: string;
  /** Runs before closing. */
  onSelect?: () => void;
  /** Default: the first action is primary, the others secondary. */
  tone?: "primary" | "secondary" | "ghost" | "destructive";
  /** The way out with no effect. In an alert, focus starts here. */
  cancel?: boolean;
  icon?: React.ReactNode;
};

type OverlayState = {
  open: boolean;
  openFrom: (trigger: HTMLElement) => void;
  setOpen: (open: boolean) => void;
  frame: OverlayFrame;
  alert: boolean;
  returnTo: React.RefObject<HTMLElement | null>;
};

const OverlayContext = createContext<OverlayState | null>(null);

function useOverlay(part: string): OverlayState {
  const ctx = useContext(OverlayContext);
  if (!ctx) throw new Error(`<${part}> must be rendered inside <Overlay>.`);
  return ctx;
}

function pickFrame(): OverlayFrame {
  // No window on a server — and nothing opens on a server; the value only
  // exists so the first render has one.
  if (typeof window === "undefined") return "dialog";
  return window.matchMedia(OVERLAY_DIALOG_QUERY).matches ? "dialog" : "sheet";
}

export function Overlay({
  kind = "default",
  open,
  onOpenChange,
  returnFocus,
  children,
}: {
  /** `alert` is the one that cannot be dismissed: delete, cancel a subscription. */
  kind?: "default" | "alert";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Where focus returns when no `OverlayTrigger` opened it. */
  returnFocus?: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
}) {
  const [internal, setInternal] = useState(false);
  const isOpen = open ?? internal;
  const trigger = useRef<HTMLElement | null>(null);
  // The trigger that opened it wins; otherwise the caller's `returnFocus`. An
  // object with `current`, like the ref Radix and Vaul expect.
  const returnTo = useMemo<React.RefObject<HTMLElement | null>>(
    () => ({
      get current() {
        return trigger.current ?? returnFocus?.current ?? null;
      },
    }),
    [returnFocus],
  );

  // The frame is chosen when the overlay goes from closed to open — through a
  // trigger or through a controlled `open` — and stays until the next time.
  const [frame, setFrame] = useState<OverlayFrame>("dialog");
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) setFrame(pickFrame());
  }

  function setOpen(value: boolean) {
    if (open === undefined) setInternal(value);
    onOpenChange?.(value);
  }

  return (
    <OverlayContext.Provider
      value={{
        open: isOpen,
        setOpen,
        openFrom: (el) => {
          trigger.current = el;
          setOpen(true);
        },
        frame,
        alert: kind === "alert",
        returnTo,
      }}
    >
      {children}
    </OverlayContext.Provider>
  );
}

/** Opens the overlay. Always `asChild`: the trigger is the caller's own button. */
export function OverlayTrigger({ children }: { children: React.ReactElement }) {
  const { openFrom, open } = useOverlay("OverlayTrigger");
  return (
    <Slot.Root
      aria-haspopup="dialog"
      aria-expanded={open}
      data-overlay-trigger=""
      onClick={(e: React.MouseEvent<HTMLElement>) => openFrom(e.currentTarget)}
    >
      {children}
    </Slot.Root>
  );
}

export function OverlayContent({
  title,
  description,
  actions = [],
  typedElsewhere = false,
  children,
  className,
}: {
  title: string;
  description?: string;
  /** One list; the frame decides the arrangement. */
  actions?: readonly OverlayAction[];
  /**
   * In a sheet, everything typeable opens in a full-screen panel (the select
   * does this). Without this flag, Vaul would stretch the sheet behind it with
   * the keyboard and leave an empty block.
   */
  typedElsewhere?: boolean;
  children?: React.ReactNode;
  className?: string;
}) {
  const { open, setOpen, frame, alert, returnTo } = useOverlay("OverlayContent");
  const cancelRef = useRef<HTMLButtonElement>(null);
  const isSheet = frame === "sheet";

  const restoreFocus = (e: Event) => {
    if (!returnTo.current) return;
    e.preventDefault();
    returnTo.current.focus();
  };

  const buttons = actions.map((action, i) => {
    const button = (
      <Button
        key={action.label}
        ref={action.cancel ? cancelRef : undefined}
        variant={action.tone ?? (i === 0 ? "primary" : "secondary")}
        className={cn(isSheet && "w-full")}
        onClick={() => {
          action.onSelect?.();
          setOpen(false);
        }}
      >
        {action.icon}
        {action.label}
      </Button>
    );
    // In the alert dialog, Radix's Cancel is what receives focus on open.
    return alert && !isSheet && action.cancel ? (
      <RadixAlert.Cancel key={action.label} asChild>
        {button}
      </RadixAlert.Cancel>
    ) : (
      button
    );
  });

  // With a footer, the bottom padding belongs to it: the panel drops its own,
  // so the buttons end at the bottom with no gap.
  const panel = cn(className, buttons.length && !isSheet && "pb-0");

  const footer = buttons.length ? (
    <div
      data-overlay-actions=""
      className={cn(
        // Stuck to the bottom of the scrolling area: an action never
        // disappears under the body. Each frame paints its own footer — the
        // footer's parent paints nothing, and the body would show through.
        "sticky bottom-0 z-10 -mx-5 px-5",
        isSheet
          ? // The whole bottom padding (and the safe area) lives here: the
            // sheet body has none, so the footer touches the bottom.
            "mt-5 flex flex-col gap-2 bg-surface pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
          : // `mt-auto`: with spare room, the footer goes to the bottom. Less
            // padding above than below, because the last option brings its own.
            "mt-auto flex flex-wrap justify-end gap-2 bg-surface-raised pb-5 pt-2",
      )}
    >
      {buttons}
    </div>
  ) : null;

  if (isSheet) {
    return (
      <Sheet open={open} onOpenChange={setOpen} dismissible={!alert} repositionInputs={!typedElsewhere}>
        <SheetContent
          title={title}
          description={description}
          handle={!alert}
          // Only the alert changes the role. Passing `role={undefined}` would
          // erase the `dialog` role Radix sets, and the sheet would vanish for
          // screen readers.
          {...(alert ? { role: "alertdialog" } : {})}
          initialFocusRef={alert ? cancelRef : undefined}
          returnFocusRef={returnTo}
          // Without drag and outside tap, Escape still means "cancel".
          onKeyDown={alert ? (e) => e.key === "Escape" && setOpen(false) : undefined}
          className={panel}
        >
          {children}
          {footer}
        </SheetContent>
      </Sheet>
    );
  }

  if (alert) {
    return (
      <RadixAlert.Root open={open} onOpenChange={setOpen}>
        <AlertDialogContent title={title} description={description} onCloseAutoFocus={restoreFocus} className={panel}>
          {children ? <div className="mt-4">{children}</div> : null}
          {footer}
        </AlertDialogContent>
      </RadixAlert.Root>
    );
  }

  return (
    <RadixDialog.Root open={open} onOpenChange={setOpen}>
      <DialogContent title={title} description={description} onCloseAutoFocus={restoreFocus} className={panel}>
        {children}
        {footer}
      </DialogContent>
    </RadixDialog.Root>
  );
}
