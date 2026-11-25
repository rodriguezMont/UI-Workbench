// @vitest-environment jsdom
import { useState } from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { messages } from "@/messages";
import { installDomStubs } from "@/test/dom";

import { DatePicker } from "./date-picker";

beforeEach(() => installDomStubs());
afterEach(cleanup);

const m = messages.ui.datePicker;

const field = () => screen.getByRole("textbox", { name: "Start date" }) as HTMLInputElement;
const hidden = (container: HTMLElement) => container.querySelector<HTMLInputElement>('input[type="hidden"][name="start"]');
const openCalendar = () => userEvent.click(screen.getByRole("button", { name: m.openCalendar("Start date") }));

describe("DatePicker, typed", () => {
  it("masks MM/DD/YYYY on screen and submits yyyy-mm-dd", async () => {
    const onValueChange = vi.fn();
    const { container } = render(<DatePicker label="Start date" name="start" onValueChange={onValueChange} />);
    expect(field().placeholder).toBe(m.placeholder);

    await userEvent.type(field(), "09172026");
    expect(field().value).toBe("09/17/2026");
    expect(onValueChange).toHaveBeenLastCalledWith("2026-09-17");
    expect(hidden(container)?.value).toBe("2026-09-17");
  });

  it("shows the error only after leaving the field, and submits nothing meanwhile", async () => {
    const { container } = render(<DatePicker label="Start date" name="start" />);
    await userEvent.type(field(), "0917");
    expect(screen.queryByText(m.incomplete)).toBeNull();
    expect(hidden(container)?.value).toBe("");

    await userEvent.tab(); // to the calendar button: still typing
    expect(screen.queryByText(m.incomplete)).toBeNull();
    await userEvent.tab(); // out of the picker: done
    expect(screen.getByText(m.incomplete)).toBeDefined();
    expect(field().getAttribute("aria-invalid")).toBe("true");
  });

  it("says when the day does not exist, or falls out of range", async () => {
    render(<DatePicker label="Start date" min="2026-09-01" />);
    await userEvent.type(field(), "02312026");
    field().blur();
    expect(await screen.findByText(m.doesNotExist("02/31/2026"))).toBeDefined();

    await userEvent.clear(field());
    await userEvent.type(field(), "08312026");
    expect(screen.getByText(m.tooEarly("09/01/2026"))).toBeDefined();
  });

  it("the caller's error wins over its own", async () => {
    render(<DatePicker label="Start date" error="Pick a start date." />);
    await userEvent.type(field(), "13");
    field().blur();
    expect(screen.getByText("Pick a start date.")).toBeDefined();
    expect(screen.queryByText(m.incomplete)).toBeNull();
  });

  it("a controlled reset rewrites the text, but an incomplete date is not erased", async () => {
    function Controlled() {
      const [value, setValue] = useState("2026-09-17");
      return (
        <>
          <DatePicker label="Start date" value={value} onValueChange={setValue} />
          <button type="button" onClick={() => setValue("2027-01-02")}>
            Prefill
          </button>
        </>
      );
    }
    render(<Controlled />);
    expect(field().value).toBe("09/17/2026");

    await userEvent.clear(field());
    await userEvent.type(field(), "1225");
    expect(field().value).toBe("12/25");

    await userEvent.click(screen.getByRole("button", { name: "Prefill" }));
    expect(field().value).toBe("01/02/2027");
  });
});

describe("DatePicker, picked", () => {
  it("opens on the selected day, weeks start on Sunday, and a click writes the field", async () => {
    const onValueChange = vi.fn();
    render(<DatePicker label="Start date" defaultValue="2026-09-17" onValueChange={onValueChange} />);
    await openCalendar();

    const calendar = screen.getByRole("dialog", { name: m.calendar("Start date") });
    const grid = within(calendar).getByRole("grid", { name: "September 2026" });
    // The header row is hidden from screen readers (each day button says its
    // weekday), so it is read from the markup.
    const headers = [...grid.querySelectorAll("th")].map((h) => h.textContent);
    expect(headers).toEqual(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
    expect(within(grid).getAllByRole("row")[0]!.textContent).toBe("303112345");

    const selected = within(grid).getByRole("button", { name: /^Thursday, September 17, 2026, selected$/ });
    expect(document.activeElement).toBe(selected);

    await userEvent.click(within(grid).getByRole("button", { name: /^Friday, September 25, 2026$/ }));
    expect(field().value).toBe("09/25/2026");
    expect(onValueChange).toHaveBeenLastCalledWith("2026-09-25");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("the title opens the months and the years; Escape goes back one level", async () => {
    render(<DatePicker label="Start date" defaultValue="2026-09-17" />);
    await openCalendar();

    await userEvent.click(screen.getByRole("button", { name: m.chooseMonth("September 2026") }));
    const months = screen.getByRole("group", { name: m.monthsOf(2026) });
    expect(within(months).getByRole("button", { name: "September" }).getAttribute("aria-pressed")).toBe("true");

    await userEvent.click(screen.getByRole("button", { name: m.chooseYear("2026") }));
    const years = screen.getByRole("group", { name: m.yearsOf("2016–2027") });
    await userEvent.click(within(years).getByRole("button", { name: "2019" }));
    // A year goes down to its months, keeping the month in view.
    await userEvent.click(within(screen.getByRole("group", { name: m.monthsOf(2019) })).getByRole("button", { name: "March" }));
    expect(screen.getByRole("grid", { name: "March 2019" })).toBeDefined();

    await userEvent.click(screen.getByRole("button", { name: m.chooseMonth("March 2019") }));
    await userEvent.keyboard("{Escape}");
    // Back on the days, still open.
    expect(screen.getByRole("grid", { name: "March 2019" })).toBeDefined();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("days, months and years out of range are locked, and the arrows stop at the edge", async () => {
    render(<DatePicker label="Start date" defaultValue="2026-09-17" min="2026-09-10" max="2026-10-20" />);
    await openCalendar();

    const day = (name: RegExp) => screen.getByRole("button", { name }) as HTMLButtonElement;
    expect(day(/^Wednesday, September 9, 2026$/).disabled).toBe(true);
    expect(day(/^Thursday, September 10, 2026$/).disabled).toBe(false);
    expect(screen.getByRole("button", { name: m.previousMonth }).getAttribute("aria-disabled")).toBe("true");
    expect(screen.getByRole("button", { name: m.nextMonth }).getAttribute("aria-disabled")).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: m.chooseMonth("September 2026") }));
    const months = screen.getByRole("group", { name: m.monthsOf(2026) });
    expect(within(months).getByRole("button", { name: "August" }).getAttribute("aria-disabled")).toBe("true");
    expect(within(months).getByRole("button", { name: "October" }).getAttribute("aria-disabled")).toBeNull();
  });

  it("offers Today only when today fits the bounds", async () => {
    const { unmount } = render(<DatePicker label="Start date" />);
    await openCalendar();
    expect(screen.getByRole("button", { name: m.today })).toBeDefined();
    unmount();

    render(<DatePicker label="Start date" max="2000-01-01" />);
    await openCalendar();
    expect(screen.queryByRole("button", { name: m.today })).toBeNull();
  });

  it("disabled or read-only, the calendar does not open", () => {
    render(<DatePicker label="Start date" defaultValue="2026-09-17" readOnly />);
    expect((screen.getByRole("button", { name: m.openCalendar("Start date") }) as HTMLButtonElement).disabled).toBe(true);
  });
});
