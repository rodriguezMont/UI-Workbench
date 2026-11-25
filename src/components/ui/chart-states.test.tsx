// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { messages } from "@/messages";

import { ChartState } from "./chart-states";

afterEach(cleanup);

const m = messages.ui.chartState;

describe("ChartState", () => {
  it("loading keeps the title and speaks through the waiting region", () => {
    render(<ChartState title="Visitors per day" shape="plot" state="loading" />);
    expect(screen.getByText("Visitors per day")).toBeDefined();
    const region = screen.getByRole("status", { name: m.loading("Visitors per day") });
    expect(region.getAttribute("aria-busy")).toBe("true");
  });

  it("bars reserve the rows the caller expects", () => {
    const { container } = render(<ChartState title="Signups by region" shape="bars" state="loading" rows={6} />);
    expect(container.querySelectorAll('[role="status"] > div > div')).toHaveLength(6);
  });

  it("empty states the fact and why, and may offer a way forward", () => {
    render(
      <ChartState
        title="Signups per month"
        shape="plot"
        state="empty"
        message="No signups in October"
        description="Signups show here as soon as someone creates an account."
      >
        <button type="button">Show 12 months</button>
      </ChartState>,
    );
    expect(screen.getByText("No signups in October")).toBeDefined();
    expect(screen.getByText("Signups show here as soon as someone creates an account.")).toBeDefined();
    expect(screen.getByRole("button", { name: "Show 12 months" })).toBeDefined();
  });

  it("an error is a human error with a retry, under the same title", async () => {
    const onRetry = vi.fn();
    render(
      <ChartState
        title="Revenue by region"
        shape="bars"
        state="error"
        description="The report service did not answer. Your data is safe."
        onRetry={onRetry}
      />,
    );
    const alert = screen.getByRole("alert");
    expect(within(alert).getByText(m.errorTitle)).toBeDefined();
    await userEvent.click(within(alert).getByRole("button", { name: messages.ui.error.retry }));
    expect(onRetry).toHaveBeenCalledOnce();
    expect(screen.getByText("Revenue by region")).toBeDefined();
  });
});
