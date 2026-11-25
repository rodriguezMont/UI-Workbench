// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { monthLabels } from "@/lib/report-period";
import { messages } from "@/messages";

import { Columns } from "./columns";

afterEach(cleanup);

const m = messages.ui.chart;
const unit = { one: "signup", other: "signups" };
const MONTHS = ["2026-08", "2026-09", "2026-10"].map(monthLabels);

describe("Columns", () => {
  it("one series: each column carries its value, and the arrows read column by column", async () => {
    render(<Columns title="Signups per month" categories={MONTHS} series={[{ label: "Signups", values: [64, 86, 1200] }]} unit={unit} />);
    const chart = screen.getByRole("group", { name: m.readByColumn("Signups per month") });
    expect(within(chart).getByText("1,200")).toBeDefined();

    await userEvent.tab();
    expect(screen.getByText("October 2026: 1,200 signups", { selector: "[aria-live]" })).toBeDefined();
    await userEvent.keyboard("{Home}");
    expect(screen.getByText("August 2026: 64 signups", { selector: "[aria-live]" })).toBeDefined();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByText("September 2026: 86 signups", { selector: "[aria-live]" })).toBeDefined();
  });

  it("the column being read stays full and the others step back", async () => {
    const { container } = render(
      <Columns title="Signups per month" categories={MONTHS} series={[{ label: "Signups", values: [64, 86, 120] }]} unit={unit} />,
    );
    await userEvent.tab();
    const columns = [...container.querySelectorAll("[data-column]")];
    expect(columns.map((c) => c.className.includes("opacity-40"))).toEqual([true, true, false]);
  });

  it("names the table's first column", () => {
    render(<Columns title="Signups per month" categories={MONTHS} series={[{ label: "Signups", values: [1, 2, 3] }]} unit={unit} />);
    const table = screen.getByRole("table", { name: "Signups per month" });
    expect(within(table).getAllByRole("columnheader")[0]?.textContent).toBe(m.monthHeader);
  });
});
