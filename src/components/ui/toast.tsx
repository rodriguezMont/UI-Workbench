import { useSyncExternalStore } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { Toast as RadixToast } from "radix-ui";

import { cn } from "@/lib/cn";
import { OVERLAY_DIALOG_QUERY } from "@/lib/overlay";
import { messages } from "@/messages";

/**
 * The toast — the outcome of an action, not information the screen must keep.
 *
 * Radix provides the expensive part (live region, pause on hover, swipe to
 * dismiss, correct focus order). What is written on top is only the
 * **imperative queue**, so an action anywhere can notify without passing state
 * from hand to hand.
 *
 * **A toast is never the only place for the information.** It disappears on
 * its own, does not print, and goes unnoticed by someone looking at another
 * part of the screen. If what it says still matters five seconds later, it
 * belongs on the page.
 *
 * ## On phones, a banner under the header
 *
 * Below 768px the toast is **a full-width banner right under the header, in
 * the color of its kind and on a single line** — over the content, without
 * pushing anything. It slides out from behind the header like a drawer, with
 * rounded bottom corners and a blur only behind itself. **One at a time**: the
 * rest wait in the queue, and their timers only start when they appear. Swipe
 * up to dismiss. Stacked at the bottom, three toasts covered the area where the
 * thumb works.
 *
 * From 768px up it is the usual card, bottom right, stacked. The description
 * only shows on the card; on the banner it is still there for screen readers,
 * so what is announced is the same in both.
 *
 * The banner sits under the header through the `--header-h` CSS variable,
 * which the app shell sets to its header height (4rem if nobody sets it).
 */

export type ToastKind = "info" | "success" | "error" | "warning";

export type ToastItem = {
  id: number;
  kind: ToastKind;
  title: string;
  description?: string;
  /** Milliseconds. `Infinity` keeps it until the person closes it. */
  duration: number;
  /** Internal: `false` during the exit animation, before leaving the queue. */
  open: boolean;
};

export type ToastOptions = Partial<Pick<ToastItem, "description" | "duration">>;

// ── The queue ────────────────────────────────────────────────────────────────
// An external store read through `useSyncExternalStore`. Without it every
// screen would carry toast state, and the same action in two places would end
// up with two different ways of notifying.

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// A stable reference while nothing changes: `useSyncExternalStore` compares by
// identity, and a new array on every read would loop forever.
function snapshot() {
  return items;
}

function push(kind: ToastKind, title: string, options?: ToastOptions) {
  // **Never on the server.** `items` is module state, and on a server one
  // module is shared by every request: a toast pushed while rendering would
  // show up for the next person to load the page. In development this throws,
  // because calling `toast()` on the server is always a bug; in production it
  // is silent, so a toast never takes a whole page down.
  if (typeof window === "undefined") {
    if (import.meta.env.DEV) {
      throw new Error("toast() only works in the browser: module state leaks across requests on a server.");
    }
    return -1;
  }

  const item: ToastItem = {
    id: nextId++,
    kind,
    title,
    description: options?.description,
    duration: options?.duration ?? (kind === "error" ? 8000 : 5000),
    open: true,
  };
  items = [...items, item];
  emit();
  return item.id;
}

/** Starts the exit: marks it closed, animates, and only then removes it. */
export function dismissToast(id: number) {
  items = items.map((i) => (i.id === id ? { ...i, open: false } : i));
  emit();
  // A little longer than `--motion-base` (240ms), so the exit animation ends
  // before the element is removed. Without the wait the toast vanished from
  // one frame to the next and `data-[state=closed]` never applied.
  setTimeout(() => {
    items = items.filter((i) => i.id !== id);
    emit();
  }, 260);
}

/**
 * `toast("Saved")` · `toast.error("Couldn't charge the card")`.
 *
 * Errors last longer (8s against 5s): whoever hit an error needs to read it
 * twice, whoever succeeded does not need to read it at all.
 */
export const toast = Object.assign((title: string, options?: ToastOptions) => push("info", title, options), {
  info: (title: string, options?: ToastOptions) => push("info", title, options),
  success: (title: string, options?: ToastOptions) => push("success", title, options),
  error: (title: string, options?: ToastOptions) => push("error", title, options),
  warning: (title: string, options?: ToastOptions) => push("warning", title, options),
});

// ── The view ─────────────────────────────────────────────────────────────────

const ICON = {
  info: Info,
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
} as const;

// On the card, the color lives on the border and the glyph, never alone: the
// title stays in the primary text color because it has to be read, and every
// kind has an icon.
const TONE = {
  info: "border-l-[var(--accent)] text-accent",
  success: "border-l-[var(--state-success)] text-success",
  error: "border-l-[var(--state-error)] text-error",
  warning: "border-l-[var(--state-warning)] text-warning",
} as const;

