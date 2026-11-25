// @vitest-environment jsdom
import { useState } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { messages } from "@/messages";
import { installDomStubs } from "@/test/dom";

import { DateTimePicker } from "./date-time-picker";

beforeEach(() => installDomStubs());
afterEach(cleanup);

const m = messages.ui.dateTimePicker;

const date = () => screen.getByRole("textbox", { name: m.date }) as HTMLInputElement;
const time = () => screen.getByRole("combobox", { name: new RegExp(m.time) });
const hidden = (container: HTMLElement) => container.querySelector<HTMLInputElement>('input[type="hidden"][name="starts"]');

describe("DateTimePicker", () => {
  it("is a group named by its label, with a date and a time inside", () => {
    render(<DateTimePicker label="Meeting starts" />);
    const group = screen.getByRole("group", { name: "Meeting starts" });
    expect(group.contains(date())).toBe(true);
    expect(group.contains(time())).toBe(true);
  });

  it("submits yyyy-mm-ddTHH:mm only once both parts are set", async () => {
    const onValueChange = vi.fn();
    const { container } = render(<DateTimePicker label="Meeting starts" name="starts" step={60} onValueChange={onValueChange} />);

    await userEvent.type(date(), "09172026");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(hidden(container)?.value).toBe("");

    await userEvent.click(time());
    await userEvent.click(screen.getByRole("option", { name: /^2:00\sPM$/ }));
    expect(onValueChange).toHaveBeenLastCalledWith("2026-09-17T14:00");
    expect(hidden(container)?.value).toBe("2026-09-17T14:00");

    // Breaking the date empties the whole value.
    await userEvent.type(date(), "{Backspace}");
    expect(onValueChange).toHaveBeenLastCalledWith("");
    expect(hidden(container)?.value).toBe("");
  });

  it("splits a default value into its parts", () => {
    render(<DateTimePicker label="Meeting starts" defaultValue="2026-12-03T09:30" />);
    expect(date().value).toBe("12/03/2026");
    expect(time().textContent).toMatch(/9:30\sAM/);
  });

  it("controlled: one part set does not erase the other, and clearing from outside empties both", async () => {
    function Controlled() {
      const [value, setValue] = useState("");
      return (
        <>
          <DateTimePicker label="Meeting starts" value={value} onValueChange={setValue} />
          <button type="button" onClick={() => setValue("2027-01-02T08:00")}>
            Prefill
          </button>
          <button type="button" onClick={() => setValue("")}>
            Reset
          </button>
        </>
      );
    }
    render(<Controlled />);

    await userEvent.type(date(), "09172026");
    // The outside value is still empty, and the typed date stays.
    expect(date().value).toBe("09/17/2026");

    await userEvent.click(screen.getByRole("button", { name: "Prefill" }));
    expect(date().value).toBe("01/02/2027");
    expect(time().textContent).toMatch(/8:00\sAM/);

    await userEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(date().value).toBe("");
    expect(time().textContent).toContain(messages.ui.timePicker.placeholder);
  });

  it("the group's error belongs to the group; disabled locks both parts", () => {
    const { unmount } = render(<DateTimePicker label="Meeting ends" error="The end must come after the start." />);
    const group = screen.getByRole("group", { name: "Meeting ends" });
    const message = screen.getByText("The end must come after the start.");
    expect(group.getAttribute("aria-describedby")).toBe(message.closest("p")!.id);
    unmount();

    render(<DateTimePicker label="Publish at" hint="Locked while in review." disabled />);
    expect(date().disabled).toBe(true);
    expect((time() as HTMLButtonElement).disabled).toBe(true);
  });
});
