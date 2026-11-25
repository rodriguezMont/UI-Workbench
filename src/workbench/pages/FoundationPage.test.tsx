// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { messages } from "@/messages";
import { installDomStubs } from "@/test/dom";

import { FoundationPage } from "./FoundationPage";

const t = messages.workbench.demos;

const renderPage = () =>
  render(
    <MemoryRouter>
      <FoundationPage />
    </MemoryRouter>,
  );

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("foundation measurements", () => {
  beforeEach(() => installDomStubs());

  it("says it is measuring until the element has been read", () => {
    renderPage();
    expect(screen.getAllByText(t.measured.pending, { exact: false }).length).toBeGreaterThan(0);
  });

  it("writes what it reads from the rendered element, not a typed number", () => {
    // An observer that reports right away, as the browser does on `observe`.
    vi.stubGlobal(
      "ResizeObserver",
      class {
        callback: () => void;
        constructor(callback: () => void) {
          this.callback = callback;
        }
        observe() {
          this.callback();
        }
        disconnect() {}
      },
    );
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ width: 12, height: 36 } as DOMRect);
    renderPage();
    // The space step 3 is 3 × 4px: the bar's measured width.
    const step = screen.getByText("3", { selector: "code" }).closest("li")!;
    expect(within(step).getByText("12px")).toBeTruthy();
  });
});

describe("motion", () => {
  beforeEach(() => installDomStubs());

  it("plays and rewinds from a button, so keyboard and touch can see it too", async () => {
    renderPage();
    const group = screen.getByRole("group", { name: t.motion.durations });
    const bars = () => [...group.querySelectorAll(".bg-accent")];
    expect(bars().every((bar) => bar.classList.contains("w-1/4"))).toBe(true);

    await userEvent.click(within(group).getByRole("button", { name: t.motion.play }));
    expect(bars().every((bar) => bar.classList.contains("w-full"))).toBe(true);

    await userEvent.click(within(group).getByRole("button", { name: t.motion.rewind }));
    expect(bars().every((bar) => bar.classList.contains("w-1/4"))).toBe(true);
  });
});
