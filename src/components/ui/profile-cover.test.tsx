// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { messages } from "@/messages";
import { installDomStubs } from "@/test/dom";

import { ProfileCover, initialsOf } from "./profile-cover";

const m = messages.ui.profileCover;

beforeEach(() => {
  installDomStubs();
  URL.createObjectURL = vi.fn(() => "blob:new");
  URL.revokeObjectURL = vi.fn();
});
afterEach(cleanup);

describe("initialsOf", () => {
  it("takes the first letter of the first two words", () => {
    expect(initialsOf("northwind trading co")).toBe("NT");
    expect(initialsOf("  Ada  ")).toBe("A");
  });
});

describe("ProfileCover", () => {
  it("for a visitor: the logo, the name as a heading, and no edit buttons", () => {
    render(<ProfileCover name="Northwind Studio" subtitle="Design · Portland" coverUrl="cover.png" logoUrl="logo.png" />);
    expect(screen.getByRole("region", { name: m.region("Northwind Studio") })).toBeDefined();
    expect(screen.getByRole("img", { name: m.logoOf("Northwind Studio") })).toBeDefined();
    expect(screen.getByRole("heading", { level: 2, name: "Northwind Studio" })).toBeDefined();
    expect(screen.getByText("Design · Portland")).toBeDefined();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("without a logo, the initials; editable without images, direct add buttons", () => {
    render(<ProfileCover name="Northwind Studio" editable headingLevel={3} />);
    expect(screen.getByText("NS")).toBeDefined();
    expect(screen.getByRole("heading", { level: 3 })).toBeDefined();
    expect(screen.getByRole("button", { name: m.addCover })).toBeDefined();
    expect(screen.getByRole("button", { name: m.addLogo })).toBeDefined();
  });

  it("removing the cover reports null and sends focus to the add button", async () => {
    const onCoverChange = vi.fn();
    render(<ProfileCover name="Northwind Studio" editable coverUrl="cover.png" onCoverChange={onCoverChange} />);

    screen.getByRole("button", { name: m.editCover }).focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.click(await screen.findByRole("menuitem", { name: m.removeCover }));

    expect(onCoverChange).toHaveBeenLastCalledWith(null);
    const add = screen.getByRole("button", { name: m.addCover });
    await vi.waitFor(() => expect(document.activeElement).toBe(add));
  });

  it("a refused file says why, out loud", async () => {
    const { container } = render(<ProfileCover name="Northwind Studio" editable />);
    const [coverInput] = container.querySelectorAll<HTMLInputElement>('input[type="file"]');

    await userEvent.setup({ applyAccept: false }).upload(coverInput!, new File(["x"], "cover.gif", { type: "image/gif" }));
    expect(screen.getByRole("alert").textContent).toMatch(/isn't an image that can be used/);
  });
});
