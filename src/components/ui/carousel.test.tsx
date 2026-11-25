// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { messages } from "@/messages";
import { stubMatchMedia } from "@/test/match-media";

import { Carousel, MAX_DOTS, type CarouselImage } from "./carousel";

const m = messages.ui.carousel;

// jsdom has no layout and no element `scrollTo`: the strip's scroll is
// recorded instead of performed.
const scrollTo = vi.fn();
beforeEach(() => {
  stubMatchMedia(false);
  scrollTo.mockReset();
  Element.prototype.scrollTo = scrollTo as unknown as Element["scrollTo"];
});
afterEach(cleanup);

const images = (count: number): CarouselImage[] =>
  Array.from({ length: count }, (_, i) => ({ id: `img-${i + 1}`, src: `/img-${i + 1}.png`, alt: `Picture ${i + 1}` }));

const announced = () => document.querySelector("[aria-live]")?.textContent;
const previous = () => screen.getByRole("button", { name: m.previous });
const next = () => screen.getByRole("button", { name: m.next });

describe("Carousel", () => {
  it("renders nothing without images", () => {
    const { container } = render(<Carousel images={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("one image shows without arrows, dots or a Tab stop", () => {
    render(<Carousel images={images(1)} label="Gallery" />);
    expect(screen.getByRole("img", { name: "Picture 1" })).toBeDefined();
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByRole("region", { name: "Gallery" }).querySelector("[tabindex]")).toBeNull();
  });

  it("the arrows move one image and fade at the ends without losing focus", async () => {
    render(<Carousel images={images(3)} />);
    expect(previous().getAttribute("aria-disabled")).toBe("true");

    await userEvent.click(next());
    expect(announced()).toBe(m.image(2, 3));
    await userEvent.click(next());
    expect(announced()).toBe(m.image(3, 3));
    expect(next().getAttribute("aria-disabled")).toBe("true");
    expect(document.activeElement).toBe(next());

    // A faded arrow stays clickable for focus, but goes nowhere.
    await userEvent.click(next());
    expect(announced()).toBe(m.image(3, 3));
    await userEvent.click(previous());
    expect(announced()).toBe(m.image(2, 3));
  });

  it("the keyboard moves through the strip: arrows, Home and End", async () => {
    render(<Carousel images={images(5)} label="Gallery" />);
    const strip = screen.getByLabelText(m.keyboardHint("Gallery"));
    strip.focus();

    await userEvent.keyboard("{ArrowRight}");
    expect(announced()).toBe(m.image(2, 5));
    await userEvent.keyboard("{End}");
    expect(announced()).toBe(m.image(5, 5));
    await userEvent.keyboard("{ArrowRight}");
    expect(announced()).toBe(m.image(5, 5));
    await userEvent.keyboard("{Home}");
    expect(announced()).toBe(m.image(1, 5));
  });

  it("a dot is a button that goes to its image and marks the current one", async () => {
    render(<Carousel images={images(4)} />);
    const third = screen.getByRole("button", { name: m.image(3, 4) });
    await userEvent.click(third);
    expect(third.getAttribute("aria-current")).toBe("true");
    expect(screen.getByRole("button", { name: m.image(1, 4) }).getAttribute("aria-current")).toBeNull();
  });

  it(`past ${MAX_DOTS} images, a counter replaces the dots`, async () => {
    render(<Carousel images={images(MAX_DOTS + 5)} />);
    const total = MAX_DOTS + 5;
    expect(screen.queryByRole("group", { name: m.choose })).toBeNull();
    expect(screen.getByText(m.position(1, total))).toBeDefined();
    await userEvent.click(next());
    expect(screen.getByText(m.position(2, total))).toBeDefined();
  });

  it("slides smoothly, and jumps when motion is reduced", async () => {
    const { unmount } = render(<Carousel images={images(3)} />);
    await userEvent.click(next());
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ behavior: "smooth" }));
    unmount();

    stubMatchMedia(true);
    render(<Carousel images={images(3)} />);
    await userEvent.click(next());
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ behavior: "auto" }));
  });

  it("a swipe moves the index: it is read back from the scroll position", async () => {
    render(<Carousel images={images(4)} label="Gallery" />);
    const strip = screen.getByLabelText(m.keyboardHint("Gallery"));
    Object.defineProperty(strip, "clientWidth", { configurable: true, value: 300 });
    strip.scrollLeft = 600;

    fireEvent.scroll(strip);
    await act(() => new Promise((resolve) => requestAnimationFrame(resolve)));
    expect(announced()).toBe(m.image(3, 4));
  });

  it("only the first image loads up front", () => {
    render(<Carousel images={images(3)} />);
    const loading = screen.getAllByRole("img").map((img) => img.getAttribute("loading"));
    expect(loading).toEqual(["eager", "lazy", "lazy"]);
  });

  it("an image without its own text alternative gets one from the label and position", () => {
    render(<Carousel images={[{ id: "a", src: "/a.png" }, { id: "b", src: "/b.png" }]} label="Gallery" />);
    expect(screen.getByRole("img", { name: m.fallbackAlt("Gallery", 2) })).toBeDefined();
  });

  it("a list that shrinks under the current image brings the index back inside", async () => {
    const { rerender } = render(<Carousel images={images(4)} />);
    await userEvent.click(screen.getByRole("button", { name: m.image(4, 4) }));
    rerender(<Carousel images={images(2)} />);
    expect(announced()).toBe(m.image(2, 2));
    expect(next().getAttribute("aria-disabled")).toBe("true");
  });
});
