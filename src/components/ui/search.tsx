import { useEffect, useId, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Search as SearchIcon } from "lucide-react";
import { Slot } from "radix-ui";

import { cn } from "@/lib/cn";
import { normalize } from "@/lib/normalize";
import { OVERLAY_BREAKPOINT } from "@/lib/overlay";
import { TEXT_LIMITS } from "@/lib/text-limits";
import { messages } from "@/messages";

import { FullScreenPanel } from "./overlay/full-screen-panel";

const m = messages.ui.search;

/** Touch phones only: tablets and desktops type in place. */
const TOUCH_PHONE_QUERY = `(pointer: coarse) and (max-width: ${OVERLAY_BREAKPOINT - 1}px)`;

/** How many suggestions show at once. More is a list to read, not a shortcut. */
const MAX_SUGGESTIONS = 6;

/**
 * The search field: **one field**, never a picker of what to search in. The
 * person types what they need, and the suggestions come from a list of known
 * terms the caller provides.
 *
 * ## It is a real `<form>`, and that is the point
 *
 * **Without script, it still searches.** `action` and `method="get"` let the
 * browser build the address and navigate on its own; the suggestions are an
 * enhancement, never a requirement. A search that needs JavaScript breaks for
 * the people on the worst connections.
 *
 * ## The ARIA combobox pattern, which cannot be improvised
 *
 * The field is a `combobox` with `aria-expanded`, `aria-controls` and
 * `aria-activedescendant`; the list is a `listbox` of `option`s. **Focus never
 * leaves the field** — the arrows move `aria-activedescendant`, not focus.
 * Moving focus into the list is the usual mistake: typing stops working in the
 * middle of the navigation.
 *
 * **Browsing the list does nothing.** Choosing a suggestion fills the field
 * and submits; walking through the list with the arrows only highlights.
 *
 * **Escape closes the list first.** With the list open it only closes it; the
 * native Escape of `type="search"` would clear the field too, and whoever only
 * wanted the suggestions gone would lose what they typed. With the list
 * closed, Escape is native again.
 *
 * ## Full screen on touch phones (`fullScreenOnTouch`, `trigger`)
 *
 * On a phone, typing happens in the
 * [full-screen panel](./overlay/full-screen-panel.tsx), with the suggestions
 * above the keyboard. **Without script nothing changes**: the form is still
 * there and still searches; only after hydration does the field become the
 * trigger. With `trigger`, the field is replaced by that button — a magnifier
 * in a header — and a tap opens the full screen directly, keyboard included.
 */
export type SearchProps = {
  /** Where the form submits. Absent, it submits to the current address. */
  action?: string;
  /** The query parameter's name. */
  name?: string;
  defaultValue?: string;
  /** The terms the suggestions come from. Matched without accents or case. */
  suggestions: readonly string[];
  label?: string;
  placeholder?: string;
  /**
   * Takes the submission instead of the browser. **Absent in production**,
   * where the form navigates by itself; for demos and client-only apps.
   */
  onSubmit?: (term: string) => void;
  /**
   * The list **pushes** what comes below instead of floating over it — for a
   * dedicated search page. In a header the list floats: pushing the page on
   * every key would be a layout jump.
   */
  inline?: boolean;
  /**
   * The label in view, styled like the field's — for when the search shares a
   * row with labeled fields and must align with them. Otherwise it is read,
   * not shown.
   */
  showLabel?: boolean;
  /** `lg`: the page's main action, a step larger (52px). */
  size?: "md" | "lg";
  /** On touch phones, typing happens in the full-screen panel. */
  fullScreenOnTouch?: boolean;
  /**
   * In place of the field, this button; a tap opens the full screen. The
   * button needs its own accessible name.
   */
  trigger?: React.ReactElement;
  /** A line under the full-screen field: where the search looks ("In Workspace A."). */
  context?: string;
  className?: string;
};

