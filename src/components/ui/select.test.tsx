// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { messages } from "@/messages";
import { installDomStubs } from "@/test/dom";

import { Select, toggleValue } from "./select";

beforeEach(() => installDomStubs());
afterEach(cleanup);

const OPTIONS = [
  { value: "oil", label: "Oil change" },
  { value: "brakes", label: "Brakes" },
  { value: "tires", label: "Tires" },
];

describe("toggleValue, in a multiple select", () => {
  it("turns a value on and off", () => {
    expect(toggleValue(OPTIONS, [], "brakes")).toEqual(["brakes"]);
    expect(toggleValue(OPTIONS, ["brakes"], "brakes")).toEqual([]);
  });

  it("follows the options' order, not the clicks'", () => {
    expect(toggleValue(OPTIONS, ["tires"], "oil")).toEqual(["oil", "tires"]);
  });

  it("keeps a saved value the list no longer offers", () => {
    expect(toggleValue(OPTIONS, ["legacy", "brakes"], "oil")).toEqual(["oil", "brakes", "legacy"]);
    expect(toggleValue(OPTIONS, ["legacy", "brakes"], "brakes")).toEqual(["legacy"]);
  });
});

describe("Select", () => {
  it("opens from the keyboard, moves with the arrows and chooses with Enter", async () => {
    const onValueChange = vi.fn();
    render(<Select label="Service" options={OPTIONS} onValueChange={onValueChange} />);

    const field = screen.getByRole("combobox", { name: /Service/ });
    field.focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(field.getAttribute("aria-expanded")).toBe("true");

    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith("brakes");
    expect(field.textContent).toContain("Brakes");
  });

  it("submits the value through a hidden input with the name", () => {
    const { container } = render(<Select label="Service" name="service" options={OPTIONS} defaultValue="tires" />);
    const hidden = container.querySelector<HTMLInputElement>('input[type="hidden"][name="service"]');
    expect(hidden?.value).toBe("tires");
  });

  it("summarizes a multiple selection on the closed field", () => {
    render(<Select multiple label="Services" options={OPTIONS} defaultValue={["oil", "tires"]} />);
    expect(screen.getByRole("combobox", { name: /Services/ }).textContent).toContain(messages.ui.select.summary("Oil change", 1));
  });

  it("filters with search, ignoring accents and case", async () => {
    render(
      <Select
        label="City"
        searchable
        options={[
          { value: "sp", label: "São Paulo" },
          { value: "sd", label: "San Diego" },
        ]}
      />,
    );
    await userEvent.click(screen.getByRole("combobox", { name: /City/ }));
    await userEvent.type(screen.getByRole("combobox", { name: messages.ui.select.searchIn("City") }), "SAO");
    const options = screen.getAllByRole("option");
    expect(options.map((o) => o.textContent)).toEqual(["São Paulo"]);
  });
});
