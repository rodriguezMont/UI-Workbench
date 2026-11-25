import { useEffect, useRef } from "react";
import { FocusScope } from "@radix-ui/react-focus-scope";
import { hideOthers } from "aria-hidden";
import { Drawer } from "vaul";

import { cn } from "@/lib/cn";

import { InsideSheetContext } from "./sheet-context";

/**
 * The sheet that rises from the bottom and closes with a drag — what makes a
 * web page feel like an app on a phone, without becoming a framework.
 *
 * **Why Vaul, not a hand-written drag.** The gesture looks simple and is not:
 * velocity to decide between closing and snapping back, elasticity at the
 * limit, and the conflict with inner scrolling — drag the sheet or scroll its
 * content, which the browser only learns after a few pixels.
 *
 * ## What Vaul does NOT provide, measured
 *
 * It does not inherit Radix Dialog's focus trap, `aria-modal`, or hiding the
 * rest of the page. Measured in a browser with React 19:
 *
 * - focus **stays on the trigger** when the sheet opens;
 * - `Tab` walks through the buttons **behind** the sheet, still clickable;
 * - there is no `aria-modal`, so a screen reader does not announce a modal.
 *
 * Passing `modal` explicitly changes nothing. **The fix uses the pieces Radix
 * Dialog uses internally:** `FocusScope` traps and returns focus, and
 * `hideOthers` hides the rest of the accessibility tree. Both are declared
 * dependencies, not borrowed transitive ones.
 *
 * **This patches a third-party library**, so check it on every Vaul upgrade:
 * if Vaul starts trapping focus itself, this code becomes silent duplication.
 *
 * ## On desktop, a sheet and not a strip
 *
 * From `md` (768px) the sheet is 512px wide and centered, still rising from
 * the bottom — the same piece and the same gesture at every width. Centered
 * with `left/right: 0` and auto margins, not with `translate`: Vaul animates
 * the sheet through `transform`, and the two would fight.
 *
 * **The bottom padding respects the device safe area** — in an installed app,
 * the home indicator sits over the buttons. Without `viewport-fit=cover` the
 * inset is zero and the 20px floor applies; with it, the padding grows.
 */

export const Sheet = Drawer.Root;
export const SheetTrigger = Drawer.Trigger;
export const SheetClose = Drawer.Close;

export function SheetContent({
  className,
  children,
  title,
  description,
  handle = true,
  initialFocusRef,
  returnFocusRef,
  ...props
}: React.ComponentProps<typeof Drawer.Content> & {
  /** Required: it is the sheet's accessible name. */
  title: string;
  description?: string;
  /**
   * The handle announces that the sheet can be dragged. `false` on a sheet
   * that cannot be dismissed — an alert — where it would promise a gesture
   * that does not exist.
   */
  handle?: boolean;
  /** What receives focus on open. Without it, the sheet itself. */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  /**
   * What receives focus on close. Without it, whatever had focus on open —
   * which on iPhone Safari is `body`, because tapping a button does not focus it.
   */
  returnFocusRef?: React.RefObject<HTMLElement | null>;
}) {
  const content = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  // Hide the rest of the page from the accessibility tree while the sheet is
  // open — otherwise a screen reader keeps reading the page underneath.
  useEffect(() => {
    if (!content.current) return;
    return hideOthers(content.current);
  }, []);

  return (
    <Drawer.Portal>
      <Drawer.Overlay className="fixed inset-0 z-50 scrim" />
      <Drawer.Content
        ref={content}
        aria-modal="true"
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 mt-24 flex max-h-[85dvh] flex-col md:mx-auto md:max-w-lg",
          "rounded-t-lg border border-border bg-surface outline-none",
          className,
        )}
        {...props}
      >
        {/* `trapped` moves focus inside on mount and traps Tab; `loop` wraps
            from the last control to the first; on unmount focus returns to
            whoever opened it. */}
        <FocusScope
          asChild
          trapped
          loop
          onMountAutoFocus={(e) => {
            e.preventDefault();
            // **No sheet focuses a field on open.** The first control could be
            // a search box, and on a phone the keyboard would pop up and squeeze
            // the sheet. Without a requested target, focus goes to the sheet
            // itself; Tab takes it from there to the first control. The body is
            // a group named by the title, and the name is set BEFORE focus, so
            // a screen reader announces the title, not an unnamed block.
            const id = titleRef.current?.id;
            if (id) body.current?.setAttribute("aria-labelledby", id);
            (initialFocusRef?.current ?? body.current)?.focus({ preventScroll: true });
          }}
          onUnmountAutoFocus={(e) => {
            if (!returnFocusRef?.current) return;
            e.preventDefault();
            returnFocusRef.current.focus();
          }}
        >
          {/* `tabIndex -1`: receives focus on open without joining the Tab order. */}
          <div ref={body} role="group" tabIndex={-1} className="flex min-h-0 flex-col outline-none">
            {/* The handle is not decoration: it announces the drag. Hidden from
                assistive technology, because keyboard users do not drag — for
                them the way out is `Escape`. */}
            {handle ? <div aria-hidden className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-border-strong" /> : null}
            {/* **With an actions footer, the whole bottom padding is the
                footer's.** A sticky footer sticks to the INNER edge of the
                scroller's padding: with 20px here, it would stop 20px above the
                bottom and the content would show through underneath it. */}
            <div className="min-h-0 overflow-y-auto px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] has-[[data-overlay-actions]]:pb-0">
              <Drawer.Title ref={titleRef} className="text-base font-bold">
                {title}
              </Drawer.Title>
              {description ? (
                <Drawer.Description className="mt-1 text-sm text-secondary">{description}</Drawer.Description>
              ) : null}
              <div className="mt-4">
                <InsideSheetContext.Provider value={true}>{children}</InsideSheetContext.Provider>
              </div>
            </div>
          </div>
        </FocusScope>
      </Drawer.Content>
    </Drawer.Portal>
  );
}
