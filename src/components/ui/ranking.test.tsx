// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { messages } from "@/messages";

import { Ranking } from "./ranking";

afterEach(cleanup);

const m = messages.ui.ranking;
const unit = { one: "signup", other: "signups" };
const REGIONS = [
  { label: "South", value: 34 },
  { label: "North", value: 86 },
  { label: "West", value: 3 },
  { label: "East", value: 21 },
];

describe("Ranking", () => {
  it("is an ordered list, largest first, with each one's share", () => {
    render(<Ranking title="Signups by region" items={REGIONS} unit={unit} />);
    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items).toHaveLength(4);
    expect(items[0]?.textContent).toContain("North");
    expect(items[0]?.textContent).toContain("60%");
  });

  it("each name is read with its rank and each value with its unit", () => {
    render(<Ranking title="Signups by region" items={REGIONS} unit={unit} />);
    const first = within(screen.getByRole("list")).getAllByRole("listitem")[0]!;
    expect(within(first).getByText(m.rank(1).trim())).toBeDefined();
    expect(first.textContent).toContain("86 signups,");
  });

  it("folds the tail into one row with no rank", () => {
    const { container } = render(<Ranking title="Signups by region" items={REGIONS} unit={unit} limit={2} />);
    const tail = container.querySelector("[data-tail]");
    expect(tail?.textContent).toContain(m.others(2));
    expect(tail?.textContent).toContain("24");
    expect(tail?.textContent).not.toContain("Rank");
  });
});
