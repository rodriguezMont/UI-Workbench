import { compareText, normalize } from "./normalize";

/**
 * What the data table does to its rows: **search, filter, sort and page** —
 * four pure functions, under test.
 *
 * **Why not a table library.** A headless table library is the right call for
 * grids, grouped columns, draggable columns or virtualized lists. Here the work
 * is this file: compare, include, slice. A new dependency would cost weight
 * and coupling for a problem solved in fifty lines. **When the table needs
 * what these functions do not do, the library comes in, and the component's
 * API does not change.**
 *
 * **All of this applies to whatever list arrives.** When the list comes paged
 * from a server, what changes is who computes — the controls stay the same.
 */

export type SortDirection = "asc" | "desc";

/** What a column hands over to be compared and searched. */
export type CellValue = string | number | undefined;

/**
 * The comparison: **numbers by magnitude, text in the interface's alphabetical
 * order**, with digits compared as numbers ("Plan 2" before "Plan 10"). Empty
 * values go last, in both directions of the comparison.
 */
export function compareValues(a: CellValue, b: CellValue): number {
  if (a === undefined || a === "") return b === undefined || b === "" ? 0 : 1;
  if (b === undefined || b === "") return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return compareText(String(a), String(b), { numeric: true });
}

/**
 * Sorts **without breaking what was already together**: rows of equal value
 * keep the order they arrived in (JavaScript's `sort` is stable, and the copy
 * keeps the caller's list untouched).
 */
export function sortRows<T>(rows: readonly T[], value: (row: T) => CellValue, direction: SortDirection): T[] {
  const sign = direction === "desc" ? -1 : 1;
  return [...rows].sort((a, b) => sign * compareValues(value(a), value(b)));
}

/**
 * The search scans what each column declares, **ignoring accents and case**:
 * "jose" finds "José". An empty term filters nothing.
 */
export function searchRows<T>(rows: readonly T[], term: string, values: readonly ((row: T) => CellValue)[]): T[] {
  const target = normalize(term.trim());
  if (!target) return [...rows];
  return rows.filter((row) => values.some((v) => normalize(String(v(row) ?? "")).includes(target)));
}

/** A column filter: the row's value, and what the person checked. */
export type RowFilter<T> = {
  value: (row: T) => string;
  selected: readonly string[];
};

/**
 * Filters add up across columns (**and**) and accumulate within one (**or**):
 * "Free or Pro" **and** "North". A filter with nothing checked does not filter.
 */
export function filterRows<T>(rows: readonly T[], filters: readonly RowFilter<T>[]): T[] {
  const active = filters.filter((f) => f.selected.length > 0);
  if (active.length === 0) return [...rows];
  return rows.filter((row) => active.every((f) => f.selected.includes(f.value(row))));
}

export type Page<T> = {
  rows: T[];
  /** How many pages exist — never fewer than one. */
  pages: number;
  /** The index of the page returned, already corrected if the requested one no longer exists. */
  index: number;
  /** The first and last row of this page, counting from 1. Zero when empty. */
  first: number;
  last: number;
};

/**
 * Slices the page. **A page that no longer exists falls back to the last one
 * that does** — someone on page 5 who filters the list down to seven rows
 * would otherwise see an empty screen with no explanation.
 */
export function pageOf<T>(rows: readonly T[], index: number, size: number): Page<T> {
  const perPage = Math.max(1, Math.floor(size));
  const pages = Math.max(1, Math.ceil(rows.length / perPage));
  const current = Math.min(Math.max(0, Math.floor(index)), pages - 1);
  const start = current * perPage;
  const slice = rows.slice(start, start + perPage);
  return {
    rows: slice,
    pages,
    index: current,
    first: slice.length ? start + 1 : 0,
    last: slice.length ? start + slice.length : 0,
  };
}
