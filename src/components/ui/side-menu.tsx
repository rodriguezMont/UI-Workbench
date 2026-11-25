import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FocusScope } from "@radix-ui/react-focus-scope";
import { hideOthers } from "aria-hidden";
import { X } from "lucide-react";

import { cn } from "@/lib/cn";
import { OVERLAY_DIALOG_QUERY } from "@/lib/overlay";
import { messages } from "@/messages";

/**
 * The mobile side menu — the drawer that slides in from the left under the
 * hamburger. One piece for every shell that needs one.
 *
 * What it owes while open:
 *
 * 1. **Escape closes it.**
 * 2. **Focus moves in, stays trapped, and returns to whoever opened it** —
 *    through `FocusScope`, the same piece the sheet uses.
 * 3. **The rest of the page disappears for screen readers** — `hideOthers`,
 *    also like the sheet. `aria-modal` alone is not enough in every reader.
 * 4. **The page stops scrolling.** Otherwise dragging over the backdrop
 *    scrolls the page behind it, and on close the person is somewhere they
 *    did not choose.
 * 5. **Widening the window closes it.** From 768px the shell hides the
 *    hamburger; open-but-invisible, the drawer would leave the page hidden
 *    from screen readers and focus trapped in a panel nobody sees.
 *
 * **It enters and leaves with motion.** To animate out it stays mounted
 * during the exit — `mounted` turns false only afterwards — while `open` keeps
 * telling the truth: everything that depends on "open" (Escape, focus,
 * scrolling) switches off at once.
 */
export function SideMenu({
  open,
  onOpenChange,
  label,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The dialog's name for screen readers: "Sections", "Menu". */
  label: string;
  /** What sits at the top next to the close button — a logo, a short title. */
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  if (open && !mounted) setMounted(true);

  useEffect(() => {
    if (open || !mounted) return;
    // A little longer than `--motion-fast` (160ms), the exit duration.
    const done = setTimeout(() => setMounted(false), 200);
    return () => clearTimeout(done);
  }, [open, mounted]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);

    // The same breakpoint where the shell swaps the hamburger for a side panel.
    const wide = window.matchMedia(OVERLAY_DIALOG_QUERY);
    const onWidth = (e: MediaQueryListEvent) => {
      if (e.matches) onOpenChange(false);
    };
    wide.addEventListener("change", onWidth);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const showTheRest = panel.current ? hideOthers(panel.current) : undefined;

    return () => {
      document.removeEventListener("keydown", onKey);
      wide.removeEventListener("change", onWidth);
      document.body.style.overflow = previousOverflow;
      showTheRest?.();
    };
  }, [open, onOpenChange]);

  if (!mounted || typeof document === "undefined") return null;

  // At the end of `<body>`, like every dialog: inside an element with a
  // `transform` or `translate`, `position: fixed` would be relative to that
  // element and the drawer would open inside it, not over the screen.
  return createPortal(
    <div className="fixed inset-0 z-40 md:hidden" data-state={open ? "open" : "closed"}>
      <button
        type="button"
        aria-label={messages.ui.sideMenu.closeOutside}
        tabIndex={-1}
        onClick={() => onOpenChange(false)}
        className={cn(
          "absolute inset-0 scrim",
          open
            ? "animate-[ui-fade-in_var(--motion-base)_var(--motion-ease-out)]"
            : "pointer-events-none animate-[ui-fade-out_var(--motion-fast)_var(--motion-ease-in)_forwards]",
        )}
      />
      {/* `trapped` moves focus inside on mount (the first control is the close
          button) and traps Tab; `loop` wraps around; on unmount focus returns
          to whoever opened it. */}
      <FocusScope asChild trapped loop>
        <div
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-label={label}
          className={cn(
            "absolute inset-y-0 left-0 flex w-72 flex-col border-r border-border bg-surface-chrome",
            open
              ? "animate-[ui-drawer-in_var(--motion-base)_var(--motion-ease-out)]"
              : "animate-[ui-drawer-out_var(--motion-fast)_var(--motion-ease-in)_forwards]",
          )}
        >
          <div className="flex h-16 items-center gap-2 border-b border-border px-4">
            {title}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label={messages.ui.sideMenu.close}
              className="ml-auto -mr-2 flex shrink-0 items-center justify-center rounded-md text-secondary hover:bg-surface-hover"
              style={{ width: "var(--tap-target)", height: "var(--tap-target)" }}
            >
              <X size={20} aria-hidden />
            </button>
          </div>
          {children}
        </div>
      </FocusScope>
    </div>,
    document.body,
  );
}
