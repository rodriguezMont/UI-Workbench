import { useMemo, useState } from "react";
import { ArrowDownUp, ChevronLeft, ChevronRight, Filter } from "lucide-react";

import { cn } from "@/lib/cn";
import { formatInteger } from "@/lib/format";
import { filterRows, pageOf, searchRows, sortRows, type CellValue, type SortDirection } from "@/lib/table";
import { messages } from "@/messages";

import { Button } from "./button";
import { Empty } from "./empty";
import { Field } from "./field";
import { Select } from "./select";
import { Table, type TableColumn } from "./table";

const m = messages.ui.dataTable;

/**
 * The data table: **the [table](./table.tsx) with search, filters, sorting,
 * rows per page and pages**.
 *
 * **It is composition, not invention**: the table draws, the field searches,
 * the select filters and picks the page size, the buttons move. What it owns
 * is the order these happen in — search, filter, sort, slice the page — and
 * that lives in [`table.ts`](../../lib/table.ts), under test.
 *
 * **No table library.** A headless table library stays the right choice for
 * grids, grouped columns or virtualized lists; to compare, include and slice,
 * it would be weight and coupling. The component's API does not change on the
 * day one comes in.
 *
 * **An empty list is still a defect**: a filter that returns nothing shows
 * [Empty](./empty.tsx) with the way back, never a blank area. **And the count
 * tells the whole** — "Showing 1–12 of 12 (of 42)" — so people see what the
 * filter hid.
 *
 * **While the table is cards (below `lg`), the header is hidden** — and it is
 * the header that sorts. There a "Sort by" select appears with a button that
 * flips the direction: the same order, through the control that fits.
 */

export type DataColumn<T> = {
  id: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  /**
   * The value that sorts and that the search scans. **Without it the column
   * does not sort** — a column of buttons has nothing to compare.
   */
  value?: (row: T) => CellValue;
  align?: "end";
  primary?: boolean;
  className?: string;
  /** The options of this column's filter. Without them, it does not filter. */
  filter?: { label?: string; options: readonly { value: string; label: string }[] };
  /** The row's value for the filter. Defaults to `value`, as text. */
  filterValue?: (row: T) => string;
};

const PAGE_SIZES = [10, 25, 50] as const;

