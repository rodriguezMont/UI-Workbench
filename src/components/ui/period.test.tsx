// @vitest-environment jsdom
import { useState } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ReportPeriod } from "@/lib/report-period";
import { messages } from "@/messages";

import { Period } from "./period";

afterEach(cleanup);

const m = messages.ui.period;

function Controlled({ onValueChange }: { onValueChange: (p: ReportPeriod) => void }) {
  const [value, setValue] = useState<ReportPeriod>("30d");
  return (
    <Period
      value={value}
      today="2026-10-01"
      onValueChange={(p) => {
        setValue(p);
        onValueChange(p);
      }}
    />
  );
}

describe("Period", () => {
  it("is a radio group with the three periods, named for listeners", () => {
    render(<Period value="30d" today="2026-10-01" onValueChange={() => {}} />);
    expect(screen.getByRole("group", { name: m.legend })).toBeDefined();
    expect(screen.getAllByRole("radio").map((r) => r.closest("label")?.textContent)).toEqual(["7 days", "30 days", "12 months"]);
    expect((screen.getByRole("radio", { name: "30 days" }) as HTMLInputElement).checked).toBe(true);
  });

  it("writes the dates and what they are compared with, and updates them on a switch", async () => {
    const onValueChange = vi.fn();
    render(<Controlled onValueChange={onValueChange} />);
    expect(screen.getByText("September 1–30")).toBeDefined();
    expect(screen.getByText(m.comparedWith("August 2–31"))).toBeDefined();

    await userEvent.click(screen.getByRole("radio", { name: "12 months" }));
    expect(onValueChange).toHaveBeenLastCalledWith("12m");
    expect(screen.getByText("October 2025 – September 2026")).toBeDefined();
    expect(screen.getByText(m.comparedWith("October 2024 – September 2025"))).toBeDefined();
  });

  it("an invalid today shows the control without inventing dates", () => {
    const { container } = render(<Period value="7d" today="" onValueChange={() => {}} />);
    expect(container.querySelector("[aria-live]")).toBeNull();
  });
});