export function Search({
  action,
  name = "q",
  defaultValue = "",
  suggestions,
  label = m.label,
  placeholder = m.placeholder,
  onSubmit,
  inline = false,
  showLabel = false,
  size = "md",
  fullScreenOnTouch = false,
  trigger,
  context,
  className,
}: SearchProps) {
  const base = useId();
  const inputId = `${base}-input`;
  const listId = `${base}-list`;

  // The ref that matters is the FORM's: `choose()` submits through it when no
  // handler takes the term — the production path.
  const form = useRef<HTMLFormElement>(null);
  const [term, setTerm] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const field = useRef<HTMLInputElement>(null);
  const panelField = useRef<HTMLInputElement>(null);
  const panelForm = useRef<HTMLFormElement>(null);
  const externalTrigger = useRef<HTMLElement>(null);
  const [asTrigger, setAsTrigger] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);

  useEffect(() => {
    if (!fullScreenOnTouch) return;
    const query = window.matchMedia(TOUCH_PHONE_QUERY);
    // Whoever already started typing in place stays in place.
    const update = () => {
      if (document.activeElement !== field.current) setAsTrigger(query.matches);
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [fullScreenOnTouch]);

  // Coming back to the page through the browser's history restores it as it
  // was left — with the panel open. It closes instead.
  useEffect(() => {
    if (!fullScreen) return;
    const restored = (e: PageTransitionEvent) => {
      if (e.persisted) setFullScreen(false);
    };
    window.addEventListener("pageshow", restored);
    return () => window.removeEventListener("pageshow", restored);
  }, [fullScreen]);

  function openFullScreen() {
    // Synchronous, inside the tap: outside it, iOS does not open the keyboard.
    flushSync(() => setFullScreen(true));
    const input = panelField.current;
    input?.focus();
    input?.setSelectionRange(input.value.length, input.value.length);
  }

  // Without accents or case, like the select and the checkbox list: on a
  // phone almost nobody types accents.
  const wanted = normalize(term.trim());
  const matches = wanted ? suggestions.filter((s) => normalize(s).includes(wanted)).slice(0, MAX_SUGGESTIONS) : [];
  const expanded = open && matches.length > 0;

  function choose(value: string) {
    setTerm(value);
    setOpen(false);
    setActive(-1);

    if (onSubmit) {
      setFullScreen(false);
      onSubmit(value);
      return;
    }

    // **Without a handler, choosing must SEARCH.** Otherwise the suggestion
    // only fills the field: the list closes, nothing happens, and the person
    // presses Enter again without knowing why. `requestSubmit` runs the native
    // submission — the same path that works without script. It waits a frame
    // because the field's value reaches the DOM only after React applies the
    // state; submitting earlier would send the old term.
    const target = fullScreen ? panelForm : form;
    requestAnimationFrame(() => target.current?.requestSubmit());
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (asTrigger && !fullScreen && event.key === "Enter") {
      event.preventDefault();
      openFullScreen();
      return;
    }
    if (!expanded) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const down = event.key === "ArrowDown";
      setActive((i) => {
        // `-1` is "nothing highlighted", not a position: it leaves the sum
        // before the modulo, or going up from nothing would land on the
        // second-to-last and the last would be unreachable that way.
        if (i < 0) return down ? 0 : matches.length - 1;
        // Wraps around: an arrow that stops at the end leaves the person
        // wondering whether the list ended or the keyboard stopped.
        return (i + (down ? 1 : -1) + matches.length) % matches.length;
      });
      return;
    }

    if (event.key === "Enter" && active >= 0) {
      event.preventDefault();
      choose(matches[active]!);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      setActive(-1);
    }
  }

  return (
    <>
      {trigger ? (
        // `aria-expanded`: a listener knows the search is open, as with every
        // overlay trigger.
        <Slot.Root ref={externalTrigger} onClick={openFullScreen} aria-expanded={fullScreen}>
          {trigger}
        </Slot.Root>
      ) : (
        <form
          ref={form}
          action={action}
          method="get"
          role="search"
          className={cn("relative w-full", className)}
          onSubmit={(e) => {
            if (!onSubmit) return;
            e.preventDefault();
            onSubmit(term);
            setOpen(false);
          }}
        >
          <label htmlFor={inputId} className={showLabel ? "mb-1.5 block text-sm font-medium text-primary" : "sr-only"}>
            {label}
          </label>

          <div className="relative">
            <SearchIcon
              size={size === "lg" ? 20 : 18}
              aria-hidden
              className={cn(
                "pointer-events-none absolute top-1/2 -translate-y-1/2 text-secondary",
                size === "lg" ? "left-4" : "left-3",
              )}
            />
            <input
              ref={field}
              id={inputId}
              name={name}
              readOnly={asTrigger}
              onClick={asTrigger ? openFullScreen : undefined}
              type="search"
              maxLength={TEXT_LIMITS.search}
              value={term}
              placeholder={placeholder}
              autoComplete="off"
              role="combobox"
              aria-expanded={expanded}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
              onChange={(e) => {
                setTerm(e.currentTarget.value);
                setOpen(true);
                setActive(-1);
              }}
              onKeyDown={onKeyDown}
              onBlur={() => setOpen(false)}
              // `field-glow`: focus lights the border itself, as in the field.
              className={cn(
                "field-glow field-text w-full rounded-md border-2 border-border-strong bg-surface py-2 pr-3 text-primary placeholder:text-subtle hover:border-accent",
                size === "lg" ? "h-13 pl-12 text-base" : "pl-10",
              )}
              style={{ minHeight: "var(--tap-target)" }}
            />
          </div>

          <ul
            id={listId}
            role="listbox"
            aria-label={m.suggestions}
            hidden={!expanded}
            className={cn(
              "mt-1 overflow-hidden rounded-md border border-border bg-surface-raised",
              inline ? "relative" : "absolute inset-x-0 top-full z-20 floating-edge",
            )}
          >
            {matches.map((match, i) => (
              <li
                key={match}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                // `onMouseDown`, not `onClick`: the field's blur fires before
                // the click and would close the list, swallowing the choice.
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(match);
                }}
                style={{ minHeight: "var(--tap-target)" }}
                className={cn(
                  "flex cursor-pointer items-center px-3 py-2 text-sm",
                  i === active ? "bg-surface-highlight text-accent" : "text-primary",
                )}
              >
                {match}
              </li>
            ))}
          </ul>
        </form>
      )}

      {fullScreen ? (
        <FullScreenPanel
          title={label}
          onClose={() => setFullScreen(false)}
          onClosed={() => (trigger ? externalTrigger.current : field.current)?.focus()}
        >
          <form
            ref={panelForm}
            action={action}
            method="get"
            role="search"
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={(e) => {
              if (!onSubmit) return;
              e.preventDefault();
              setFullScreen(false);
              onSubmit(term);
            }}
          >
            <div className="relative border-b border-border p-2">
              <SearchIcon size={18} aria-hidden className="pointer-events-none absolute top-1/2 left-5 -translate-y-1/2 text-secondary" />
              <input
                ref={panelField}
                name={name}
                type="search"
                enterKeyHint="search"
                aria-label={label}
                maxLength={TEXT_LIMITS.search}
                value={term}
                placeholder={placeholder}
                autoComplete="off"
                onChange={(e) => setTerm(e.currentTarget.value)}
                style={{ minHeight: "var(--tap-target)" }}
                className="field-text w-full rounded-md bg-surface-sunken py-2 pr-3 pl-9 text-primary placeholder:text-subtle focus-visible:outline-none"
              />
            </div>
            {context ? <p className="border-b border-border px-4 py-2 text-xs text-secondary">{context}</p> : null}
            <ul aria-label={m.suggestions} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1">
              {matches.map((match) => (
                <li key={match}>
                  <button
                    type="button"
                    // Focus stays in the field: the keyboard does not drop
                    // before the choice.
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => choose(match)}
                    style={{ minHeight: "var(--tap-target)" }}
                    className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-primary"
                  >
                    {match}
                  </button>
                </li>
              ))}
              {term.trim() ? (
                <li>
                  <button
                    type="submit"
                    onMouseDown={(e) => e.preventDefault()}
                    style={{ minHeight: "var(--tap-target)" }}
                    // The term is the person's: a word without spaces breaks
                    // wherever it must.
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium text-accent [overflow-wrap:anywhere]"
                  >
                    <SearchIcon size={16} aria-hidden className="shrink-0" />
                    {m.searchFor(term.trim())}
                  </button>
                </li>
              ) : null}
            </ul>
          </form>
        </FullScreenPanel>
      ) : null}
    </>
  );
}
