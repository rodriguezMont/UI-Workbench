// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { messages } from "@/messages";

import { MapPlaceholder } from "./map-placeholder";

afterEach(cleanup);

const m = messages.ui.mapPlaceholder;

describe("MapPlaceholder", () => {
  it("is one image whose name says it is not a real map", () => {
    render(<MapPlaceholder />);
    expect(screen.getByRole("img", { name: m.label })).toBeDefined();
  });

  it("keeps the illustrative caption in view", () => {
    render(<MapPlaceholder />);
    expect(screen.getByText(m.caption).tagName).toBe("FIGCAPTION");
  });

  it("hides the drawing from assistive technology", () => {
    const { container } = render(<MapPlaceholder />);
    const drawings = [...container.querySelectorAll("svg")];
    expect(drawings.length).toBeGreaterThan(0);
    for (const svg of drawings) expect(svg.closest("[aria-hidden]")).not.toBeNull();
  });

  it("takes its name and caption from props, and merges the class", () => {
    render(<MapPlaceholder label="Map preview, not to scale" caption="Preview" className="max-w-sm" />);
    const figure = screen.getByRole("img", { name: "Map preview, not to scale" });
    expect(screen.getByText("Preview")).toBeDefined();
    expect(figure.className).toContain("max-w-sm");
    expect(figure.className).toContain("rounded-lg");
  });
});
