// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Mail, Phone } from "lucide-react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HONEYPOT_FIELD } from "@/lib/honeypot";
import { messages } from "@/messages";

import { Footer, type FooterContact, type FooterGroup } from "./footer";

afterEach(cleanup);

const m = messages.ui.footer;

const GROUPS: readonly FooterGroup[] = [
  {
    title: "Product",
    links: [
      { id: "pricing", label: "Pricing", href: "/pricing" },
      { id: "changelog", label: "Changelog", href: "/changelog" },
    ],
  },
  { title: "Company", links: [{ id: "about", label: "About", link: <a href="/about" data-router="" />, href: "/about" }] },
];

const CONTACTS: readonly FooterContact[] = [
  { id: "email", label: "Email us", href: "mailto:hello@example.com", icon: Mail },
  { id: "call", label: "Call us", href: "tel:+15555550100", icon: Phone, external: true },
];

describe("Footer", () => {
  it("renders each group as a named navigation with its links", () => {
    render(<Footer groups={GROUPS} />);
    const product = screen.getByRole("navigation", { name: "Product" });
    expect(product.querySelectorAll("a")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Pricing" }).getAttribute("href")).toBe("/pricing");
  });

  it("a router's link gets the label inside it", () => {
    render(<Footer groups={GROUPS} />);
    const about = screen.getByRole("link", { name: "About" });
    expect(about.hasAttribute("data-router")).toBe(true);
  });

  it("intercepts a link by id when asked, and navigates otherwise", async () => {
    const onAction = vi.fn((_id: string, e: React.SyntheticEvent) => e.preventDefault());
    render(<Footer groups={GROUPS} legal={[{ id: "terms", label: "Terms", href: "/terms" }]} onAction={onAction} />);
    await userEvent.click(screen.getByRole("link", { name: "Terms" }));
    expect(onAction).toHaveBeenCalledWith("terms", expect.anything());
    expect(screen.getByRole("navigation", { name: m.legal })).toBeDefined();
  });

  it("writes the copyright range, collapsing a single year", () => {
    const { rerender } = render(<Footer copyright={{ holder: "Example Inc", since: 2020, year: 2030 }} />);
    expect(screen.getByText(m.copyright("2020–2030", "Example Inc"))).toBeDefined();
    rerender(<Footer copyright={{ holder: "Example Inc", since: 2030, year: 2030 }} />);
    expect(screen.getByText(m.copyright("2030", "Example Inc"))).toBeDefined();
  });

  it("names the contact icons, and says when one opens a new tab", () => {
    render(<Footer contacts={CONTACTS} />);
    expect(screen.getByRole("link", { name: "Email us" }).getAttribute("target")).toBeNull();
    const call = screen.getByRole("link", { name: `Call us ${messages.ui.textLink.opensInNewTab}` });
    expect(call.getAttribute("target")).toBe("_blank");
    expect(call.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("the newsletter posts, carries a honeypot, and goes through onAction", async () => {
    const onAction = vi.fn((_id: string, e: React.SyntheticEvent) => e.preventDefault());
    const { container } = render(
      <Footer newsletter={{ action: "/newsletter", title: "Product news, monthly.", consent: "Unsubscribe anytime." }} onAction={onAction} />,
    );
    const form = container.querySelector("form")!;
    expect(form.getAttribute("method")).toBe("post");
    expect(form.getAttribute("action")).toBe("/newsletter");
    expect(container.querySelector(`input[name="${HONEYPOT_FIELD}"]`)?.getAttribute("tabindex")).toBe("-1");
    expect(screen.getByText("Unsubscribe anytime.")).toBeDefined();

    await userEvent.type(screen.getByRole("textbox", { name: m.email }), "jane@example.com");
    await userEvent.click(screen.getByRole("button", { name: m.subscribe }));
    expect(onAction).toHaveBeenCalledWith("newsletter", expect.anything());
  });

  it("shows the newsletter error and disables the button while sending", () => {
    render(<Footer newsletter={{ action: "/newsletter", title: "News", error: "Add the domain.", sending: true }} />);
    expect(screen.getByText("Add the domain.")).toBeDefined();
    expect((screen.getByRole("button", { name: m.subscribe }) as HTMLButtonElement).disabled).toBe(true);
  });
});
