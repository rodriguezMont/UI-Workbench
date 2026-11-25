// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { messages } from "@/messages";

import { Comparison } from "./comparison";

afterEach(cleanup);

const m = messages.ui.chart;
const unit = { one: "signup", other: "signups" };
const ITEMS = [
  { label: "Website", value: 34 },
  { label: "Search", value: 60 },
  { label: "Referral", value: 2 },
];

const announced = () => document.querySelector("[aria-live]")?.textContent;

describe("Comparison", () => {
  it("sorts largest first", () => {
    const { container } = render(<Comparison title="Signups by channel" items={ITEMS} valueLabel="Signups" unit={unit} />);
    const names = [...container.querySelectorAll("figure > div li > span:first-child")].map((s) => s.textContent);
    expect(names).toEqual(["Search", "Website", "Referral"]);
  });

  it("reads item by item with the up and down arrows, and announces the highlight", async () => {
    render(<Comparison title="Signups by channel" items={ITEMS} valueLabel="Signups" unit={unit} highlight="Website" />);
    expect(screen.getByRole("group", { name: m.readByItem("Signups by channel") })).toBeDefined();

    // Vertical: focus starts on the first, the largest.
    await userEvent.tab();
    expect(announced()).toBe("Search: 60 signups");
    await userEvent.keyboard("{ArrowDown}");
    expect(announced()).toBe(`Website: 34 signups${m.highlighted}`);
    await userEvent.keyboard("{End}");
    expect(announced()).toBe("Referral: 2 signups");
  });

  it("the pointer reads the row it enters", () => {
    const { container } = render(<Comparison title="Signups by channel" items={ITEMS} valueLabel="Signups" unit={unit} />);
    const rows = container.querySelectorAll("figure > div li");
    fireEvent.pointerEnter(rows[1]!);
    expect(announced()).toBe("Website: 34 signups");
  });

  it("the highlight goes bold, so it does not rely on color alone", () => {
    const { container } = render(<Comparison title="Signups by channel" items={ITEMS} valueLabel="Signups" unit={unit} highlight="Referral" />);
    const row = container.querySelector("[data-highlight]");
    expect(row?.textContent).toContain("Referral");
    expect(row?.querySelector("span")?.className).toContain("font-bold");
  });
});
