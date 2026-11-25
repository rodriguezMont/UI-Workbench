// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Bell } from "lucide-react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Checkbox } from "./checkbox";
import { CheckboxCard } from "./checkbox-card";
import { Fieldset } from "./fieldset";

afterEach(cleanup);

const box = (name: RegExp | string) => screen.getByRole("checkbox", { name }) as HTMLInputElement;

describe("Checkbox", () => {
  it("toggles from anywhere on the label", async () => {
    render(<Checkbox label="Weekly digest" />);
    await userEvent.click(screen.getByText("Weekly digest"));
    expect(box("Weekly digest").checked).toBe(true);
  });

  it("a link inside the label opens and does not check", async () => {
    const onClick = vi.fn((e: React.MouseEvent) => e.preventDefault());
    render(
      <Checkbox
        label={
          <>
            I accept the{" "}
            <a href="/terms" onClick={onClick}>
              terms
            </a>
          </>
        }
      />,
    );
    await userEvent.click(screen.getByRole("link", { name: "terms" }));
    expect(onClick).toHaveBeenCalled();
    expect(box(/I accept/).checked).toBe(false);
  });

  it("keeps the description out of the name and in the description", () => {
    render(<Checkbox label="Gift wrap" description="Wrapped in recycled paper" />);
    const input = box("Gift wrap");
    const describedBy = input.getAttribute("aria-describedby")!.split(" ");
    expect(describedBy.map((id) => document.getElementById(id)?.textContent)).toContain("Wrapped in recycled paper");
  });

  it("the error replaces the hint and marks the box invalid", () => {
    render(<Checkbox label="Terms" hint="Required to continue" error="Accept the terms to continue." />);
    const input = box("Terms");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(screen.queryByText("Required to continue")).toBeNull();
    const ids = input.getAttribute("aria-describedby")!.split(" ");
    expect(ids.map((id) => document.getElementById(id)?.textContent)).toContain("Accept the terms to continue.");
  });

  it("shows the third state, and keeps it after a click while the prop says so", async () => {
    render(<Checkbox label="All notifications" indeterminate />);
    const input = box("All notifications");
    expect(input.indeterminate).toBe(true);
    await userEvent.click(input);
    expect(input.indeterminate).toBe(true);
  });

  it("forwards the ref to the input", () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<Checkbox label="Remember me" ref={ref} />);
    expect(ref.current).toBe(box("Remember me"));
  });

  it("inside a disabled group, points at the group's reason", () => {
    render(
      <Fieldset legend="Alerts" hint="Locked by your admin." disabled>
        <Checkbox label="Push" />
      </Fieldset>,
    );
    const input = box("Push");
    // A disabled `fieldset` locks the input without its `disabled` property.
    expect(input.matches(":disabled")).toBe(true);
    const ids = input.getAttribute("aria-describedby")!.split(" ");
    expect(ids.map((id) => document.getElementById(id)?.textContent)).toContain("Locked by your admin.");
  });
});

describe("CheckboxCard", () => {
  it("the whole card toggles, named by its title and described by its line", async () => {
    render(
      <Fieldset legend="Add-ons">
        <CheckboxCard label="Priority support" description="Replies within an hour" icon={Bell} name="addons" value="support" />
      </Fieldset>,
    );
    const input = box("Priority support");
    await userEvent.click(screen.getByText("Replies within an hour"));
    expect(input.checked).toBe(true);
    expect(input.name).toBe("addons");
    expect(document.getElementById(input.getAttribute("aria-describedby")!)?.textContent).toBe("Replies within an hour");
  });

  it("is invalid when the group has an error", () => {
    render(
      <Fieldset legend="Add-ons" error="Choose at least one add-on.">
        <CheckboxCard label="Backups" />
      </Fieldset>,
    );
    expect(box("Backups").getAttribute("aria-invalid")).toBe("true");
  });
});
