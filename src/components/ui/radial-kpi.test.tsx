// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { messages } from "@/messages";

import { RadialKpi } from "./radial-kpi";

afterEach(cleanup);

const unit = { one: "signup", other: "signups" };

describe("RadialKpi", () => {
  it("is a meter named by its title, with the same value text as the bar", () => {
    render(<RadialKpi title="Monthly signups" description="The goal set for October" value={34} target={45} unit={unit} />);
    const meter = screen.getByRole("meter", { name: "Monthly signups" });
    expect(meter.getAttribute("aria-valuetext")).toBe("34 of 45 signups, 76%; 11 short of the goal");
    expect(screen.getByText("76%")).toBeDefined();
  });

  it("past the goal, the arc fills and a tick marks the goal", () => {
    const { container } = render(<RadialKpi title="Signups" description="Goal" value={60} target={45} unit={unit} />);
    expect(screen.getByText("133%")).toBeDefined();
    expect(container.querySelector("[data-mark]")).not.toBeNull();
  });

  it("says the change and up to three facts", () => {
    render(
      <RadialKpi
        title="Signups"
        description="Goal"
        value={34}
        target={45}
        unit={unit}
        comparison={{ previous: 30, to: "in September" }}
        facts={[
          { label: "Goal", value: 45 },
          { label: "Done", value: 34 },
          { label: "Today", value: 3 },
          { label: "Ignored", value: 1 },
        ]}
      />,
    );
    expect(screen.getByText(messages.ui.stat.up("13%", "in September"))).toBeDefined();
    expect(screen.getAllByRole("term").map((t) => t.textContent)).toEqual(["Goal", "Done", "Today"]);
    expect(within(screen.getAllByRole("term")[1]!.parentElement!).getByRole("definition").textContent).toBe("34");
  });

  it("without a positive goal, renders nothing", () => {
    const { container } = render(<RadialKpi title="Signups" description="Goal" value={3} target={0} unit={unit} />);
    expect(container.innerHTML).toBe("");
  });
});
