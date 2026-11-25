// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { messages } from "@/messages";
import { installDomStubs } from "@/test/dom";

import { TimePicker } from "./time-picker";

beforeEach(() => installDomStubs());
afterEach(cleanup);

/** The option labels, with the narrow no-break space newer ICU uses made plain. */
const options = () => screen.getAllByRole("option").map((o) => o.textContent!.replace(/\s/g, " "));
const field = () => screen.getByRole("combobox", { name: /Pickup time/ });

describe("TimePicker", () => {
  it("shows 12-hour times and submits HH:mm", async () => {
    const onValueChange = vi.fn();
    const { container } = render(<TimePicker label="Pickup time" name="pickup" step={60} min="11:00" max="14:00" onValueChange={onValueChange} />);
    expect(field().textContent).toContain(messages.ui.timePicker.placeholder);

    await userEvent.click(field());
    expect(options()).toEqual(["11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM"]);

    await userEvent.click(screen.getByRole("option", { name: /^1:00\sPM$/ }));
    expect(onValueChange).toHaveBeenLastCalledWith("13:00");
    expect(container.querySelector<HTMLInputElement>('input[type="hidden"][name="pickup"]')?.value).toBe("13:00");
    expect(field().textContent).toMatch(/1:00\sPM/);
  });

  it("every half hour, all day, by default", async () => {
    render(<TimePicker label="Pickup time" />);
    await userEvent.click(field());
    const all = options();
    expect(all).toHaveLength(48);
    expect([all[0], all[1], all.at(-1)]).toEqual(["12:00 AM", "12:30 AM", "11:30 PM"]);
  });

  it("keeps an off-step value in its place, and opens on it", async () => {
    render(<TimePicker label="Pickup time" step={30} min="10:00" max="11:00" defaultValue="10:10" />);
    expect(field().textContent).toMatch(/10:10\sAM/);

    await userEvent.click(field());
    expect(options()).toEqual(["10:00 AM", "10:10 AM", "10:30 AM", "11:00 AM"]);
    expect(screen.getByRole("option", { name: /^10:10\sAM$/ }).getAttribute("aria-selected")).toBe("true");
  });

  it("drops a kept value that is not a time", async () => {
    render(<TimePicker label="Pickup time" step={30} min="10:00" max="10:30" defaultValue="25:00" />);
    await userEvent.click(field());
    expect(options()).toEqual(["10:00 AM", "10:30 AM"]);
  });

  it("typing a number jumps to the first time starting with it", async () => {
    const onValueChange = vi.fn();
    render(<TimePicker label="Pickup time" step={60} onValueChange={onValueChange} />);
    field().focus();
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("4{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith("04:00");
  });

  it("shows the error like any select", () => {
    render(<TimePicker label="Pickup time" error="Choose a pickup time." />);
    expect(field().getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByText("Choose a pickup time.")).toBeDefined();
  });
});
