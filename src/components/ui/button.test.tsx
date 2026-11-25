// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Button } from "./button";

afterEach(cleanup);

describe("Button", () => {
  it("defaults to type=button, so it never submits a form by accident", () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).toHaveProperty("type", "button");
  });

  it("keeps an explicit type", () => {
    render(<Button type="submit">Send</Button>);
    expect(screen.getByRole("button", { name: "Send" })).toHaveProperty("type", "submit");
  });

  it("renders its child with asChild, styled, without a type attribute", () => {
    render(
      <Button asChild variant="secondary">
        <a href="/next">Next</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Next" });
    expect(link.className).toContain("border-border-strong");
    expect(link.hasAttribute("type")).toBe(false);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("lets className override a default instead of adding to it", () => {
    render(<Button className="px-8">Wide</Button>);
    const classes = screen.getByRole("button", { name: "Wide" }).className.split(" ");
    expect(classes).toContain("px-8");
    expect(classes).not.toContain("px-4");
  });
});
