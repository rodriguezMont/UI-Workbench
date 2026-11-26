// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { trackRouteLoad, useRouteLoading } from "./route-loading";

afterEach(cleanup);

function Probe() {
  return <p>{useRouteLoading() ? "loading" : "idle"}</p>;
}

describe("route loading", () => {
  it("is on while a section's import is pending, and off once it settles", async () => {
    let finish!: () => void;
    render(<Probe />);
    expect(screen.getByText("idle")).toBeDefined();

    let tracked!: Promise<void>;
    act(() => {
      tracked = trackRouteLoad(new Promise<void>((resolve) => (finish = resolve)));
    });
    expect(screen.getByText("loading")).toBeDefined();

    await act(async () => {
      finish();
      await tracked;
    });
    expect(screen.getByText("idle")).toBeDefined();
  });

  it("a failed import turns it off too", async () => {
    render(<Probe />);
    let tracked!: Promise<void>;
    act(() => {
      tracked = trackRouteLoad(Promise.reject(new Error("offline")));
    });
    await act(async () => {
      await tracked.catch(() => {});
    });
    expect(screen.getByText("idle")).toBeDefined();
  });
});
