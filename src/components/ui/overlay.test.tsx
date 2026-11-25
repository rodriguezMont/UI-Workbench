// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { stubMatchMedia } from "@/test/match-media";

import { Button } from "./button";
import { Overlay, OverlayContent, OverlayTrigger } from "./overlay";

afterEach(cleanup);

function Example({ kind, onDelete }: { kind?: "alert"; onDelete?: () => void }) {
  return (
    <Overlay kind={kind}>
      <OverlayTrigger>
        <Button>Delete project</Button>
      </OverlayTrigger>
      <OverlayContent
        title="Delete this project?"
        description="It cannot be undone."
        actions={[
          { label: "Delete", tone: "destructive", onSelect: onDelete },
          { label: "Cancel", tone: "secondary", cancel: true },
        ]}
      />
    </Overlay>
  );
}

describe("Overlay on wide screens (dialog frame)", () => {
  it("opens a dialog named by its title and runs the action before closing", async () => {
    stubMatchMedia(true);
    const onDelete = vi.fn();
    render(<Example onDelete={onDelete} />);

    await userEvent.click(screen.getByRole("button", { name: "Delete project" }));
    const dialog = screen.getByRole("dialog", { name: "Delete this project?" });
    expect(dialog).toBeTruthy();

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("returns focus to the trigger that opened it", async () => {
    stubMatchMedia(true);
    render(<Example />);
    const trigger = screen.getByRole("button", { name: "Delete project" });

    await userEvent.click(trigger);
    await userEvent.keyboard("{Escape}");

    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it("as an alert, starts focus on the cancel action, never on the destructive one", async () => {
    stubMatchMedia(true);
    render(<Example kind="alert" />);

    await userEvent.click(screen.getByRole("button", { name: "Delete project" }));

    expect(screen.getByRole("alertdialog", { name: "Delete this project?" })).toBeTruthy();
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("button", { name: "Cancel" })));
  });
});
