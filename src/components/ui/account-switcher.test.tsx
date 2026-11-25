// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { messages } from "@/messages";
import { installDomStubs } from "@/test/dom";

import { AccountSwitcher, accountInitials, type Account } from "./account-switcher";

const m = messages.ui.accountSwitcher;

beforeEach(() => installDomStubs());
afterEach(cleanup);

const ACCOUNTS: readonly Account[] = [
  { id: "personal", name: "Jane Doe", subtitle: "jane@example.com" },
  { id: "studio", name: "North Studio", subtitle: "Design team" },
  { id: "labs", name: "North Labs", subtitle: "Research team" },
];

describe("accountInitials — the avatar says what tells the account apart", () => {
  it("one word gives its first two letters; two or more, the first of the first two", () => {
    expect(accountInitials({ name: "Acme" })).toBe("AC");
    expect(accountInitials({ name: "North Studio" })).toBe("NS");
    expect(accountInitials({ name: "North Labs Europe" })).toBe("NL");
  });

  it("an empty name from the database is absence, never a silent avatar", () => {
    expect(accountInitials({ name: "", subtitle: "Design team" })).toBe("DT");
    expect(accountInitials({ name: "  " })).toBe("?");
  });
});

function mount(props: Partial<React.ComponentProps<typeof AccountSwitcher>> = {}) {
  const onSwitch = vi.fn();
  render(<AccountSwitcher accounts={ACCOUNTS} activeId="studio" onSwitch={onSwitch} {...props} />);
  return { onSwitch };
}

describe("AccountSwitcher", () => {
  it("names the trigger after the active account, subtitle included", () => {
    mount();
    expect(screen.getByRole("button", { name: m.current("North Studio, Design team") })).toBeDefined();
  });

  it("lists one row per account, checks the current one, and switches on select", async () => {
    const { onSwitch } = mount();
    await userEvent.click(screen.getByRole("button", { name: /Switch account/ }));

    const items = screen.getAllByRole("menuitem");
    expect(items).toHaveLength(ACCOUNTS.length);
    expect(items[1]!.textContent).toContain("Design team");

    await userEvent.click(screen.getByRole("menuitem", { name: /North Labs/ }));
    expect(onSwitch).toHaveBeenCalledWith("labs");
  });

  it("never guesses: an unknown active account asks for a choice and says which access ended", async () => {
    mount({ activeId: "gone", endedName: "Old Workspace" });
    const trigger = screen.getByRole("button", { name: m.choose });
    await userEvent.click(trigger);
    expect(screen.getByText(m.ended("Old Workspace"))).toBeDefined();
  });

  it("without the ended name, it still explains", async () => {
    mount({ activeId: "gone" });
    await userEvent.click(screen.getByRole("button", { name: m.choose }));
    expect(screen.getByText(m.unavailable)).toBeDefined();
  });

  it("offers the account link and sign out, apart from the accounts", async () => {
    const onSignOut = vi.fn();
    mount({ accountLink: <a href="/account" />, onSignOut });
    await userEvent.click(screen.getByRole("button", { name: /Switch account/ }));

    const link = screen.getByRole("menuitem", { name: m.account });
    expect(link.tagName).toBe("A");
    expect(link.getAttribute("href")).toBe("/account");

    await userEvent.click(screen.getByRole("menuitem", { name: m.signOut }));
    expect(onSignOut).toHaveBeenCalledOnce();
  });

  it("renders nothing without accounts", () => {
    const { container } = render(<AccountSwitcher accounts={[]} activeId="x" onSwitch={vi.fn()} />);
    expect(container.innerHTML).toBe("");
  });
});