export function DataTable<T>({
  caption,
  hiddenCaption,
  columns,
  rows,
  rowKey,
  searchLabel = m.search,
  searchPlaceholder = m.searchPlaceholder,
  pageSize = 10,
  className,
}: {
  caption: string;
  hiddenCaption?: boolean;
  columns: readonly DataColumn<T>[];
  rows: readonly T[];
  rowKey: (row: T) => string;
  searchLabel?: string;
  searchPlaceholder?: string;
  pageSize?: number;
  className?: string;
}) {
  const [term, setTerm] = useState("");
  const [checked, setChecked] = useState<Record<string, string[]>>({});
  const [order, setOrder] = useState<{ id: string; direction: SortDirection } | null>(null);
  const [size, setSize] = useState(pageSize);
  const [pageIndex, setPageIndex] = useState(0);

  const sortable = columns.filter((c) => c.value);
  const filterable = columns.filter((c) => c.filter);

  const visible = useMemo(() => {
    const found = searchRows(
      rows,
      term,
      columns.flatMap((c) => (c.value ? [c.value] : [])),
    );
    const filtered = filterRows(
      found,
      columns
        .filter((c) => c.filter)
        .map((c) => ({
          value: (row: T) => c.filterValue?.(row) ?? String(c.value?.(row) ?? ""),
          selected: checked[c.id] ?? [],
        })),
    );
    if (!order) return filtered;
    const column = columns.find((c) => c.id === order.id);
    return column?.value ? sortRows(filtered, column.value, order.direction) : filtered;
  }, [rows, term, checked, order, columns]);

  // The page corrects itself when the list shrinks: someone on page 5 who
  // filtered down to seven rows lands on page 1, not on an empty screen.
  const page = pageOf(visible, pageIndex, size);
  const filtering = term.trim() !== "" || Object.values(checked).some((v) => v.length > 0);

  function sortBy(id: string) {
    setPageIndex(0);
    setOrder((current) =>
      current?.id === id ? { id, direction: current.direction === "asc" ? "desc" : "asc" } : { id, direction: "asc" },
    );
  }

  function clear() {
    setTerm("");
    setChecked({});
    setPageIndex(0);
  }

  const tableColumns: TableColumn<T>[] = columns.map((c) => ({
    id: c.id,
    header: c.header,
    cell: c.cell,
    align: c.align,
    primary: c.primary,
    className: c.className,
    sort: c.value ? { direction: order?.id === c.id ? order.direction : null, onToggle: () => sortBy(c.id) } : undefined,
  }));

  return (
    <div className={cn("w-full", className)}>
      {/* The bar: search, filters and page size. The search shares its line
          with the selects only from `xl`: at `lg`, next to a side panel, they
          would leave the search a sliver. */}
      <div className="mb-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
        <Field
          label={searchLabel}
          type="search"
          icon="search"
          placeholder={searchPlaceholder}
          value={term}
          onChange={(e) => {
            setTerm(e.currentTarget.value);
            setPageIndex(0);
          }}
        />

        {/* Below `lg` the selects wrap: in fixed columns they would burst the
            page at 768 next to a side panel. From `lg` there is width, and
            they run in a row again. */}
        <div className="grid gap-3 sm:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] lg:grid-flow-col lg:grid-cols-none lg:auto-cols-[minmax(10rem,12rem)]">
          {filterable.map((c) => (
            <Select
              key={c.id}
              multiple
              label={c.filter?.label ?? c.header}
              placeholder={m.all}
              options={c.filter?.options ?? []}
              value={checked[c.id] ?? []}
              onValueChange={(next) => {
                setChecked((current) => ({ ...current, [c.id]: next }));
                setPageIndex(0);
              }}
            />
          ))}
          <Select
            label={m.perPage}
            options={PAGE_SIZES.map((n) => ({ value: String(n), label: m.perPageOption(n) }))}
            value={String(size)}
            onValueChange={(v) => {
              setSize(Number(v));
              setPageIndex(0);
            }}
          />
        </div>
      </div>

      {/* While the table is cards, the header that sorts is hidden; this
          control takes its place, and leaves with the cards at `lg`. */}
      {sortable.length > 0 ? (
        <div className="mb-3 flex items-end gap-2 lg:hidden">
          <div className="min-w-0 flex-1">
            <Select
              label={m.sortBy}
              placeholder={m.defaultOrder}
              options={sortable.map((c) => ({ value: c.id, label: c.header }))}
              value={order?.id ?? ""}
              onValueChange={(id) => {
                setOrder({ id, direction: "asc" });
                setPageIndex(0);
              }}
            />
          </div>
          <Button
            variant="secondary"
            size="icon"
            aria-label={order?.direction === "desc" ? m.sortAscending : m.sortDescending}
            disabled={!order}
            onClick={() => order && sortBy(order.id)}
          >
            <ArrowDownUp size={18} aria-hidden />
          </Button>
        </div>
      ) : null}

      <Table
        caption={caption}
        hiddenCaption={hiddenCaption}
        columns={tableColumns}
        rows={page.rows}
        rowKey={rowKey}
        empty={
          <div role="alert">
            <Empty icon={Filter} title={term.trim() ? m.nothingFor(term.trim()) : m.nothingFiltered} description={m.nothingHint}>
              <Button variant="secondary" onClick={clear}>
                {m.clear}
              </Button>
            </Empty>
          </div>
        }
      />

      {/* The footer: where you are, and how to move. The count shows even with
          a single page — it is information, and it changes with the filter. */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        {/* Plain text, not a live region: it changed on every keystroke, and a
            listener got one announcement per character on top of their own
            typing. What deserves an announcement is the list going empty, and
            the alert above says that. */}
        <p className="text-sm tabular-nums text-secondary">
          {visible.length === 0
            ? m.noRows
            : `${m.showing(formatInteger(page.first), formatInteger(page.last), formatInteger(visible.length))}${
                filtering ? m.ofAll(formatInteger(rows.length)) : ""
              }`}
        </p>

        {page.pages > 1 ? (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="icon"
              aria-label={m.previous}
              disabled={page.index === 0}
              onClick={() => setPageIndex(page.index - 1)}
            >
              <ChevronLeft size={18} aria-hidden />
            </Button>
            <span className="text-sm tabular-nums text-secondary">{m.page(page.index + 1, page.pages)}</span>
            <Button
              variant="secondary"
              size="icon"
              aria-label={m.next}
              disabled={page.index >= page.pages - 1}
              onClick={() => setPageIndex(page.index + 1)}
            >
              <ChevronRight size={18} aria-hidden />
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
