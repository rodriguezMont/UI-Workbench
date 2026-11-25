// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { messages } from "@/messages";

import { Field } from "./field";
import { Fieldset } from "./fieldset";
import { MaskedField } from "./masked-field";
import { PasswordField } from "./password-field";

afterEach(cleanup);

const describedText = (el: HTMLElement) =>
  (el.getAttribute("aria-describedby") ?? "")
    .split(" ")
    .filter(Boolean)
    .map((id) => document.getElementById(id)?.textContent ?? "")
    .join(" | ");

describe("Field", () => {
  it("ties the label, and describes the field with its hint", () => {
    render(<Field label="Email" hint="We never share it." />);
    const input = screen.getByLabelText("Email");
    expect(describedText(input)).toBe("We never share it.");
    expect(input.hasAttribute("aria-invalid")).toBe(false);
  });

  it("replaces the hint with the error, and marks the field invalid", () => {
    render(<Field label="Email" hint="We never share it." error="Add the @ and the domain: name@example.com." />);
    const input = screen.getByLabelText("Email");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(describedText(input)).toBe("Add the @ and the domain: name@example.com.");
    expect(screen.queryByText("We never share it.")).toBeNull();
  });

  it("gives every free-text field a ceiling", () => {
    render(<Field label="Name" />);
    expect(Number(screen.getByLabelText("Name").getAttribute("maxlength"))).toBeGreaterThan(0);
  });

  it("keeps a read-only field out of the Tab order", () => {
    render(<Field label="Account ID" readOnly defaultValue="A-1029" />);
    expect(screen.getByLabelText("Account ID").tabIndex).toBe(-1);
  });

  it("inside a disabled group, points at the group's reason", () => {
    render(
      <Fieldset legend="Shipping" hint="Locked while the order ships." disabled>
        <Field label="Street" />
      </Fieldset>,
    );
    expect(describedText(screen.getByLabelText("Street"))).toContain("Locked while the order ships.");
  });
});

describe("PasswordField", () => {
  it("shows and hides the password with a named toggle", async () => {
    render(<PasswordField label="Password" autoComplete="new-password" />);
    const input = screen.getByLabelText("Password");
    expect(input.getAttribute("type")).toBe("password");

    await userEvent.click(screen.getByRole("button", { name: messages.ui.password.show }));
    expect(input.getAttribute("type")).toBe("text");
    expect(screen.getByRole("button", { name: messages.ui.password.hide }).getAttribute("aria-pressed")).toBe("true");
  });

  it("checks the length requirement as the person types", async () => {
    render(<PasswordField label="Password" autoComplete="new-password" minLength={8} />);
    const input = screen.getByLabelText("Password");
    expect(describedText(input)).toContain(messages.ui.password.notMet);
    await userEvent.type(input, "longenough");
    expect(describedText(input)).toContain(messages.ui.password.met);
  });
});

describe("MaskedField", () => {
  it("formats while typing and reports the formatted value", async () => {
    const values: string[] = [];
    render(<MaskedField label="Phone" mask="phone" onValueChange={(v) => values.push(v)} />);
    const input = screen.getByLabelText("Phone") as HTMLInputElement;
    await userEvent.type(input, "2133734253");
    expect(input.value).toBe("(213) 373-4253");
    expect(values.at(-1)).toBe("(213) 373-4253");
  });

  it("opens the right keyboard for the mask", () => {
    render(<MaskedField label="ZIP code" mask="zip" />);
    const input = screen.getByLabelText("ZIP code");
    expect(input.getAttribute("inputmode")).toBe("numeric");
    expect(input.getAttribute("autocomplete")).toBe("postal-code");
  });
});
