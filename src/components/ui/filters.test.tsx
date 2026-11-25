// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { messages } from "@/messages";

import { ActiveFilters, FilterGroupList, Filters, type FilterGroup } from "./filters";

/**
 * The pure rules have their own tests in `filters.test.ts`. Here the piece is
 * mounted in memory: there is no layout, so what is asserted is behavior —
 * does the component apply the rules?
 */

afterEach(cleanup);

const m = messages.ui.filters;
const list = messages.ui.checkboxList;

const GROUPS: readonly FilterGroup[] = [
  {
    id: "category",
    legend: "Category",
    options: [
      { value: "shoes", label: "Shoes", count: 3 },
      { value: "bags", label: "Bags", count: 1 },
      { value: "hats", label: "Hats", count: 0 },
    ],
  },
];

function mount(selected: Record<string, readonly string[]> = {}) {
  const onToggle = vi.fn();
  render(<Filters groups={GROUPS} selected={selected} onToggle={onToggle} onClear={vi.fn()} showActive={false} />);
  return { onToggle };
}

describe("Filters", () => {
  it("an option that would lead to zero does not show", () => {
    mount();
    expect(screen.getByRole("checkbox", { name: /Shoes/ })).toBeDefined();
    expect(screen.queryByRole("checkbox", { name: /Hats/ })).toBeNull();
  });

  it("a checked option stays in view even at zero", () => {
    // Hiding it would take off screen the control that undoes the choice.
    mount({ category: ["hats"] });
    const zero = screen.getByRole("checkbox", { name: /Hats/ }) as HTMLInputElement;
    expect(zero.checked).toBe(true);
  });

  it("the count sits with the option: the cost said before the choice", () => {
    mount();
    expect(screen.getByRole("checkbox", { name: /Shoes/ }).closest("label")?.textContent).toContain("3");
  });

  it("the whole group leaves when no option remains", () => {
    render(
      <Filters
        groups={[{ id: "open", legend: "Open now", options: [{ value: "sunday", label: "On Sundays", count: 0 }] }]}
        selected={{}}
        onToggle={vi.fn()}
        onClear={vi.fn()}
        showActive={false}
      />,
    );
    expect(screen.queryByText("Open now")).toBeNull();
  });

  it("checking tells the screen, with group and value", async () => {
    const { onToggle } = mount();
    await userEvent.click(screen.getByRole("checkbox", { name: /Bags/ }));
    expect(onToggle).toHaveBeenCalledWith("category", "bags");
  });

  it("the whole label is the target, not just the box", async () => {
    const { onToggle } = mount();
    await userEvent.click(screen.getByText("Shoes"));
    expect(onToggle).toHaveBeenCalledWith("category", "shoes");
  });

  it("every box goes into the submission, named after the group: it works in a GET form", () => {
    mount({ category: ["shoes"] });
    const box = screen.getByRole("checkbox", { name: /Shoes/ }) as HTMLInputElement;
    expect(box.name).toBe("category");
    expect(box.value).toBe("shoes");
  });

  it("a long group collapses, and a checked option past the cut stays in view", () => {
    const colors = Array.from({ length: 12 }, (_, i) => ({
      value: `c${i}`,
      label: `Color ${String.fromCharCode(65 + i)}`,
      count: 1,
    }));
    render(
      <Filters
        groups={[{ id: "color", legend: "Color", options: colors }]}
        selected={{ color: ["c11"] }}
        onToggle={vi.fn()}
        onClear={vi.fn()}
        showActive={false}
      />,
    );
    expect(screen.queryByRole("checkbox", { name: /Color H/ })).toBeNull();
    expect(screen.getByRole("checkbox", { name: /Color L/ })).toBeDefined();
    expect(screen.getByRole("button", { name: list.showAll(12) })).toBeDefined();
    expect(screen.getByRole("searchbox", { name: list.searchIn("Color") })).toBeDefined();
  });
});

describe("ActiveFilters", () => {
  it("renders nothing while no filter is active", () => {
    const { container } = render(<ActiveFilters groups={GROUPS} selected={{}} onToggle={vi.fn()} onClear={vi.fn()} />);
    expect(container.textContent).toBe("");
  });

  it("each active filter is a chip that removes itself, and one button clears all", async () => {
    const onToggle = vi.fn();
    const onClear = vi.fn();
    render(<ActiveFilters groups={GROUPS} selected={{ category: ["shoes", "bags"] }} onToggle={onToggle} onClear={onClear} />);

    await userEvent.click(screen.getByRole("button", { name: m.remove("Bags") }));
    expect(onToggle).toHaveBeenCalledWith("category", "bags");

    await userEvent.click(screen.getByRole("button", { name: m.clearAll }));
    expect(onClear).toHaveBeenCalledOnce();
  });
});

describe("FilterGroupList", () => {
  const group: FilterGroup = {
    id: "brand",
    legend: "Brand",
    options: [
      { value: "c", label: "Cedar", count: 4 },
      { value: "a", label: "Aspen", count: 2 },
      { value: "b", label: "Birch", count: 9 },
    ],
  };
  // The label without its trailing count.
  const labels = () => screen.getAllByRole("checkbox").map((el) => el.closest("label")!.textContent!.replace(/[\d,]+$/, ""));

  it("`full` sorts alphabetically", () => {
    render(<FilterGroupList group={group} selected={{}} onToggle={vi.fn()} layout="full" />);
    expect(labels()).toEqual(["Aspen", "Birch", "Cedar"]);
  });

  it("pinned values come first", () => {
    render(<FilterGroupList group={group} selected={{}} onToggle={vi.fn()} pinned={["b"]} />);
    expect(labels()).toEqual(["Birch", "Cedar", "Aspen"]);
  });
});
