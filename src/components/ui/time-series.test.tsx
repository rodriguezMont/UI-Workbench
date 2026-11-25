// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { messages } from "@/messages";

import { TimeSeries } from "./time-series";

afterEach(cleanup);

const m = messages.ui.chart;
const unit = { one: "visitor", other: "visitors" };
const DATES = ["2026-10-01", "2026-10-02", "2026-10-03"];

describe("TimeSeries", () => {
  it("is a named chart that reads day by day with the arrow keys", async () => {
    render(<TimeSeries title="Visitors per day" dates={DATES} series={[{ label: "Visitors", values: [32, 45, 51] }]} unit={unit} />);
    const chart = screen.getByRole("group", { name: m.readByDay("Visitors per day") });
    expect(chart.getAttribute("aria-roledescription")).toBe(m.roleDescription);

    // Focus starts on the most recent day.
    await userEvent.tab();
    expect(document.activeElement).toBe(chart);
    expect(screen.getByText("October 3: 51 visitors", { selector: "[aria-live]" })).toBeDefined();

    await userEvent.keyboard("{ArrowLeft}");
    expect(screen.getByText("October 2: 45 visitors", { selector: "[aria-live]" })).toBeDefined();
    await userEvent.keyboard("{Home}");
    expect(screen.getByText("October 1: 32 visitors", { selector: "[aria-live]" })).toBeDefined();

    fireEvent.blur(chart);
    expect(document.querySelector("[aria-live]")?.textContent).toBe("");
  });

  it("with two series, a legend and both values in the reading", async () => {
    render(
      <TimeSeries
        title="Visitors by region"
        dates={DATES}
        series={[
          { label: "North", values: [52, 40, 30] },
          { label: "South", values: [38, 20, 10] },
        ]}
        unit={unit}
      />,
    );
    expect(screen.getAllByText("North").length).toBeGreaterThan(0);
    await userEvent.tab();
    expect(
      screen.getByText("October 3: 30 visitors (North); 10 visitors (South)", { selector: "[aria-live]" }),
    ).toBeDefined();
  });

  it("every value is also in the table under 'See the numbers'", () => {
    render(<TimeSeries title="Visitors per day" dates={DATES} series={[{ label: "Visitors", values: [32, 1450, 51] }]} unit={unit} />);
    expect(screen.getByText(m.seeNumbers)).toBeDefined();
    const table = screen.getByRole("table", { name: "Visitors per day" });
    expect(within(table).getByText("October 2")).toBeDefined();
    expect(within(table).getByText("1,450")).toBeDefined();
  });
});
