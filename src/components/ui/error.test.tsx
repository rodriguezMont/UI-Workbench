// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { messages } from "@/messages";

import { ErrorState } from "./error";

const m = messages.ui.error;

function stubClipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ErrorState", () => {
  it("interrupts as an alert, and the showcase mode can turn that off", () => {
    const { rerender } = render(<ErrorState description="The list did not load." />);
    expect(screen.getByRole("alert").textContent).toContain(m.title);
    rerender(<ErrorState description="The list did not load." alive={false} />);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("copies the code without ever printing it", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    stubClipboard(writeText);
    render(<ErrorState description="The list did not load." code="req_123" />);

    expect(screen.queryByText("req_123")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: m.copyCode }));

    expect(writeText).toHaveBeenCalledWith("req_123");
    expect(screen.getByText(m.copied)).toBeTruthy();
    expect(screen.queryByText("req_123")).toBeNull();
  });

  it("reveals the code only when copying fails", async () => {
    stubClipboard(() => Promise.reject(new Error("denied")));
    render(<ErrorState description="The list did not load." code="req_456" />);

    await userEvent.click(screen.getByRole("button", { name: m.copyCode }));

    expect(screen.getByText(m.copyFailed)).toBeTruthy();
    expect(screen.getByText("req_456")).toBeTruthy();
  });

  it("does not carry a stale notice over to a new code", async () => {
    stubClipboard(() => Promise.resolve());
    const { rerender } = render(<ErrorState description="The list did not load." code="req_old" />);
    await userEvent.click(screen.getByRole("button", { name: m.copyCode }));
    expect(screen.getByText(m.copied)).toBeTruthy();

    rerender(<ErrorState description="The list did not load." code="req_new" />);
    expect(screen.queryByText(m.copied)).toBeNull();
  });
});
