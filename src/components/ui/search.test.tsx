// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { messages } from "@/messages";
import { installDomStubs } from "@/test/dom";

import { Search } from "./search";

const m = messages.ui.search;

beforeEach(() => installDomStubs());
afterEach(cleanup);

const TERMS = ["Invoices", "Invoice templates", "Integrations", "Café menu", "Reports"];

function mount(props: Partial<React.ComponentProps<typeof Search>> = {}) {
  const onSubmit = vi.fn();
  render(<Search suggestions={TERMS} onSubmit={onSubmit} {...props} />);
  return { onSubmit, field: screen.getByRole("combobox", { name: m.label }) as HTMLInputElement };
}

const options = () => screen.queryAllByRole("option").map((o) => o.textContent);

describe("Search", () => {
  it("is a GET form in a search landmark, so it works without script", () => {
    render(<Search suggestions={TERMS} action="/search" name="query" />);
    const form = screen.getByRole("search") as HTMLFormElement;
    expect(form.getAttribute("method")).toBe("get");
    expect(form.getAttribute("action")).toBe("/search");
    expect((screen.getByRole("combobox") as HTMLInputElement).name).toBe("query");
  });

  it("suggests ignoring accents and case, and the list stays closed until there is a match", async () => {
    const { field } = mount();
    expect(field.getAttribute("aria-expanded")).toBe("false");

    await userEvent.type(field, "cafe");
    expect(options()).toEqual(["Café menu"]);
    expect(field.getAttribute("aria-expanded")).toBe("true");

    await userEvent.clear(field);
    await userEvent.type(field, "zzz");
    expect(field.getAttribute("aria-expanded")).toBe("false");
  });

  it("the arrows move the active option and wrap; focus never leaves the field", async () => {
    const { field } = mount();
    await userEvent.type(field, "inv");
    expect(options()).toEqual(["Invoices", "Invoice templates"]);

    await userEvent.keyboard("{ArrowUp}");
    const last = screen.getAllByRole("option")[1]!;
    expect(field.getAttribute("aria-activedescendant")).toBe(last.id);
    expect(last.getAttribute("aria-selected")).toBe("true");

    await userEvent.keyboard("{ArrowDown}");
    expect(field.getAttribute("aria-activedescendant")).toBe(screen.getAllByRole("option")[0]!.id);
    expect(document.activeElement).toBe(field);
  });

  it("Enter on a suggestion fills the field and submits it", async () => {
    const { field, onSubmit } = mount();
    await userEvent.type(field, "inv");
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    expect(onSubmit).toHaveBeenCalledWith("Invoice templates");
    expect(field.value).toBe("Invoice templates");
  });

  it("a click on a suggestion submits it", async () => {
    const { field, onSubmit } = mount();
    await userEvent.type(field, "rep");
    await userEvent.click(screen.getByRole("option", { name: "Reports" }));
    expect(onSubmit).toHaveBeenCalledWith("Reports");
  });

  it("Escape closes the list without clearing what was typed", async () => {
    const { field } = mount();
    await userEvent.type(field, "inv");
    await userEvent.keyboard("{Escape}");
    expect(field.getAttribute("aria-expanded")).toBe("false");
    expect(field.value).toBe("inv");
  });

  it("Enter with nothing highlighted submits the typed term", async () => {
    const { field, onSubmit } = mount();
    await userEvent.type(field, "quarterly{Enter}");
    expect(onSubmit).toHaveBeenCalledWith("quarterly");
  });

  it("a trigger replaces the field and opens the full screen, where the typed term can be searched as is", async () => {
    const onSubmit = vi.fn();
    render(<Search suggestions={TERMS} onSubmit={onSubmit} context="In Workspace A." trigger={<button type="button">Open search</button>} />);
    expect(screen.queryByRole("combobox")).toBeNull();

    const trigger = screen.getByRole("button", { name: "Open search" });
    await userEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("dialog", { name: m.label })).toBeDefined();
    expect(screen.getByText("In Workspace A.")).toBeDefined();

    const field = screen.getByRole("searchbox", { name: m.label });
    expect(document.activeElement).toBe(field);
    await userEvent.type(field, "inv");
    expect(screen.getByRole("button", { name: "Invoices" })).toBeDefined();

    await userEvent.click(screen.getByRole("button", { name: m.searchFor("inv") }));
    expect(onSubmit).toHaveBeenCalledWith("inv");
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
