// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { messages } from "@/messages";

import { Switch, useSwitchSave } from "./switch";

afterEach(cleanup);

const m = messages.ui.switch;

const control = (name: string) => screen.getByRole("switch", { name }) as HTMLInputElement;

describe("Switch", () => {
  it("is a switch named by its label", async () => {
    render(<Switch label="Email me replies" />);
    await userEvent.click(screen.getByText("Email me replies"));
    expect(control("Email me replies").checked).toBe(true);
  });

  it("while saving, says so and ignores a second tap without losing focus", async () => {
    const onChange = vi.fn();
    render(<Switch label="Email me replies" saving checked onChange={onChange} />);
    const input = control("Email me replies");
    expect(input.getAttribute("aria-busy")).toBe("true");
    expect(screen.getByText(m.saving)).toBeDefined();

    await userEvent.click(input);
    expect(onChange).not.toHaveBeenCalled();
    expect(input.checked).toBe(true);
    expect(input.disabled).toBe(false);
    expect(document.activeElement).toBe(input);
  });

  it("uncontrolled, a tap while saving does not flip it either", async () => {
    render(<Switch label="Email me replies" saving />);
    await userEvent.click(control("Email me replies"));
    expect(control("Email me replies").checked).toBe(false);
  });
});

function Saved({ save }: { save: (next: boolean) => Promise<void> }) {
  const state = useSwitchSave(false, save);
  return <Switch label="Weekly digest" {...state} />;
}

describe("useSwitchSave", () => {
  it("shows the new position at once and keeps it when the save works", async () => {
    let finish!: () => void;
    const save = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    render(<Saved save={save} />);

    await userEvent.click(control("Weekly digest"));
    expect(save).toHaveBeenCalledWith(true);
    expect(control("Weekly digest").checked).toBe(true);
    expect(screen.getByText(m.saving)).toBeDefined();

    // A second tap while it saves does not start another save.
    await userEvent.click(control("Weekly digest"));
    expect(save).toHaveBeenCalledTimes(1);

    await act(async () => finish());
    expect(control("Weekly digest").checked).toBe(true);
    expect(screen.queryByText(m.saving)).toBeNull();
  });

  it("goes back and says why when the save fails", async () => {
    const save = vi.fn(() => Promise.reject(new Error("offline")));
    render(<Saved save={save} />);

    await userEvent.click(control("Weekly digest"));
    expect(control("Weekly digest").checked).toBe(false);
    expect(screen.getByText(m.saveFailed)).toBeDefined();
    expect(control("Weekly digest").getAttribute("aria-invalid")).toBe("true");
  });
});
