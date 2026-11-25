// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { messages } from "@/messages";

import { Stat, StatGroup } from "./stat";

afterEach(cleanup);

const m = messages.ui.stat;
const to = "in October";

describe("Stat", () => {
  it("writes the count with grouped thousands and says the change in words", () => {
    render(<Stat label="Visitors" value={1344} comparison={{ previous: 1200, to }} />);
    expect(screen.getByText("1,344")).toBeDefined();
    const change = screen.getByText(m.up("12%", to));
    expect(change.className).toContain("text-success");
  });

  it("a rise is bad when less is better", () => {
    render(<Stat label="Response time" value={112} comparison={{ previous: 100, to, higherIsBetter: false }} />);
    expect(screen.getByText(m.up("12%", to)).className).toContain("text-error");
  });

  it("calls a wobble the same, and a zero base no percentage", () => {
    const { rerender } = render(<Stat label="Visitors" value={1003} comparison={{ previous: 1000, to }} />);
    expect(screen.getByText(m.flat(to))).toBeDefined();

    rerender(<Stat label="Visitors" value={40} comparison={{ previous: 0, to }} />);
    expect(screen.getByText(m.noBase(to))).toBeDefined();
  });

  it("an unmeasured previous period says nothing", () => {
    render(<Stat label="Visitors" value={40} comparison={{ previous: null, to }} />);
    expect(screen.queryByText(new RegExp(to))).toBeNull();
  });

  it("no data is said in words, never shown as zero", () => {
    render(<Stat label="Signups" value={null} trend={{ values: [1, 2], label: "Signups per day" }} />);
    expect(screen.getByText(m.noData)).toBeDefined();
    expect(screen.queryByText("0")).toBeNull();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("the sparkline is an image with a name", () => {
    render(<Stat label="Visitors" value={510} trend={{ values: [320, 410, 510], label: "Visitors per day, from 320 to 510" }} />);
    expect(screen.getByRole("img", { name: "Visitors per day, from 320 to 510" })).toBeDefined();
  });

  it("the showcase rounds down to thousands and forces the dark scheme", () => {
    const { container } = render(<Stat variant="showcase" label="Active accounts" value={69842} rounding="thousands" detail="Across 40 countries" />);
    expect(screen.getByText("69K+")).toBeDefined();
    expect(container.querySelector("dl")?.getAttribute("data-theme")).toBe("dark");
  });
});

describe("StatGroup", () => {
  it("is a named list, one item per stat, and passes its variant down", () => {
    render(
      <StatGroup label="October summary" variant="showcase">
        <Stat label="Visitors" value={1200} />
        <Stat label="Signups" value={86} />
      </StatGroup>,
    );
    const list = screen.getByRole("list", { name: "October summary" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    expect(list.querySelectorAll('[data-theme="dark"]')).toHaveLength(2);
  });
});
