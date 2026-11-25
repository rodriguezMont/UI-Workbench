import { X } from "lucide-react";

import { cn } from "@/lib/cn";
import { compareText } from "@/lib/normalize";
import { messages } from "@/messages";

import { Button } from "./button";
import { CheckboxList } from "./checkbox-list";

const m = messages.ui.filters;

/**
 * The filters — **they refine a list, and never empty it**.
 *
 * ## The rule this component carries
 *
 * An empty list is a defect, and a filter that can bring the result to zero
 * is the easiest way to produce one — the worst kind, because the person
 * caused it without knowing.
 *
 * **The answer is not to forbid the filter; it is to say the cost first.**
 * Each option shows **how many results remain** if it is checked, so the
 * person sees where a path leads before taking it.
 *
 * **An option that would lead to zero does not show.** A facet with no result
 * in the current slice leaves the list instead of showing faded with a `0`:
 * "zero results" is not a fact about the option, it is a fact about the
 * slice.
 *
 * **The exception is a checked option.** It stays in view even at zero,
 * because the person chose it: hiding it would take off screen the control
 * that undoes what they just did.
 *
 * **What is active stays visible and removable one by one.** Filters that
 * pile up out of sight are how people conclude the catalog is small.
 *
 * **Each group is a [checkbox list](./checkbox-list.tsx)**: the box, the
 * count, "Show all" and the search are its. What belongs to the filters alone
 * — the zero option leaving — happens before, here.
 */

/**
 * When a group collapses and when it gets a search. Eight fit in a phone
 * sheet without pushing the next group off screen; collapsed, it shows six
 * and "Show all". The search is for a list no longer read at a glance — the
 * checkbox list asks for one from about ten.
 */
const COLLAPSE_ABOVE = 8;
const COLLAPSED = 6;
const SEARCH_ABOVE = 10;

export type FilterOption = {
  value: string;
  label: string;
  /** How many results remain if this option is checked. */
  count: number;
};

export type FilterGroup = {
  id: string;
  legend: string;
  options: readonly FilterOption[];
};

export type FilterSelection = Readonly<Record<string, readonly string[]>>;

/**
 * Checks or unchecks a value in one group, leaving the rest alone. **Every
 * screen that uses the filters needs this**, and two copies would drift at
 * the first fix — so it lives next to the component that consumes it.
 */
export function toggleFilterValue(selected: FilterSelection, groupId: string, value: string): Record<string, string[]> {
  const current = selected[groupId] ?? [];
  return {
    ...Object.fromEntries(Object.entries(selected).map(([k, v]) => [k, [...v]])),
    [groupId]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
  };
}

type FilterProps = {
  groups: readonly FilterGroup[];
  /** Checked values, by group. */
  selected: FilterSelection;
  onToggle: (groupId: string, value: string) => void;
  onClear: () => void;
  className?: string;
};

/**
 * **What is active, visible and removable one by one.** Apart from the groups
 * because the two live in different places once the groups go into a sheet:
 * the sheet closes, and the chips must stay on the page — an active filter
 * that leaves with the sheet is the filter that piles up out of sight.
 */
export function ActiveFilters({ groups, selected, onToggle, onClear, className }: FilterProps) {
  const active = groups.flatMap((g) =>
    (selected[g.id] ?? []).map((v) => ({
      groupId: g.id,
      value: v,
      label: g.options.find((o) => o.value === v)?.label ?? v,
    })),
  );

  if (active.length === 0) return null;

  return (
    // The vertical gap belongs to the touch area, not to the drawing: a 26px
    // chip extends 9px up and down, so two stacked chips need 18px between
    // them, or a tap on the bottom edge of one removes the filter below it.
    <div className={cn("flex flex-wrap items-center gap-x-2 gap-y-5", className)}>
      <span className="text-sm text-secondary">{m.activeLead}</span>
      {active.map((a) => (
        <button
          key={`${a.groupId}:${a.value}`}
          type="button"
          onClick={() => onToggle(a.groupId, a.value)}
          aria-label={m.remove(a.label)}
          // A 26px chip with a 44px touch area.
          className="relative touch-area inline-flex items-center gap-1 rounded-full border border-accent px-2.5 py-1 text-xs font-medium text-accent-label transition-colors duration-[var(--motion-instant)] hover:bg-surface-hover [&_svg]:text-accent"
        >
          {a.label}
          <X size={14} aria-hidden />
        </button>
      ))}
      <Button variant="link" size="sm" onClick={onClear}>
        {m.clearAll}
      </Button>
    </div>
  );
}

