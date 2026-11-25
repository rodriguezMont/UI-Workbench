// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { messages } from "@/messages";

import { CardForm } from "./card-form";

afterEach(cleanup);

const m = messages.ui.cardForm;
const errors = messages.ui.card;

const field = (name: string) => screen.getByRole("textbox", { name }) as HTMLInputElement;

/** A date safely in the future, as MM/YY. */
const nextYear = `12${String((new Date().getFullYear() + 1) % 100).padStart(2, "0")}`;

describe("CardForm", () => {
  it("is a group of four fields with no name, so no form carries them away", () => {
    const { container } = render(<CardForm />);
    expect(screen.getByRole("group", { name: m.legend })).toBeDefined();
    const inputs = container.querySelectorAll("input");
    expect(inputs).toHaveLength(4);
    for (const input of inputs) expect(input.name).toBe("");
  });

  it("groups the number and shows its error only after leaving the field", async () => {
    render(<CardForm />);
    const number = field(m.number);
    await userEvent.type(number, "4111111111111112");
    expect(number.value).toBe("4111 1111 1111 1112");
    expect(screen.queryByText(errors.numberInvalid)).toBeNull();

    await userEvent.tab();
    expect(screen.getByText(errors.numberInvalid)).toBeDefined();
    expect(number.getAttribute("aria-invalid")).toBe("true");
  });

  it("an American Express number asks for four digits on the front", async () => {
    render(<CardForm />);
    await userEvent.type(field(m.number), "378282246310005");
    expect(field(m.number).value).toBe("3782 822463 10005");
    expect(field(m.cvv).maxLength).toBe(4);
    expect(screen.getByText(m.cvvFront)).toBeDefined();
  });

  it("reports the card as complete only when all four are right", async () => {
    const onChange = vi.fn();
    render(<CardForm onChange={onChange} />);
    await userEvent.type(field(m.number), "4111111111111111");
    await userEvent.type(field(m.name), "JANE Q DOE");
    await userEvent.type(field(m.expiry), nextYear);
    await userEvent.type(field(m.cvv), "12");
    expect(onChange.mock.lastCall?.[0].complete).toBe(false);

    await userEvent.type(field(m.cvv), "3");
    expect(onChange).toHaveBeenLastCalledWith({
      number: "4111111111111111",
      name: "JANE Q DOE",
      expiry: `12/${nextYear.slice(2)}`,
      cvv: "123",
      complete: true,
    });
  });

  it("the issuer's answer belongs to the group, and disabled locks every field", () => {
    render(<CardForm error="The card was declined. Try another one." disabled />);
    expect(screen.getByText("The card was declined. Try another one.")).toBeDefined();
    expect([m.number, m.name, m.expiry, m.cvv].every((name) => field(name).disabled)).toBe(true);
  });
});
