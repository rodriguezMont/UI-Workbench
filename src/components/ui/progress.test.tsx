// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { messages } from "@/messages";

import { PageSpinner, ProgressBar, RouteProgress } from "./progress";

afterEach(cleanup);

describe("ProgressBar", () => {
  it("reports a clamped percentage with its label", () => {
    const { rerender } = render(<ProgressBar value={0.456} label="Uploading report.pdf" />);
    const bar = screen.getByRole("progressbar", { name: "Uploading report.pdf" });
    expect(bar.getAttribute("aria-valuenow")).toBe("46");

    rerender(<ProgressBar value={3} label="Uploading report.pdf" />);
    expect(bar.getAttribute("aria-valuenow")).toBe("100");

    rerender(<ProgressBar value={Number.NaN} label="Uploading report.pdf" />);
    expect(bar.getAttribute("aria-valuenow")).toBe("0");
  });
});

describe("PageSpinner", () => {
  it("always says what is happening", () => {
    render(<PageSpinner label="Loading your dashboard" />);
    expect(screen.getByRole("status").textContent).toBe("Loading your dashboard");
  });
});

describe("RouteProgress", () => {
  it("announces the navigation only while it is active", () => {
    const { rerender } = render(<RouteProgress active={false} />);
    const status = screen.getByRole("status");
    expect(status.textContent).toBe("");

    rerender(<RouteProgress active />);
    expect(status.textContent).toBe(messages.ui.progress.loadingPage);

    rerender(<RouteProgress active={false} />);
    expect(status.textContent).toBe("");
  });
});
