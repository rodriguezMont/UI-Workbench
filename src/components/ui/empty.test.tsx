// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { messages } from "@/messages";

import { Empty } from "./empty";

afterEach(cleanup);

describe("Empty", () => {
  it("offers suggestions as buttons and waits for the person to choose", async () => {
    const onSuggestion = vi.fn();
    render(<Empty title="No results for “tyres”" suggestions={["tires", "wheels"]} onSuggestion={onSuggestion} />);

    expect(screen.getByText(messages.ui.empty.didYouMean)).toBeTruthy();
    expect(onSuggestion).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "wheels" }));
    expect(onSuggestion).toHaveBeenCalledExactlyOnceWith("wheels");
  });

  it("shows no suggestion block when there are none", () => {
    render(<Empty title="Nothing here yet" />);
    expect(screen.queryByText(messages.ui.empty.didYouMean)).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
