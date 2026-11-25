// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { messages } from "@/messages";

import { CheckboxList } from "./checkbox-list";

afterEach(cleanup);

const m = messages.ui.checkboxList;

const CITIES = ["Austin", "Boston", "Chicago", "Denver", "Miami", "San José", "Seattle"].map((label) => ({
  value: label.toLowerCase().replace(/\s+/g, "-"),
  label,
}));

const labels = () => screen.getAllByRole("checkbox").map((el) => el.closest("label")!.textContent);

describe("CheckboxList", () => {
  it("collapses after N, but a checked option past the cut stays in view", async () => {
    render(<CheckboxList legend="Cities" options={CITIES} collapseAfter={3} defaultValue={["seattle"]} />);
    expect(labels()).toEqual(["Austin", "Boston", "Chicago", "Seattle"]);

    const toggle = screen.getByRole("button", { name: m.showAll(CITIES.length) });
    await userEvent.click(toggle);
    expect(labels()).toHaveLength(CITIES.length);
    expect(screen.getByRole("button", { name: m.showLess }).getAttribute("aria-expanded")).toBe("true");
  });

  it("searches ignoring accents and case, and says when nothing matches", async () => {
    render(<CheckboxList legend="Cities" options={CITIES} searchable collapseAfter={2} />);
    const search = screen.getByRole("searchbox", { name: m.searchIn("Cities") });

    await userEvent.type(search, "san jose");
    expect(labels()).toEqual(["San José"]);
    // While searching, there is no cut to expand.
    expect(screen.queryByRole("button", { name: m.showAll(CITIES.length) })).toBeNull();

    await userEvent.clear(search);
    await userEvent.type(search, "zzz");
    expect(screen.getByText(m.nothingFound("zzz", "Cities"))).toBeDefined();
  });

  it("a checked option hidden by the search stays in the submission", async () => {
    const { container } = render(<CheckboxList legend="Cities" name="city" options={CITIES} searchable defaultValue={["boston"]} />);
    await userEvent.type(screen.getByRole("searchbox"), "den");
    const hidden = container.querySelector<HTMLInputElement>('input[type="hidden"][name="city"]');
    expect(hidden?.value).toBe("boston");
  });

  it("at the limit, locks the others and points them at the counter", async () => {
    const onValueChange = vi.fn();
    render(<CheckboxList legend="Cities" options={CITIES.slice(0, 3)} max={2} onValueChange={onValueChange} />);
    expect(screen.getByText(m.limit(0, 2))).toBeDefined();

    await userEvent.click(screen.getByRole("checkbox", { name: "Austin" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "Boston" }));
    expect(onValueChange).toHaveBeenLastCalledWith(["austin", "boston"]);

    const counter = screen.getByText(m.limitReached(2));
    const chicago = screen.getByRole("checkbox", { name: "Chicago" }) as HTMLInputElement;
    expect(chicago.disabled).toBe(true);
    expect(chicago.getAttribute("aria-describedby")).toContain(counter.id);

    await userEvent.click(screen.getByRole("checkbox", { name: "Austin" }));
    expect(chicago.disabled).toBe(false);
  });

  it("clear unchecks all and moves focus to the first box", async () => {
    render(<CheckboxList legend="Cities" options={CITIES.slice(0, 3)} clearable defaultValue={["boston", "chicago"]} />);
    await userEvent.click(screen.getByRole("button", { name: m.clear(2) }));
    expect(screen.getAllByRole("checkbox").every((el) => !(el as HTMLInputElement).checked)).toBe(true);
    expect(document.activeElement).toBe(screen.getByRole("checkbox", { name: "Austin" }));
    expect(screen.queryByRole("button", { name: /Clear/ })).toBeNull();
  });

  it("writes counts with grouped thousands", () => {
    render(<CheckboxList legend="Cities" options={[{ value: "austin", label: "Austin", count: 1284 }]} />);
    expect(screen.getByText("1,284")).toBeDefined();
  });

  it("disabled, it shows everything and does not search", () => {
    render(<CheckboxList legend="Cities" options={CITIES} searchable collapseAfter={2} disabled hint="Pick a state first." />);
    expect(screen.queryByRole("searchbox")).toBeNull();
    expect(labels()).toHaveLength(CITIES.length);
    expect(screen.getAllByRole("checkbox").every((el) => el.matches(":disabled"))).toBe(true);
  });
});
