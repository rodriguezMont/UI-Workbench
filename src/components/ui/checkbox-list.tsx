import { useId, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/cn";
import { formatInteger } from "@/lib/format";
import { normalize } from "@/lib/normalize";
import { messages } from "@/messages";

import { Button } from "./button";
import { Checkbox } from "./checkbox";
import { Field } from "./field";
import { Fieldset } from "./fieldset";
import { toggleValue } from "./select";

const m = messages.ui.checkboxList;

/**
 * The checkbox list: many boxes in view, with search, "Show all", counts and a
 * limit — each one on only when the list needs it.
 *
 * **A list in view, or a multiple select?** The closed
 * [select](./select.tsx) is for a form, where the question is one among many
 * and the answer fits in a summary. **The list in view is for when comparing
 * is the work**: a side filter, a list of features to enable. Search on it is
 * common — it is the brand filter of any large store.
 *
 * **Collapsed, a checked option never disappears.** "Show all" reveals the
 * rest, but an option already checked shows even past the cut: hiding it would
 * take off screen the control that undoes the choice.
 *
 * **Search shows everything it finds**, uncut, ignores accents and case, and an
 * empty result says what was searched. A checked option the search does not
 * find leaves the view, not the submission: a hidden input keeps it.
 *
 * **The limit locks the others and says why.** At the limit, the unchecked
 * boxes lock and point at the counter, which is announced on every change.
 * Unchecking one unlocks them all.
 *
 * **The count is the cost of the choice**, said before it: how many results
 * remain if this option is checked.
 *
 * **Columns only for short labels** — weekdays, cities. Reading still runs top
 * to bottom in each column; a long label in a narrow column wraps and the grid
 * turns into a staircase.
 *
 * **"Clear" undoes the whole group**, and only shows when there is something to
 * undo. Unchecking twelve boxes one by one is what makes people give up on a
 * filter.
 *
 * **Disabled, it shows everything and does not search.** There is nothing to
 * look for in a list where nothing can be checked, and a locked "Show all"
 * would hide what it can only read. The reason is the group's hint, and every
 * box points at it.
 */

export type CheckboxListOption = {
  value: string;
  label: string;
  /** How many results remain if this option is checked. */
  count?: number;
  disabled?: boolean;
};

type CheckboxListProps = {
  legend: string;
  /** A legend only for listeners: when a tab or a heading already says the name. */
  hiddenLegend?: boolean;
  options: readonly CheckboxListOption[];
  /** Name in the submission: one box per value, under the same `name`. */
  name?: string;
  value?: readonly string[];
  defaultValue?: readonly string[];
  onValueChange?: (value: string[]) => void;
  hint?: string;
  error?: string;
  /** A search field at the top. For lists of more than about ten items. */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Collapses after N options, with "Show all". */
  collapseAfter?: number;
  /** At most N checked. */
  max?: number;
  /** Side by side, for short labels. */
  columns?: 2 | 3;
  /** "Clear" unchecks them all. */
  clearable?: boolean;
  /** Locks the group; the `hint` says why. */
  disabled?: boolean;
  className?: string;
};

export function CheckboxList({
  legend,
  hiddenLegend = false,
  options,
  name,
  value,
  defaultValue,
  onValueChange,
  hint,
  error,
  searchable = false,
  searchPlaceholder = m.search,
  collapseAfter,
  max,
  columns,
  clearable = false,
  disabled = false,
  className,
}: CheckboxListProps) {
  const base = useId();
  const listId = `${base}-list`;
  const counterId = `${base}-limit`;

  const [inner, setInner] = useState<string[]>([...(defaultValue ?? [])]);
  const checked = value ?? inner;
  const [term, setTerm] = useState("");
  const [expanded, setExpanded] = useState(false);
  const list = useRef<HTMLUListElement>(null);

  const search = searchable && !disabled;
  const searching = search && term.trim() !== "";
  const collapses = !disabled && collapseAfter !== undefined && options.length > collapseAfter;

  const visible = useMemo(() => {
    if (searching) {
      const t = normalize(term.trim());
      return options.filter((o) => normalize(o.label).includes(t));
    }
    if (!collapses || expanded) return options;
    return options.filter((o, i) => i < collapseAfter! || checked.includes(o.value));
  }, [options, searching, term, collapses, expanded, collapseAfter, checked]);

  const full = max !== undefined && checked.length >= max;

  function change(next: string[]) {
    if (value === undefined) setInner(next);
    onValueChange?.(next);
  }

  return (
    <Fieldset legend={legend} hiddenLegend={hiddenLegend} hint={hint} error={error} disabled={disabled} className={className}>
      {max !== undefined ? (
        // Announced on every change: it explains the box that just locked.
        // Not `role="alert"` — it is not an error, it is state.
        <p id={counterId} aria-live="polite" className={cn("mb-1 text-sm tabular-nums", full ? "font-medium text-primary" : "text-secondary")}>
          {full ? m.limitReached(max) : m.limit(checked.length, max)}
        </p>
      ) : null}

      {search ? (
        <div className="mb-1">
          <Field
            label={m.searchIn(legend)}
            hiddenLabel
            type="search"
            icon="search"
            autoComplete="off"
            value={term}
            onChange={(e) => setTerm(e.currentTarget.value)}
            placeholder={searchPlaceholder}
          />
        </div>
      ) : null}

      <ul
        ref={list}
        id={listId}
        className={cn(columns && "grid gap-x-6", columns === 2 && "sm:grid-cols-2", columns === 3 && "grid-cols-2 sm:grid-cols-3")}
      >
        {visible.map((o) => {
          const on = checked.includes(o.value);
          const locked = full && !on;
          return (
            <li key={o.value}>
              <Checkbox
                name={name}
                value={o.value}
                checked={on}
                onChange={() => change(toggleValue(options, checked, o.value))}
                disabled={o.disabled || locked}
                aria-describedby={locked ? counterId : undefined}
                label={
                  o.count === undefined ? (
                    o.label
                  ) : (
                    <span className="flex items-baseline gap-3">
                      <span className="min-w-0 flex-1">{o.label}</span>
                      <span className="shrink-0 text-xs tabular-nums text-subtle">{formatInteger(o.count)}</span>
                    </span>
                  )
                }
              />
            </li>
          );
        })}
      </ul>

      {/* A checked option the search does not find stays in the submission. */}
      {searching && name
        ? checked.filter((v) => !visible.some((o) => o.value === v)).map((v) => <input key={v} type="hidden" name={name} value={v} />)
        : null}

      {searching && visible.length === 0 ? (
        // The term is the person's: a word without spaces breaks where it must,
        // instead of running across the page.
        <p className="py-2 text-sm text-secondary [overflow-wrap:anywhere]">{m.nothingFound(term.trim(), legend)}</p>
      ) : null}

      {(collapses && !searching) || (clearable && checked.length > 0 && !disabled) ? (
        <div className="flex flex-wrap items-center gap-x-6">
          {collapses && !searching ? (
            <Button
              type="button"
              variant="link"
              className="px-0"
              aria-expanded={expanded}
              aria-controls={listId}
              onClick={() => setExpanded((open) => !open)}
            >
              {expanded ? m.showLess : m.showAll(options.length)}
            </Button>
          ) : null}
          {clearable && checked.length > 0 && !disabled ? (
            <Button
              type="button"
              variant="link"
              className="px-0"
              onClick={() => {
                change([]);
                // The button leaves with what it cleared: focus goes to the
                // first box, not to `body`, where the keyboard would lose its
                // place.
                list.current?.querySelector<HTMLInputElement>("input:not(:disabled)")?.focus();
              }}
            >
              {m.clear(checked.length)}
            </Button>
          ) : null}
        </div>
      ) : null}
    </Fieldset>
  );
}
