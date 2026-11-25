import { useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Check, ChevronDown, Search as SearchIcon } from "lucide-react";
import { Popover } from "radix-ui";

import { cn } from "@/lib/cn";
import { normalize } from "@/lib/normalize";
import { TEXT_LIMITS } from "@/lib/text-limits";
import { messages } from "@/messages";

import { FIELD_ICONS, type FieldIcon } from "./field-icons";
import { FieldMessages, describedByOf, useFieldsetState } from "./fieldset";
import { FullScreenPanel } from "./overlay/full-screen-panel";
import { InsideSheetContext } from "./sheet-context";

const m = messages.ui.select;

/**
 * The select: a closed field and a list of our own.
 *
 * **Why not the browser's `<select>`.** It works without script and the
 * accessibility is the browser's — but **the open list is drawn by the
 * operating system** (white background, blue hover, square corners), and no
 * CSS reaches it. The list is the part of a select people look at most. So the
 * list is a Radix popover with the ARIA listbox pattern; the trade-off is that
 * it needs JavaScript.
 *
 * ## The keyboard, which is the part that cannot be improvised
 *
 * - on the closed field: arrows, Enter or Space open it;
 * - in the list: arrows move (and wrap), Home and End go to the ends, Enter or
 *   Space choose, Escape closes and returns focus to the field;
 * - **a typed letter jumps** to the first option starting with it, as in the
 *   native one — without it, a list of states is fifty arrow presses;
 * - with search, focus stays in the search box and the arrows move
 *   `aria-activedescendant`.
 *
 * **The value is submitted with the form** through a hidden input with `name`
 * — for multiple, one per value under the same `name`, as the native one does.
 *
 * ## Multiple (`multiple`)
 *
 * It still looks like a select, not a loose list. **Choosing does not close
 * the list**: each option has its own checkbox, Enter or Space toggle, and the
 * panel footer counts the selected ones and offers "Clear". The closed field
 * summarizes: the first one "and N more".
 *
 * ## Inside a sheet, the list opens in the flow
 *
 * Floating, it had no room below the field and jumped up; focusing the search
 * opened the keyboard, the sheet moved and the list repositioned, flickering.
 * **Inside a sheet the list is part of the content**: always below the field,
 * and the sheet grows with it. **On touch, typing happens in a
 * [full-screen panel](./overlay/full-screen-panel.tsx)**: inside the sheet the
 * keyboard would drag everything and leave an empty block. The keyboard only
 * opens when the person taps the search; with few options it never needs to.
 */

export type SelectOption = {
  value: string;
  label: string;
  /** A supporting line under the label, inside the option. */
  description?: string;
  disabled?: boolean;
};

type Single = {
  multiple?: false;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};

type Multiple = {
  multiple: true;
  value?: readonly string[];
  defaultValue?: readonly string[];
  onValueChange?: (value: string[]) => void;
};

type SelectProps = (Single | Multiple) & {
  label: string;
  options: readonly SelectOption[];
  /** Name in the form submission. */
  name?: string;
  /** An example, as in the field: shown while nothing is chosen. */
  placeholder?: string;
  hint?: React.ReactNode;
  error?: string;
  hiddenLabel?: boolean;
  disabled?: boolean;
  required?: boolean;
  /** The data's icon, from the field dictionary. */
  icon?: FieldIcon;
  /** A search box at the top of the list. For long lists, where scrolling to the option is the problem. */
  searchable?: boolean;
  /** What the search box says before the person types. */
  searchPlaceholder?: string;
  className?: string;
};

/**
 * Toggles a value in a multiple select. **The order is the options' order**,
 * not the clicks': the summary and the submission do not depend on who came
 * first.
 *
 * **A selected value the list no longer has is not lost.** A list can stop
 * offering a value that was already saved; rebuilding only from the options
 * would erase it on the first click, without anyone asking. It stays, at the
 * end, in the order it came.
 */
export function toggleValue(options: readonly SelectOption[], selected: readonly string[], value: string): string[] {
  const on = selected.includes(value);
  const known = new Set(options.map((o) => o.value));
  return [
    ...options.map((o) => o.value).filter((v) => (v === value ? !on : selected.includes(v))),
    ...selected.filter((v) => !known.has(v)),
  ];
}

