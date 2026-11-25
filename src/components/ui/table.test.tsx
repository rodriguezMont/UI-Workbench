// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Table, type TableColumn } from "./table";

afterEach(cleanup);

type Row = { id: string; region: string; revenue: string };

const ROWS: Row[] = [
  { id: "n", region: "North", revenue: "$12,400" },
  { id: "s", region: "South", revenue: "$8,150" },
];

const columns = (sort?: TableColumn<Row>["sort"]): TableColumn<Row>[] => [
  { id: "region", header: "Region", cell: (r) => r.region, primary: true },
  { id: "revenue", header: "Revenue", cell: (r) => r.revenue, align: "end", sort },
];

describe("Table", () => {
  it("keeps table semantics, with the caption as its name", () => {
    render(<Table caption="Revenue by region" columns={columns()} rows={ROWS} rowKey={(r) => r.id} />);
    const table = screen.getByRole("table", { name: "Revenue by region" });
    expect(within(table).getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Region", "Revenue"]);
    expect(within(table).getAllByRole("row")).toHaveLength(3);
  });

  it("each cell but the card's title carries its column's label for the card layout", () => {
    render(<Table caption="Revenue" columns={columns()} rows={ROWS} rowKey={(r) => r.id} />);
    const [title, revenue] = within(screen.getAllByRole("row")[1]!).getAllByRole("cell");
    expect(title!.hasAttribute("data-label")).toBe(false);
    expect(revenue!.getAttribute("data-label")).toBe("Revenue");
  });

  it("a sortable header is a button, and says its order", async () => {
    const onToggle = vi.fn();
    render(<Table caption="Revenue" columns={columns({ direction: "desc", onToggle })} rows={ROWS} rowKey={(r) => r.id} />);
    expect(screen.getByRole("columnheader", { name: /Revenue/ }).getAttribute("aria-sort")).toBe("descending");
    expect(screen.getByRole("columnheader", { name: "Region" }).hasAttribute("aria-sort")).toBe(false);

    await userEvent.click(screen.getByRole("button", { name: /Revenue/ }));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("with no rows, shows what it was given instead", () => {
    render(<Table caption="Revenue" columns={columns()} rows={[]} rowKey={(r) => r.id} empty={<p>No revenue yet</p>} />);
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.getByText("No revenue yet")).toBeDefined();
  });
});
