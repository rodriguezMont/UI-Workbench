// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { messages } from "@/messages";
import { installDomStubs } from "@/test/dom";

import { DataTable, type DataColumn } from "./data-table";

/**
 * The four row functions have their own tests in `lib/table.test.ts`. What is
 * checked here is that the component uses them **in the right order**, and
 * that an empty result never becomes a blank area without a way back.
 */

beforeEach(() => installDomStubs());
afterEach(cleanup);

const m = messages.ui.dataTable;

type Row = { id: string; account: string; region: string; visitors: number };

const ROWS: readonly Row[] = [
  { id: "1", account: "Acme Analytics", region: "North", visitors: 1240 },
  { id: "2", account: "Brightline Café", region: "North", visitors: 97 },
  { id: "3", account: "Zenith Labs", region: "South", visitors: 489 },
];

const COLUMNS: readonly DataColumn<Row>[] = [
  { id: "account", header: "Account", cell: (r) => r.account, value: (r) => r.account, primary: true },
  {
    id: "region",
    header: "Region",
    cell: (r) => r.region,
    value: (r) => r.region,
    filter: {
      options: [
        { value: "North", label: "North" },
        { value: "South", label: "South" },
      ],
    },
  },
  { id: "visitors", header: "Visitors", cell: (r) => String(r.visitors), value: (r) => r.visitors, align: "end" },
];

function mount(pageSize = 10) {
  render(
    <DataTable
      caption="Accounts"
      columns={COLUMNS}
      rows={ROWS}
      rowKey={(r) => r.id}
      searchLabel="Search accounts"
      searchPlaceholder="Account or region"
      pageSize={pageSize}
    />,
  );
}

const firstCells = () =>
  screen
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getAllByRole("cell")[0]?.textContent?.trim());

describe("DataTable", () => {
  it("the search ignores accents", async () => {
    mount();
    await userEvent.type(screen.getByLabelText("Search accounts"), "cafe");
    expect(firstCells()).toEqual(["Brightline Café"]);
  });

  it("the count tells the whole when a search hides rows", async () => {
    mount();
    expect(screen.getByText(m.showing("1", "3", "3"))).toBeDefined();
    await userEvent.type(screen.getByLabelText("Search accounts"), "south");
    expect(screen.getByText(`${m.showing("1", "1", "1")}${m.ofAll("3")}`)).toBeDefined();
  });

  it("an empty result is announced and offers the way back", async () => {
    mount();
    await userEvent.type(screen.getByLabelText("Search accounts"), "nothing here");
    const alert = screen.getByRole("alert");
    expect(within(alert).getByText(m.nothingFor("nothing here"))).toBeDefined();

    await userEvent.click(within(alert).getByRole("button", { name: m.clear }));
    expect(firstCells()).toHaveLength(3);
  });

  it("the header sorts, and a second click flips the order", async () => {
    mount();
    const header = screen.getByRole("button", { name: /Visitors/ });
    await userEvent.click(header);
    expect(firstCells()[0]).toBe("Brightline Café");
    expect(screen.getByRole("columnheader", { name: /Visitors/ }).getAttribute("aria-sort")).toBe("ascending");

    await userEvent.click(header);
    expect(firstCells()[0]).toBe("Acme Analytics");
    expect(screen.getByRole("columnheader", { name: /Visitors/ }).getAttribute("aria-sort")).toBe("descending");
  });

  it("the page corrects itself when the list shrinks", async () => {
    mount(2);
    expect(screen.getByText(m.page(1, 2))).toBeDefined();
    await userEvent.click(screen.getByRole("button", { name: m.next }));
    expect(screen.getByText(m.showing("3", "3", "3"))).toBeDefined();

    // Someone on page 2 who searches down to one row lands on page 1, not on
    // an empty screen the search does not explain.
    await userEvent.type(screen.getByLabelText("Search accounts"), "zenith");
    expect(firstCells()).toEqual(["Zenith Labs"]);
    expect(screen.queryByRole("button", { name: m.next })).toBeNull();
  });
});
