// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { dismissToast, toast, Toaster } from "./toast";

/** jsdom has no `matchMedia`: answer the overlay query with a fixed width. */
function stubWidth(wide: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: wide,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}

const pushed: number[] = [];
const push = (id: number) => {
  pushed.push(id);
  return id;
};

beforeEach(() => vi.useFakeTimers());

afterEach(() => {
  // Empty the module-level queue between tests.
  act(() => {
    pushed.splice(0).forEach(dismissToast);
    vi.runAllTimers();
  });
  cleanup();
  vi.useRealTimers();
});

describe("toast", () => {
  it("shows queued toasts as cards on wide screens", () => {
    stubWidth(true);
    render(<Toaster />);
    act(() => {
      push(toast.success("Saved"));
      push(toast.error("Couldn't save", { description: "Check your connection." }));
    });
    expect(screen.getByText("Saved")).toBeTruthy();
    expect(screen.getByText("Couldn't save")).toBeTruthy();
    expect(screen.getByText("Check your connection.")).toBeTruthy();
  });

  it("shows one banner at a time on narrow screens", () => {
    stubWidth(false);
    render(<Toaster />);
    act(() => {
      push(toast("First"));
      push(toast("Second"));
    });
    expect(screen.getByText("First")).toBeTruthy();
    expect(screen.queryByText("Second")).toBeNull();
  });

  it("on narrow screens, the next banner waits for the previous one to finish leaving", () => {
    stubWidth(false);
    render(<Toaster />);
    let first = 0;
    act(() => {
      first = push(toast("First"));
      push(toast("Second"));
    });
    // The dismissed toast stays in the queue during its exit animation, so
    // the next one does not overlap it.
    act(() => dismissToast(first));
    expect(screen.queryByText("Second")).toBeNull();
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByText("Second")).toBeTruthy();
  });
});
