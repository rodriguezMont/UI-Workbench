// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { messages } from "@/messages";

import { TextLink } from "./link";

afterEach(cleanup);

describe("TextLink", () => {
  it("opens an external link in a new tab, keeps the caller's rel, and says so", () => {
    render(
      <TextLink href="https://example.com" external rel="nofollow">
        Docs
      </TextLink>,
    );
    const link = screen.getByRole("link");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("nofollow noopener noreferrer");
    expect(link.textContent).toContain(messages.ui.textLink.opensInNewTab);
  });

  it("leaves an internal link in the same tab, without the notice", () => {
    render(<TextLink href="/about">About</TextLink>);
    const link = screen.getByRole("link", { name: "About" });
    expect(link.hasAttribute("target")).toBe(false);
    expect(link.textContent).toBe("About");
  });

  it("styles a router link through asChild without wrapping it in another anchor", () => {
    render(
      <TextLink asChild>
        <a href="/pricing" data-router-link="">
          Pricing
        </a>
      </TextLink>,
    );
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]!.hasAttribute("data-router-link")).toBe(true);
    expect(links[0]!.className).toContain("underline");
  });
});
