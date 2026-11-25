// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { messages } from "@/messages";
import { stubMatchMedia } from "@/test/match-media";

import { SideMenu } from "./side-menu";

afterEach(cleanup);

function renderMenu(open: boolean, onOpenChange = vi.fn()) {
  stubMatchMedia(false);
  const result = render(
    <SideMenu open={open} onOpenChange={onOpenChange} label="Sections" title={<span>Workbench</span>}>
      <a href="#a">First section</a>
    </SideMenu>,
  );
  return { ...result, onOpenChange };
}

describe("SideMenu", () => {
  it("is a named modal dialog while open", () => {
    renderMenu(true);
    const dialog = screen.getByRole("dialog", { name: "Sections" });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
  });

  it("renders at the end of the body, out of any transformed ancestor", () => {
    stubMatchMedia(false);
    const { container } = render(
      <div style={{ transform: "translateY(0)" }}>
        <SideMenu open onOpenChange={vi.fn()} label="Sections" title={<span>Workbench</span>}>
          <a href="#a">First section</a>
        </SideMenu>
      </div>,
    );
    const dialog = screen.getByRole("dialog", { name: "Sections" });
    expect(container.contains(dialog)).toBe(false);
    expect(dialog.closest("body > *")?.parentElement).toBe(document.body);
  });

  it("closes on Escape and from its close button", async () => {
    const { onOpenChange } = renderMenu(true);
    await userEvent.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenLastCalledWith(false);

    await userEvent.click(screen.getByRole("button", { name: messages.ui.sideMenu.close }));
    expect(onOpenChange).toHaveBeenCalledTimes(2);
  });

  it("stops the page from scrolling while open, and gives it back on close", () => {
    document.body.style.overflow = "auto";
    const { rerender, onOpenChange } = renderMenu(true);
    expect(document.body.style.overflow).toBe("hidden");

    rerender(
      <SideMenu open={false} onOpenChange={onOpenChange} label="Sections" title={<span>Workbench</span>}>
        <a href="#a">First section</a>
      </SideMenu>,
    );
    expect(document.body.style.overflow).toBe("auto");
  });

  it("renders nothing until it is opened", () => {
    renderMenu(false);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