/** "Oil change and 2 more": the closed field fits on one line. */
function summarize(labels: string[]): string {
  if (labels.length <= 1) return labels[0] ?? "";
  return m.summary(labels[0]!, labels.length - 1);
}

export function Select(props: SelectProps) {
  const {
    label,
    options,
    name,
    placeholder = m.placeholder,
    hint,
    error,
    hiddenLabel,
    disabled,
    required,
    icon,
    searchable = false,
    searchPlaceholder = m.search,
    className,
  } = props;
  const base = useId();
  const triggerId = `${base}-trigger`;
  const labelId = `${base}-label`;
  const listId = `${base}-list`;
  const hintId = `${base}-hint`;
  const errorId = `${base}-error`;
  const optionId = (i: number) => `${base}-option-${i}`;

  // One state for both modes: the list of what is selected. Single holds zero
  // or one item.
  const initial = props.multiple ? [...(props.defaultValue ?? [])] : props.defaultValue ? [props.defaultValue] : [];
  const [internal, setInternal] = useState<string[]>(initial);
  const controlled = props.value !== undefined;
  const selected: readonly string[] = props.multiple
    ? (props.value ?? internal)
    : props.value !== undefined
      ? props.value
        ? [props.value]
        : []
      : internal;
  const current = selected[0] ?? "";
  const labels = options.filter((o) => selected.includes(o.value)).map((o) => o.label);

  const inFlow = useContext(InsideSheetContext);
  const [open, setOpen] = useState(false);
  const [touch, setTouch] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const [term, setTerm] = useState("");
  const [active, setActive] = useState(-1);

  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const clear = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const tappedOutside = useRef(false);

  const visible = useMemo(() => {
    if (!searchable || !term.trim()) return options;
    const t = normalize(term.trim());
    return options.filter((o) => normalize(o.label).includes(t));
  }, [options, searchable, term]);

  const invalid = Boolean(error);
  // A disabled group's reason, as in the field.
  const { reasonId } = useFieldsetState();
  const describedBy = [describedByOf({ hintId, errorId }, hint, error), reasonId].filter(Boolean).join(" ") || undefined;
  const Icon = icon ? FIELD_ICONS[icon] : null;

  useEffect(() => {
    if (active < 0) return;
    document.getElementById(optionId(active))?.scrollIntoView({ block: "nearest" });
    // `optionId` derives from `base`, which is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // In the flow there is no popover to handle focus, Escape and outside taps.
  const openInFlow = inFlow && open;
  useEffect(() => {
    if (!openInFlow) return;
    panel.current?.scrollIntoView({ block: "nearest" });
    if (!window.matchMedia("(pointer: coarse)").matches) (search.current ?? list.current)?.focus();
    // Captured on window: it arrives before the sheet's Escape, which would close everything.
    const onEscape = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setOpenState(false);
    };
    const onOutside = (e: PointerEvent) => {
      const target = e.target as Element;
      if (panel.current?.contains(target) || trigger.current?.contains(target) || target.closest?.("[data-full-screen-panel]")) return;
      tappedOutside.current = true;
      setOpenState(false);
    };
    window.addEventListener("keydown", onEscape, true);
    document.addEventListener("pointerdown", onOutside);
    const field = trigger.current;
    return () => {
      window.removeEventListener("keydown", onEscape, true);
      document.removeEventListener("pointerdown", onOutside);
      // Closes the keyboard too; whoever tapped outside already chose where to go.
      if (!tappedOutside.current) returnFocus(field);
      tappedOutside.current = false;
    };
    // `setOpenState` and `returnFocus` only read what changes with opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openInFlow]);

  function setOpenState(next: boolean) {
    setOpen(next);
    setFullScreen(false);
    if (!next) {
      setTerm("");
      return;
    }
    setTouch(window.matchMedia("(pointer: coarse)").matches);
    // On open, the active option is the selected one (or the first enabled):
    // the list opens where the person already is, not at the top.
    const i = options.findIndex((o) => selected.includes(o.value));
    setActive(i >= 0 ? i : options.findIndex((o) => !o.disabled));
  }

  function goFullScreen() {
    // Synchronous, inside the tap: outside it, iOS does not open the keyboard.
    flushSync(() => setFullScreen(true));
    search.current?.focus();
  }

  function leaveFullScreen() {
    setFullScreen(false);
    setTerm("");
  }

  function change(next: string[]) {
    if (!controlled) setInternal(next);
    if (props.multiple) props.onValueChange?.(next);
    else props.onValueChange?.(next[0] ?? "");
  }

  function choose(option: SelectOption) {
    if (option.disabled) return;
    if (!props.multiple) {
      change([option.value]);
      setOpenState(false);
      return;
    }
    // Multiple toggles, and the list stays open.
    change(toggleValue(options, selected, option.value));
  }

  /** The next enabled option in a direction, wrapping around. */
  function step(from: number, delta: number): number {
    const n = visible.length;
    if (n === 0) return -1;
    let i = from;
    for (let k = 0; k < n; k++) {
      i = i < 0 ? (delta > 0 ? 0 : n - 1) : (i + delta + n) % n;
      if (!visible[i]!.disabled) return i;
    }
    return -1;
  }

  // Tab with the list open: close it and move focus to the field's neighbor,
  // in the Tab direction. The list lives in a portal at the end of the page,
  // so native Tab would leave it for the end of the document.
  const exitByTab = useRef<0 | 1 | -1>(0);

  function neighborOfField(delta: 1 | -1): HTMLElement | null {
    const field = trigger.current;
    if (!field) return null;
    const focusables = [
      ...document.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'),
    ].filter(
      (el) =>
        !el.hasAttribute("disabled") &&
        el.tabIndex >= 0 &&
        el.getAttribute("type") !== "hidden" &&
        el.getClientRects().length > 0 &&
        !list.current?.parentElement?.contains(el),
    );
    const i = focusables.indexOf(field);
    return i < 0 ? null : (focusables[i + delta] ?? null);
  }

  function returnFocus(field: HTMLElement | null) {
    const delta = exitByTab.current;
    exitByTab.current = 0;
    const target = delta ? neighborOfField(delta) : null;
    (target ?? field)?.focus();
  }

  // Letters typed in quick succession form a prefix, as in the native select.
  const prefix = useRef({ text: "", until: 0 });

  function onListKey(event: React.KeyboardEvent) {
    const { key } = event;
    if (key === "ArrowDown" || key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => step(i, key === "ArrowDown" ? 1 : -1));
      return;
    }
    if (key === "Home" || key === "End") {
      // In the search box, Home and End move the text caret.
      if (searchable) return;
      event.preventDefault();
      setActive(key === "Home" ? step(-1, 1) : step(-1, -1));
      return;
    }
    if (key === "Enter" || (key === " " && !searchable)) {
      event.preventDefault();
      const option = visible[active];
      if (option) choose(option);
      return;
    }
    if (key === "Tab") {
      // In multiple, Tab stops at "Clear" first — otherwise it would only exist for the mouse.
      if (props.multiple && !event.shiftKey && selected.length > 0) {
        event.preventDefault();
        clear.current?.focus();
        return;
      }
      // Tab closes without choosing, and focus moves to the field's neighbor.
      event.preventDefault();
      exitByTab.current = event.shiftKey ? -1 : 1;
      setOpenState(false);
      return;
    }
    if (!searchable && key.length === 1 && /\S/.test(key)) {
      const now = Date.now();
      const p = prefix.current;
      p.text = now < p.until ? p.text + key : key;
      p.until = now + 600;
      const target = normalize(p.text);
      const i = visible.findIndex((o) => !o.disabled && normalize(o.label).startsWith(target));
      if (i >= 0) setActive(i);
    }
  }

  const activeId = active >= 0 && visible[active] ? optionId(active) : undefined;

  const listBody = (
    <>
      {searchable && inFlow && touch && !fullScreen ? (
        <div className="border-b border-border p-2">
          <button
            type="button"
            onClick={goFullScreen}
            aria-label={m.searchIn(label)}
            style={{ minHeight: "var(--tap-target)" }}
            className="field-text flex w-full items-center gap-3 rounded-md bg-surface-sunken px-3 py-2 text-left text-subtle"
          >
            <SearchIcon size={16} aria-hidden className="shrink-0 text-secondary" />
            {searchPlaceholder}
          </button>
        </div>
      ) : searchable ? (
        <div className="relative border-b border-border p-2">
          <SearchIcon size={16} aria-hidden className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-secondary" />
          <input
            ref={search}
            type="text"
            role="combobox"
            aria-label={m.searchIn(label)}
            aria-expanded
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={activeId}
            autoComplete="off"
            maxLength={TEXT_LIMITS.search}
            value={term}
            placeholder={searchPlaceholder}
            onChange={(e) => {
              setTerm(e.currentTarget.value);
              // The filter changes the list: the active option goes back to the first.
              setActive(0);
            }}
            onKeyDown={onListKey}
            style={{ minHeight: "var(--tap-target)" }}
            className="field-text w-full rounded-md bg-surface-sunken py-2 pl-9 pr-3 text-primary placeholder:text-subtle focus-visible:outline-none"
          />
        </div>
      ) : null}

      <ul
        ref={list}
        id={listId}
        role="listbox"
        aria-labelledby={labelId}
        aria-multiselectable={props.multiple || undefined}
        aria-activedescendant={searchable ? undefined : activeId}
        tabIndex={searchable ? undefined : -1}
        onKeyDown={searchable ? undefined : onListKey}
        className="min-h-0 flex-1 overflow-y-auto p-1 focus-visible:outline-none"
      >
        {visible.map((option, i) => {
          const isSelected = selected.includes(option.value);
          return (
            <li
              key={option.value}
              id={optionId(i)}
              role="option"
              aria-selected={isSelected}
              aria-disabled={option.disabled || undefined}
              onMouseMove={() => !option.disabled && setActive(i)}
              // `preventDefault` on mouse down: the click does not take focus
              // away from the search before choosing.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(option)}
              style={{ minHeight: "var(--tap-target)" }}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
                option.disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                i === active && "bg-surface-highlight",
                // In multiple, the checkbox says what is selected; the text
                // stays neutral so the list does not become a column of accent.
                isSelected && !props.multiple ? "font-medium text-accent" : "text-primary",
              )}
            >
              {props.multiple ? (
                // The same box as the checkbox, drawn: the option is not an
                // input, and its state comes from the row's `aria-selected`.
                <span
                  aria-hidden
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-sm border-2",
                    "transition-colors duration-[var(--motion-instant)] ease-[var(--motion-ease)]",
                    isSelected ? "border-accent bg-accent text-on-accent" : "border-border-strong bg-surface",
                  )}
                >
                  {isSelected ? <Check size={14} strokeWidth={3} /> : null}
                </span>
              ) : null}
              <span className="min-w-0 flex-1">
                <span className="block truncate">{option.label}</span>
                {option.description ? (
                  <span className="block truncate text-xs font-normal text-secondary">{option.description}</span>
                ) : null}
              </span>
              {/* The check is the shape of the chosen one; color only reinforces it. */}
              {isSelected && !props.multiple ? <Check size={16} aria-hidden className="shrink-0" /> : null}
            </li>
          );
        })}
        {visible.length === 0 ? (
          // The term is the person's: a word without spaces breaks wherever it must.
          <li role="presentation" className="px-3 py-3 text-sm text-secondary [overflow-wrap:anywhere]">
            {m.nothingFound(term.trim())}
          </li>
        ) : null}
      </ul>

      {props.multiple ? (
        <div className="flex items-center justify-between gap-3 border-t border-border px-3 py-1">
          {/* A live count: screen readers know how many are selected without going back to the field. */}
          <span role="status" className="text-xs text-secondary">
            {selected.length === 0 ? m.noneSelected : m.selected(selected.length)}
          </span>
          <button
            ref={clear}
            type="button"
            disabled={selected.length === 0}
            onKeyDown={(e) => {
              if (e.key !== "Tab") return;
              e.preventDefault();
              if (e.shiftKey) {
                // Back to whoever walks the list.
                (searchable ? search.current : list.current)?.focus();
                return;
              }
              exitByTab.current = 1;
              setOpenState(false);
            }}
            // The click does not take focus from whoever has the keyboard.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              change([]);
              // The button disables on clear and would lose focus: it goes
              // back to whoever walks the list.
              (searchable ? search.current : list.current)?.focus();
            }}
            style={{ minHeight: "var(--tap-target)" }}
            className="rounded-md px-2 text-sm font-medium text-link underline underline-offset-2 hover:decoration-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
          >
            {m.clear}
          </button>
        </div>
      ) : null}
    </>
  );

  return (
    <div className={cn("w-full", className)}>
      <label id={labelId} htmlFor={triggerId} className={cn("mb-1.5 block text-sm font-medium text-primary", hiddenLabel && "sr-only")}>
        {label}
      </label>

      {name ? (props.multiple ? selected : [current]).map((v, i) => <input key={`${v}-${i}`} type="hidden" name={name} value={v} />) : null}

      <Popover.Root open={open} onOpenChange={setOpenState}>
        <Popover.Trigger asChild>
          <button
            ref={trigger}
            id={triggerId}
            type="button"
            role="combobox"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={listId}
            aria-labelledby={`${labelId} ${triggerId}`}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            aria-required={required || undefined}
            disabled={disabled}
            onKeyDown={(e) => {
              if (!open && ["ArrowDown", "ArrowUp"].includes(e.key)) {
                e.preventDefault();
                setOpenState(true);
              }
            }}
            style={{ minHeight: "var(--tap-target)" }}
            className={cn(
              // The trigger is a button and causes no zoom, but it matches the
              // height of the neighboring field.
              "field-text relative flex w-full items-center rounded-md border-2 bg-surface py-2 pr-10 text-left",
              Icon ? "pl-10" : "pl-3",
              // The same focus as the field: the border lights up.
              "field-glow",
              "disabled:cursor-not-allowed disabled:opacity-50",
              invalid ? "border-error" : cn("border-border-strong enabled:hover:border-accent", open && "border-accent"),
            )}
          >
            {Icon ? (
              <Icon size={18} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
            ) : null}
            <span className={cn("min-w-0 flex-1 truncate", labels.length ? "text-primary" : "text-subtle")}>
              {labels.length ? summarize(labels) : placeholder}
            </span>
            {/* The chevron is the select's affordance: always at the end, like
                the password eye. It turns when the list opens. */}
            <ChevronDown
              size={18}
              aria-hidden
              className={cn(
                "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-secondary",
                "transition-transform duration-[var(--motion-fast)] ease-[var(--motion-ease)]",
                open && "rotate-180",
              )}
            />
          </button>
        </Popover.Trigger>

        {inFlow ? null : (
          <Popover.Portal>
            <Popover.Content
              align="start"
              sideOffset={6}
              collisionPadding={8}
              onOpenAutoFocus={(e) => {
                // Focus goes to whoever takes the keyboard: the search, or the list.
                e.preventDefault();
                (searchable ? search.current : list.current)?.focus();
              }}
              onCloseAutoFocus={(e) => {
                e.preventDefault();
                returnFocus(trigger.current);
              }}
              className={cn(
                "z-50 flex w-[var(--radix-popover-trigger-width)] flex-col overflow-hidden",
                "max-h-[min(20rem,var(--radix-popover-content-available-height))]",
                "rounded-md border border-border bg-surface-raised floating-edge",
                "animate-[ui-fade-in_var(--motion-fast)_var(--motion-ease-out)]",
              )}
            >
              {listBody}
            </Popover.Content>
          </Popover.Portal>
        )}
      </Popover.Root>

      {openInFlow && fullScreen ? (
        <FullScreenPanel title={label} onClose={leaveFullScreen} onClosed={() => trigger.current?.focus()}>
          {listBody}
        </FullScreenPanel>
      ) : null}

      {openInFlow && !fullScreen ? (
        <div
          ref={panel}
          data-vaul-no-drag
          className="mt-1.5 flex max-h-[min(20rem,45dvh)] scroll-mb-5 flex-col overflow-hidden rounded-md border border-border bg-surface-raised floating-edge animate-[ui-fade-in_var(--motion-fast)_var(--motion-ease-out)]"
        >
          {listBody}
        </div>
      ) : null}

      <FieldMessages hintId={hintId} errorId={errorId} hint={hint} error={error} />
    </div>
  );
}
