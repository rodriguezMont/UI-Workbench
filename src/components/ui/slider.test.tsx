// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { messages } from "@/messages";
import { installDomStubs } from "@/test/dom";

import { Slider } from "./slider";

// Radix measures the track to place the thumb; jsdom has no layout and no
// `ResizeObserver`. The keyboard does not depend on the measurement.
beforeEach(() => installDomStubs());
afterEach(cleanup);

const m = messages.ui.slider;

describe("Slider", () => {
  it("arrows move one step, Home and End go to the ends", async () => {
    const onValueChange = vi.fn();
    render(<Slider label="Zoom" min={1} max={4} step={0.5} defaultValue={2} onValueChange={onValueChange} />);
    const thumb = screen.getByRole("slider", { name: "Zoom" });

    thumb.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onValueChange).toHaveBeenLastCalledWith(2.5);
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(onValueChange).toHaveBeenLastCalledWith(1.5);
    await userEvent.keyboard("{End}");
    expect(onValueChange).toHaveBeenLastCalledWith(4);
    await userEvent.keyboard("{Home}");
    expect(onValueChange).toHaveBeenLastCalledWith(1);
  });

  it("the thumb speaks the value in the reader's unit", () => {
    render(<Slider label="Zoom" min={1} max={4} step={0.01} value={1.25} formatValue={(v) => `${Math.round(v * 100)}%`} />);
    expect(screen.getByRole("slider").getAttribute("aria-valuetext")).toBe("125%");
  });

  it("with the label hidden, listeners still get the name", () => {
    render(<Slider label="Zoom" hiddenLabel showValue={false} buttons={false} value={2} min={1} max={4} />);
    expect(screen.getByRole("slider", { name: "Zoom" })).toBeDefined();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("a button moves its own step, larger than the drag's, and commits", async () => {
    const onValueChange = vi.fn();
    const onValueCommit = vi.fn();
    render(
      <Slider label="Zoom" min={1} max={4} step={0.01} buttonStep={0.25} value={1} onValueChange={onValueChange} onValueCommit={onValueCommit} />,
    );
    await userEvent.click(screen.getByRole("button", { name: m.increase("Zoom") }));
    expect(onValueChange).toHaveBeenCalledWith(1.25);
    expect(onValueCommit).toHaveBeenCalledWith(1.25);
  });

  it("at an end, that side's button turns off", () => {
    render(<Slider label="Zoom" min={1} max={4} value={1} />);
    expect((screen.getByRole("button", { name: m.decrease("Zoom") }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: m.increase("Zoom") }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("disabled, the thumb says so and points at the hint", () => {
    render(<Slider label="Radius" disabled hint="Set a location first." />);
    const thumb = screen.getByRole("slider", { name: "Radius" });
    expect(thumb.getAttribute("aria-disabled")).toBe("true");
    expect(document.getElementById(thumb.getAttribute("aria-describedby")!)?.textContent).toBe("Set a location first.");
  });
});
