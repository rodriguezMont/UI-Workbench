// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SegmentedControl } from "./segmented-control";

afterEach(cleanup);

const PERIODS = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
] as const;

const radio = (name: string) => screen.getByRole("radio", { name }) as HTMLInputElement;

describe("SegmentedControl", () => {
  it("is a radio group named by its legend, the first option set by default", () => {
    render(<SegmentedControl legend="Period" options={PERIODS} />);
    expect(screen.getByRole("group", { name: "Period" })).toBeDefined();
    expect(radio("Week").checked).toBe(true);
  });

  it("uncontrolled, a click sets the option and reports it", async () => {
    const onValueChange = vi.fn();
    render(<SegmentedControl legend="Period" options={PERIODS} defaultValue="month" onValueChange={onValueChange} />);
    expect(radio("Month").checked).toBe(true);
    await userEvent.click(screen.getByText("Year"));
    expect(radio("Year").checked).toBe(true);
    expect(onValueChange).toHaveBeenLastCalledWith("year");
  });

  it("controlled, it shows only what it receives", async () => {
    const onValueChange = vi.fn();
    render(<SegmentedControl legend="Period" options={PERIODS} value="week" onValueChange={onValueChange} />);
    await userEvent.click(screen.getByText("Year"));
    expect(onValueChange).toHaveBeenLastCalledWith("year");
    expect(radio("Week").checked).toBe(true);
  });

  it("submits under the given name, and a hidden legend is still the group's name", () => {
    render(<SegmentedControl legend="Sort by" hiddenLegend name="sort" options={PERIODS} />);
    expect(screen.getByRole("group", { name: "Sort by" })).toBeDefined();
    expect(radio("Week").name).toBe("sort");
  });
});
