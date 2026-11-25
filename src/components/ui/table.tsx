import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/cn";
import type { SortDirection } from "@/lib/table";

export type { SortDirection };

/**
 * The table: **rows and columns, to read**. No state, no sorting, no pages —
 * whoever needs those wants the [data table](./data-table.tsx), which builds
 * on this one.
 *
 * **Below `lg` it is a list of cards.** A six-column table at 375 — or in the
 * width left next to a side panel at 768 — has two ways out: scroll sideways,
 * hiding half of what matters, or stack. Here each row becomes a card, and each
 * cell carries its column's label in front of it: the same data, in the shape
 * that fits. The switch is at `lg` because at `md` the table still pushed the
 * page sideways.
 *
 * **The table roles are declared, not inherited from the layout.** Changing a
 * table's `display` erases its semantics for listeners in some browsers: the
 * row stops being a row and the cell loses its column. So every element
 * declares its `role` — with `display: block` or without it, a screen reader
 * still hears "Visitors column, 1,240".
 *
 * **The caption is required.** It says what the table is about before anyone
 * enters it; `hiddenCaption` hides it from sight when the screen's heading
 * already says the same, never to save the work of writing one.
 *
 * **Numbers align right** (`align: "end"`) with `tabular-nums`: a column of
 * numbers only compares at a glance when the digits stack.
 */

export type TableColumn<T> = {
  id: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  /** Numbers, money, dates: aligned right. */
  align?: "end";
  /**
   * The column that **titles the card** on phones: shown without a label and
   * emphasized. One per table — usually the first.
   */
  primary?: boolean;
  /** A width or any other adjustment, on the header cell. */
  className?: string;
  /**
   * Sorting. Present = the header is a button; `direction` is the current
   * state, `null` while the table is sorted by another column.
   */
  sort?: { direction: SortDirection | null; onToggle: () => void };
};

export function Table<T>({
  caption,
  hiddenCaption = false,
  columns,
  rows,
  rowKey,
  empty,
  className,
}: {
  caption: string;
  hiddenCaption?: boolean;
  columns: readonly TableColumn<T>[];
  rows: readonly T[];
  rowKey: (row: T) => string;
  /** What shows instead of the rows when there are none. */
  empty?: React.ReactNode;
  className?: string;
}) {
  if (rows.length === 0 && empty) return <>{empty}</>;

  return (
    // The sideways scroll belongs to the table, never to the page: with many
    // columns in a short width, the box scrolls and the page stays put.
    <div className={cn("w-full overflow-x-auto", className)}>
      <table role="table" className="block w-full border-collapse text-sm lg:table">
        {/* `block w-full` while the table is cards: inside a block-level
            table, the caption shrinks to its minimum width and breaks one word
            per line. */}
        <caption className={cn("mb-2 block text-left text-sm text-secondary lg:table-caption", hiddenCaption && "sr-only")}>
          {caption}
        </caption>

        {/* On phones the header leaves the screen — each cell carries its own
            label — but it is still read: it names the columns. `not-sr-only`
            goes with the `display` change, because `sr-only` also positions
            and clips to 1px, and changing only the display would leave the
            header and its sort buttons invisible on desktop. */}
        <thead role="rowgroup" className="sr-only lg:not-sr-only lg:table-header-group">
          <tr role="row">
            {columns.map((column) => (
              <th
                key={column.id}
                role="columnheader"
                scope="col"
                aria-sort={
                  column.sort
                    ? column.sort.direction === "asc"
                      ? "ascending"
                      : column.sort.direction === "desc"
                        ? "descending"
                        : "none"
                    : undefined
                }
                className={cn(
                  "border-b-2 border-divider text-xs font-medium uppercase tracking-wide text-subtle",
                  column.align === "end" ? "text-right" : "text-left",
                  column.sort ? "p-0" : "px-3 py-2",
                  column.className,
                )}
              >
                {column.sort ? (
                  <>
                    {/* While the table is cards, the header is clipped to 1px —
                        a button there would still sit in the Tab order with
                        nothing to show. There it is only the column's name,
                        which is what a listener needs. */}
                    <span className="lg:hidden">{column.header}</span>
                    <button
                      type="button"
                      onClick={column.sort.onToggle}
                      style={{ minHeight: "var(--tap-target)" }}
                      className={cn(
                        "hidden w-full items-center gap-1 px-3 text-xs font-medium uppercase tracking-wide lg:flex",
                        "transition-colors duration-[var(--motion-instant)] ease-[var(--motion-ease)]",
                        "hover:text-accent",
                        column.align === "end" ? "justify-end" : "justify-start",
                        column.sort.direction ? "text-accent" : "text-subtle",
                      )}
                    >
                      {column.header}
                      <SortArrow direction={column.sort.direction} />
                    </button>
                  </>
                ) : (
                  column.header
                )}
              </th>
            ))}
          </tr>
        </thead>

        <tbody role="rowgroup" className="block lg:table-row-group">
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              role="row"
              className={cn(
                // A card on phones; a table row from `lg`.
                "mb-3 block rounded-lg border border-border bg-surface p-3 last:mb-0",
                "lg:mb-0 lg:table-row lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0",
                "lg:border-b lg:border-divider",
              )}
            >
              {columns.map((column) => (
                <td
                  key={column.id}
                  role="cell"
                  // The column's label goes in front of the cell, on phones
                  // only: it stands in for the hidden header.
                  data-label={column.primary ? undefined : column.header}
                  className={cn(
                    "flex items-baseline justify-between gap-4 py-1",
                    "before:text-secondary before:content-[attr(data-label)]",
                    "lg:table-cell lg:py-2.5 lg:before:content-none",
                    column.primary
                      ? // Without a label, an empty pseudo-element would still
                        // count as a child, and `justify-between` would push
                        // the card's title to the right.
                        "pb-2 text-base font-medium text-primary before:content-none lg:text-sm lg:font-normal"
                      : "text-primary",
                    column.align === "end" && "lg:text-right lg:tabular-nums",
                    "px-0 lg:px-3",
                  )}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** The header's arrow: unsorted, both ends dimmed. */
function SortArrow({ direction }: { direction: SortDirection | null }) {
  const Icon = direction === "asc" ? ArrowUp : direction === "desc" ? ArrowDown : ChevronsUpDown;
  return <Icon size={14} aria-hidden className={cn("shrink-0", !direction && "text-border-strong")} />;
}
