// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Meter } from "./meter";

afterEach(cleanup);

const unit = { one: "signup", other: "signups" };

describe("Meter", () => {
  it("is a named meter that says the value, the goal and the phrase at once", () => {
    render(<Meter label="Signups in October" value={96} target={120} unit={unit} />);
    const meter = screen.getByRole("meter", { name: "Signups in October" });
    expect(meter.getAttribute("aria-valuenow")).toBe("96");
    expect(meter.getAttribute("aria-valuemax")).toBe("120");
    expect(meter.getAttribute("aria-valuetext")).toBe("96 of 120 signups, 80%; 24 short of the goal");
    expect(screen.getByText("80%")).toBeDefined();
  });

  it("past the goal, the bar fills and a mark shows where the goal sat", () => {
    const { container } = render(<Meter label="Signups" value={132} target={120} unit={unit} />);
    expect(screen.getByRole("meter").getAttribute("aria-valuemax")).toBe("132");
    expect(container.querySelector("[data-mark]")).not.toBeNull();
    expect(screen.getByText("12 above the goal")).toBeDefined();
  });

  it("a limit changes only the phrase", () => {
    render(<Meter label="Seats" value={8} target={10} unit={{ one: "seat", other: "seats" }} kind="limit" />);
    expect(screen.getByText("2 left")).toBeDefined();
  });

  it("without a positive reference, renders nothing", () => {
    const { container } = render(<Meter label="Signups" value={10} target={0} unit={unit} />);
    expect(container.innerHTML).toBe("");
  });
});
