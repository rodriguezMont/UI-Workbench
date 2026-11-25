// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { messages } from "@/messages";

import { Breadcrumb } from "./breadcrumb";

afterEach(cleanup);

describe("Breadcrumb", () => {
  it("is a named navigation with an ordered list", () => {
    render(<Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Settings" }]} />);
    const nav = screen.getByRole("navigation", { name: messages.ui.breadcrumb.label });
    expect(nav.querySelector("ol")).not.toBeNull();
  });

  it("the last step is the current page, as text", () => {
    render(<Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Settings", href: "/settings" }]} />);
    const current = screen.getByText("Settings");
    expect(current.getAttribute("aria-current")).toBe("page");
    expect(screen.queryByRole("link", { name: "Settings" })).toBeNull();
  });

  it("a step with an address is a link; one without is text", () => {
    render(<Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Guides" }, { label: "Install" }]} />);
    expect(screen.getByRole("link", { name: "Home" }).getAttribute("href")).toBe("/");
    expect(screen.queryByRole("link", { name: "Guides" })).toBeNull();
    expect(screen.getByText("Guides")).toBeDefined();
  });

  it("a router's link gets the label and the text link's styles", () => {
    render(<Breadcrumb items={[{ label: "Docs", link: <a href="/docs" data-router="" /> }, { label: "Install" }]} />);
    const link = screen.getByRole("link", { name: "Docs" });
    expect(link.getAttribute("href")).toBe("/docs");
    expect(link.hasAttribute("data-router")).toBe(true);
    expect(link.className).toContain("underline");
  });
});