// On the banner, the color is the background and the text is the ink that
// fill asks for. **94% opacity, not less:** whatever shows through lightens
// the color, and over white the warning fill would drop below 4.5:1 for its
// text at lower opacity. The glass effect comes from the blur, not from
// transparency.
const BANNER = {
  info: "bg-[color-mix(in_srgb,var(--accent)_94%,transparent)] text-on-accent",
  success: "bg-[color-mix(in_srgb,var(--state-success-fill)_94%,transparent)] text-on-success",
  error: "bg-[color-mix(in_srgb,var(--state-error-fill)_94%,transparent)] text-on-error",
  warning: "bg-[color-mix(in_srgb,var(--state-warning-fill)_94%,transparent)] text-on-warning",
} as const;

// The width, read in the browser, decides banner or card. On a server there
// is no toast at all (`push` refuses), so the server value does not matter.
function subscribeWidth(notify: () => void) {
  const mq = window.matchMedia(OVERLAY_DIALOG_QUERY);
  mq.addEventListener("change", notify);
  return () => mq.removeEventListener("change", notify);
}
const isWideNow = () => window.matchMedia(OVERLAY_DIALOG_QUERY).matches;
const isWideOnServer = () => true;

/**
 * Mount it once, at the app shell. Two instances would create two live
 * regions, and a screen reader would announce every toast twice.
 */
export function Toaster() {
  const list = useSyncExternalStore(subscribe, snapshot, snapshot);
  const wide = useSyncExternalStore(subscribeWidth, isWideNow, isWideOnServer);
  // On the banner, one at a time: only the first in the queue mounts — and
  // Radix only runs the timer of mounted toasts, so the others do not expire
  // while they wait.
  const visible = wide ? list : list.slice(0, 1);

  return (
    <RadixToast.Provider swipeDirection={wide ? "right" : "up"}>
      {visible.map((item) => {
        const Icon = ICON[item.kind];
        return (
          <RadixToast.Root
            key={item.id}
            // `Infinity` does not work with `setTimeout`: above 2^31-1 the
            // browser fires immediately, and `undefined` would fall back to
            // Radix's 5s default. The 32-bit ceiling is ~24 days — forever here.
            duration={item.duration === Infinity ? 2 ** 31 - 1 : item.duration}
            open={item.open}
            onOpenChange={(open) => {
              if (!open) dismissToast(item.id);
            }}
            data-banner={wide ? undefined : ""}
            className={cn(
              wide
                ? [
                    "flex items-start gap-3 rounded-md border border-l-4 border-border bg-surface p-3.5 shadow-lg",
                    "data-[state=open]:animate-[ui-toast-in_var(--motion-base)_var(--motion-ease-out)]",
                    "data-[state=closed]:animate-[ui-toast-out_var(--motion-fast)_var(--motion-ease-in)]",
                    "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]",
                    "data-[swipe=cancel]:translate-x-0",
                    TONE[item.kind],
                  ]
                : [
                    // A drawer: rounded bottom corners, blur only behind it.
                    "flex min-h-11 items-center gap-2.5 rounded-b-md pl-4 pr-1 shadow-md backdrop-blur-md",
                    "data-[state=open]:animate-[ui-banner-in_var(--motion-base)_var(--motion-ease-out)]",
                    "data-[state=closed]:animate-[ui-banner-out_var(--motion-fast)_var(--motion-ease-in)]",
                    "data-[swipe=move]:translate-y-[var(--radix-toast-swipe-move-y)]",
                    "data-[swipe=cancel]:translate-y-0",
                    BANNER[item.kind],
                  ],
            )}
          >
            <Icon size={18} aria-hidden className={cn("shrink-0", wide && "mt-0.5")} />
            <div className="min-w-0 flex-1">
              <RadixToast.Title className={cn("text-sm font-medium", wide ? "text-primary" : "truncate")}>
                {item.title}
              </RadixToast.Title>
              {item.description ? (
                <RadixToast.Description className={cn("mt-0.5 text-sm text-secondary", !wide && "sr-only")}>
                  {item.description}
                </RadixToast.Description>
              ) : null}
            </div>
            <RadixToast.Close
              aria-label={messages.ui.toast.dismiss}
              className={cn(
                "flex shrink-0 items-center justify-center rounded transition-colors duration-[var(--motion-instant)]",
                wide ? "-mr-1 -mt-1 text-secondary hover:text-primary" : "hover:opacity-80",
              )}
              // On the banner the close button gets the full 44px: it is the phone.
              style={wide ? { minHeight: 32, minWidth: 32 } : { minHeight: 44, minWidth: 44 }}
            >
              <X size={16} aria-hidden />
            </RadixToast.Close>
          </RadixToast.Root>
        );
      })}

      <RadixToast.Viewport
        // `dvh`, not `vh`: on phones the browser bar comes and goes, and `vh`
        // would leave the toast behind it. No `outline-none`: F8 moves focus to
        // this region, and the ring is the only sign of where it went.
        className={cn(
          "fixed flex flex-col focus-visible:outline-offset-[-2px]",
          wide
            ? "bottom-0 right-0 z-[60] max-h-dvh w-[calc(100vw-2rem)] max-w-sm gap-2 p-4"
            : // Over the content and **under the header** (z-20 against the
              // header's z-30): sliding down, the banner comes out from behind it.
              "inset-x-0 top-[var(--header-h,4rem)] z-20",
        )}
      />
    </RadixToast.Provider>
  );
}
