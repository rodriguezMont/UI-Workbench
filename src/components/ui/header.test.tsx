// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { messages } from "@/messages";
import { installDomStubs } from "@/test/dom";

import { Header } from "./header";

beforeEach(() => installDomStubs());
afterEach(() => {
  cleanup();
  setScroll(0);
});

/** jsdom does not scroll: the position is set by hand. */
function setScroll(y: number) {
  Object.defineProperty(window, "scrollY", { value: y, configurable: true, writable: true });
}

const home = messages.ui.header.home(messages.ui.brand.name);

describe("Header", () => {
  it("puts the logo in a plain home link by default", () => {
    render(<Header />);
    const link = screen.getByRole("link", { name: home });
    expect(link.getAttribute("href")).toBe("/");
  });

  it("puts the logo inside the link it is given — a router's, through asChild", () => {
    render(<Header homeLink={<a href="/app" data-router="" />} />);
    const link = screen.getByRole("link", { name: home });
    expect(link.getAttribute("href")).toBe("/app");
    expect(link.hasAttribute("data-router")).toBe(true);
    expect(link.querySelector("svg")).not.toBeNull();
  });

  it("without search props there is no search", () => {
    render(<Header />);
    expect(screen.queryByRole("search")).toBeNull();
    expect(screen.queryByRole("button", { name: messages.ui.header.openSearch })).toBeNull();
  });

  it("with search props: a field for wide screens and a magnifier for phones", () => {
    render(<Header search={{ suggestions: ["Reports"], action: "/search" }} />);
    expect(screen.getByRole("search")).toBeDefined();
    const trigger = screen.getByRole("button", { name: messages.ui.header.openSearch });
    expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
  });

  it("renders the actions and the account slot", () => {
    render(<Header actions={<button type="button">Help</button>} account={<button type="button">Account</button>} />);
    expect(screen.getByRole("button", { name: "Help" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Account" })).toBeDefined();
  });

  it("over a dark panel it reads dark at the top, and follows the page once scrolled", () => {
    const { container } = render(<Header overlay />);
    const header = container.querySelector("header")!;
    expect(header.getAttribute("data-theme")).toBe("dark");

    act(() => {
      setScroll(200);
      window.dispatchEvent(new Event("scroll"));
    });
    expect(header.hasAttribute("data-theme")).toBe(false);
  });

  it("forceDark keeps the dark scheme regardless of scroll", () => {
    const { container } = render(<Header forceDark />);
    expect(container.querySelector("header")!.getAttribute("data-theme")).toBe("dark");
  });
});
