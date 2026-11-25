import { ArrowLeft } from "lucide-react";
import { Dialog as RadixDialog } from "radix-ui";

import { messages } from "@/messages";

/**
 * **The phone's full screen**: where people type to pick from a list.
 *
 * iPhone Safari puts the keyboard over the page, with no way to turn that off,
 * and scrolls the page up to reveal the field. With the field already at the
 * top of the screen there is nothing to scroll, and the content runs down to
 * the keyboard (`visualViewport`). The header reads dark, to blend with the
 * status bar.
 *
 * Whoever opens it takes care of focus: outside a touch event, iOS does not
 * open the keyboard.
 */
export function FullScreenPanel({
  title,
  onClose,
  onClosed,
  children,
}: {
  title: string;
  onClose: () => void;
  /** After it has gone: the screen no longer traps focus here. */
  onClosed?: () => void;
  children: React.ReactNode;
}) {
  return (
    <RadixDialog.Root open onOpenChange={onClose}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-[60] bg-surface" />
        <RadixDialog.Content
          ref={followVisibleViewport}
          data-full-screen-panel
          // Portal events bubble through the React tree: without this, a
          // surrounding sheet would start dragging.
          data-vaul-no-drag
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            onClosed?.();
          }}
          className="fixed inset-x-0 top-0 z-[60] flex flex-col overflow-hidden bg-surface"
        >
          <div data-theme="dark" className="flex h-16 shrink-0 items-center gap-1 bg-surface-chrome px-2 text-primary">
            <RadixDialog.Close
              aria-label={messages.ui.fullScreenPanel.back}
              style={{ minWidth: "var(--tap-target)", minHeight: "var(--tap-target)" }}
              className="flex items-center justify-center rounded-md"
            >
              <ArrowLeft size={22} aria-hidden />
            </RadixDialog.Close>
            <RadixDialog.Title className="text-base font-bold">{title}</RadixDialog.Title>
          </div>
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

/** The panel follows the part of the window the keyboard leaves free. */
function followVisibleViewport(panel: HTMLElement | null) {
  const viewport = window.visualViewport;
  if (!panel || !viewport) return;
  const fit = () => {
    panel.style.height = `${viewport.height}px`;
    panel.style.top = `${viewport.offsetTop}px`;
  };
  fit();
  viewport.addEventListener("resize", fit);
  viewport.addEventListener("scroll", fit);
  return () => {
    viewport.removeEventListener("resize", fit);
    viewport.removeEventListener("scroll", fit);
  };
}
