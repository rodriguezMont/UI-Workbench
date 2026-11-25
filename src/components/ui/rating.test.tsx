// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { messages } from "@/messages";

import { Rating } from "./rating";
import { RatingInput } from "./rating-input";

afterEach(cleanup);

const m = messages.ui;

describe("Rating", () => {
  it("with no reviews, renders nothing", () => {
    const { container } = render(<Rating value={0} count={0} />);
    expect(container.innerHTML).toBe("");
  });

  it("is one image with a name: score, out of how many, and the count", () => {
    render(<Rating value={4.26} count={1280} />);
    expect(screen.getByRole("img", { name: "Rated 4.3 out of 5, 1,280 reviews" })).toBeDefined();
    expect(screen.getByText("(1,280 reviews)")).toBeDefined();
  });

  it("says review in the singular for one", () => {
    render(<Rating value={5} count={1} />);
    expect(screen.getByRole("img", { name: "Rated 5.0 out of 5, 1 review" })).toBeDefined();
  });

  it("clamps the score and fills the row to the shown decimal", () => {
    const { container } = render(<Rating value={7} count={3} />);
    expect(screen.getByRole("img").getAttribute("aria-label")).toContain("5.0 out of 5");
    expect(container.querySelector<HTMLElement>("[style]")?.style.width).toBe("100%");
  });

  it("compact keeps the count for listeners, not on screen", () => {
    render(<Rating value={4.3} count={128} variant="compact" />);
    expect(screen.getByRole("img", { name: "Rated 4.3 out of 5, 128 reviews" })).toBeDefined();
    expect(screen.queryByText(/\(128/)).toBeNull();
  });
});

describe("RatingInput", () => {
  it("five radios in a group, each named with a word", async () => {
    const onValueChange = vi.fn();
    render(<RatingInput legend="Your rating" name="score" onValueChange={onValueChange} />);
    expect(screen.getByRole("group", { name: "Your rating" })).toBeDefined();
    expect(screen.getAllByRole("radio")).toHaveLength(5);

    await userEvent.click(screen.getByRole("radio", { name: m.ratingInput.star(3, 5, "Okay") }));
    expect(onValueChange).toHaveBeenLastCalledWith(3);
    expect(screen.getByText("Okay")).toBeDefined();
  });

  it("with nothing chosen, says so", () => {
    render(<RatingInput legend="Your rating" name="score" />);
    expect(screen.getByText(m.ratingInput.none)).toBeDefined();
  });

  it("already rated: read-only with the value submitted, and change brings the radios back focused", async () => {
    const { container } = render(<RatingInput legend="Your rating" name="score" defaultValue={4} submittedNote="Sent on Nov 12" />);
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
    expect(screen.getByRole("img", { name: m.ratingInput.summary("Your rating", 4, 5, "Good") })).toBeDefined();
    expect(container.querySelector<HTMLInputElement>('input[type="hidden"][name="score"]')?.value).toBe("4");

    await userEvent.click(screen.getByRole("button", { name: m.ratingInput.change }));
    const four = screen.getByRole("radio", { name: m.ratingInput.star(4, 5, "Good") }) as HTMLInputElement;
    expect(four.checked).toBe(true);
    expect(document.activeElement).toBe(four);
  });

  it("the group's error marks the stars invalid", () => {
    render(<RatingInput legend="Your rating" name="score" error="Choose a rating to send." />);
    expect(screen.getAllByRole("radio").every((el) => el.getAttribute("aria-invalid") === "true")).toBe(true);
  });
});