export function Filters({
  showActive = true,
  className,
  ...props
}: FilterProps & {
  /**
   * `false` when the chips are already on the page — the groups in a sheet,
   * the chips outside it. Two copies of the same chip are two places to wonder
   * which one counts.
   */
  showActive?: boolean;
}) {
  const { groups, selected, onToggle } = props;

  return (
    <div className={cn("space-y-5", className)}>
      {showActive ? <ActiveFilters {...props} /> : null}

      {groups.map((group) => (
        <FilterGroupList key={group.id} group={group} selected={selected} onToggle={onToggle} />
      ))}
    </div>
  );
}

/**
 * An option with no result in the current slice does not show — a "0" would
 * state a non-fact: the option is not empty, it is irrelevant here. A checked
 * one stays, even at zero.
 */
export function visibleOptions(group: FilterGroup, checked: readonly string[]): FilterOption[] {
  return group.options.filter((o) => o.count > 0 || checked.includes(o.value));
}

/** The group asks for a search: a list no longer read at a glance. */
export function groupIsSearchable(visible: readonly FilterOption[]): boolean {
  return visible.length > SEARCH_ABOVE;
}

/**
 * **One filter group** — the checkbox list with the filters' rules. A screen
 * that arranges the groups differently (tabs, a full-screen picker) uses this
 * piece, and the zero-option rule stays in one place.
 */
export function FilterGroupList({
  group,
  selected,
  onToggle,
  search = "inline",
  hiddenLegend = false,
  pinned,
  layout = "compact",
}: {
  group: FilterGroup;
  selected: FilterSelection;
  onToggle: (groupId: string, value: string) => void;
  /** `none`: the caller offers the search elsewhere (a full-screen panel on phones). */
  search?: "inline" | "none";
  /** A tab or heading already says the group's name. */
  hiddenLegend?: boolean;
  /**
   * These values come first, so the person checks what they already chose
   * without scrolling. **A snapshot taken by the caller** — the selection when
   * the list opened — never the live one, or a box would jump to the top
   * under the finger.
   */
  pinned?: readonly string[];
  /**
   * `full`: the whole list, in alphabetical order — for a full-screen picker,
   * where the person looks for a name and follows the alphabet. The default
   * is the sheet's: in the given order, collapsed.
   */
  layout?: "compact" | "full";
}) {
  const checked = selected[group.id] ?? [];
  const base = visibleOptions(group, checked);
  if (base.length === 0) return null;
  const all = layout === "full" ? [...base].sort((a, b) => compareText(a.label, b.label)) : base;
  const visible = pinned?.length
    ? [...all.filter((o) => pinned.includes(o.value)), ...all.filter((o) => !pinned.includes(o.value))]
    : all;

  return (
    <CheckboxList
      legend={group.legend}
      hiddenLegend={hiddenLegend}
      options={visible}
      // With `name`, every box goes into the submission: the group works
      // inside a GET form, without JavaScript.
      name={group.id}
      value={checked}
      onValueChange={(next) => {
        const changed = next.find((v) => !checked.includes(v)) ?? checked.find((v) => !next.includes(v));
        if (changed !== undefined) onToggle(group.id, changed);
      }}
      // Two columns when the group is long; up to four options, one — two
      // columns of two rows only push the label away from its number.
      columns={visible.length > 4 ? 2 : undefined}
      collapseAfter={layout === "compact" && visible.length > COLLAPSE_ABOVE ? COLLAPSED : undefined}
      searchable={search === "inline" && groupIsSearchable(visible)}
    />
  );
}
