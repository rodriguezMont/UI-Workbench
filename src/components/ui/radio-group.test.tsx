// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Radio, RadioGroup } from "./radio-group";

afterEach(cleanup);

const radio = (name: string) => screen.getByRole("radio", { name }) as HTMLInputElement;

function Contact(props: Partial<React.ComponentProps<typeof RadioGroup>>) {
  return (
    <RadioGroup legend="Contact method" name="contact" {...props}>
      <Radio value="email" label="Email" />
      <Radio value="phone" label="Phone" description="Weekdays, 9 to 5" />
      <Radio value="mail" label="Mail" disabled description="Not available in your region" />
    </RadioGroup>
  );
}

describe("RadioGroup", () => {
  it("is a group named by its legend, with one name for all options", () => {
    render(<Contact />);
    expect(screen.getByRole("group", { name: "Contact method" })).toBeDefined();
    expect(screen.getAllByRole("radio").every((el) => (el as HTMLInputElement).name === "contact")).toBe(true);
  });

  it("uncontrolled, the browser keeps the choice and reports it", async () => {
    const onValueChange = vi.fn();
    render(<Contact defaultValue="email" onValueChange={onValueChange} />);
    expect(radio("Email").checked).toBe(true);
    await userEvent.click(screen.getByText("Phone"));
    expect(radio("Phone").checked).toBe(true);
    expect(onValueChange).toHaveBeenLastCalledWith("phone");
  });

  it("controlled, it shows the value it receives", () => {
    const { rerender } = render(<Contact value="email" onValueChange={() => {}} />);
    expect(radio("Email").checked).toBe(true);
    rerender(<Contact value="phone" onValueChange={() => {}} />);
    expect(radio("Phone").checked).toBe(true);
  });

  it("a disabled option says why in its description", () => {
    render(<Contact />);
    const mail = radio("Mail");
    expect(mail.disabled).toBe(true);
    expect(document.getElementById(mail.getAttribute("aria-describedby")!)?.textContent).toBe("Not available in your region");
  });

  it("the group's error marks every option invalid", () => {
    render(<Contact error="Choose a contact method." />);
    expect(screen.getAllByRole("radio").every((el) => el.getAttribute("aria-invalid") === "true")).toBe(true);
  });

  it("a radio outside a group fails loudly", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Radio value="x" label="Loose" />)).toThrow(/inside <RadioGroup>/);
  });
});
