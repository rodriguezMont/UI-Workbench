// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { messages } from "@/messages";

import { PhotoUpload } from "./photo-upload";

const m = messages.ui.photoUpload;

beforeEach(() => {
  // jsdom has no object URLs.
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
});
afterEach(cleanup);

const user = () => userEvent.setup({ applyAccept: false });
const png = new File([new Uint8Array(300 * 1024)], "portrait.png", { type: "image/png" });

describe("PhotoUpload", () => {
  it("shows the chosen photo with its name and size, and hands the file over", async () => {
    const onFileChange = vi.fn();
    const { container } = render(<PhotoUpload label="Profile photo" onFileChange={onFileChange} />);
    const input = screen.getByLabelText(`Profile photo ${m.choose}`) as HTMLInputElement;

    await user().upload(input, png);
    expect(container.querySelector("img")?.getAttribute("src")).toBe("blob:preview");
    expect(screen.getByText("portrait.png")).toBeDefined();
    expect(screen.getByText("· 300 KB")).toBeDefined();
    expect(screen.getByText(m.replace)).toBeDefined();
    expect(onFileChange).toHaveBeenLastCalledWith(png);
  });

  it("refuses what is not an image, with the reason in place of the hint", async () => {
    render(<PhotoUpload label="Profile photo" hint="A square photo works best." />);
    const input = screen.getByLabelText(`Profile photo ${m.choose}`) as HTMLInputElement;

    await user().upload(input, new File(["%PDF"], "scan.pdf", { type: "application/pdf" }));
    expect(screen.getByText(/isn't an image that can be used/)).toBeDefined();
    expect(screen.queryByText("A square photo works best.")).toBeNull();
    expect(input.getAttribute("aria-invalid")).toBe("true");
  });

  it("removing clears the preview, reports null and returns focus to the picker", async () => {
    const onFileChange = vi.fn();
    const { container } = render(<PhotoUpload label="Profile photo" onFileChange={onFileChange} />);
    const input = screen.getByLabelText(`Profile photo ${m.choose}`) as HTMLInputElement;
    await user().upload(input, png);

    await user().click(screen.getByRole("button", { name: m.remove }));
    expect(container.querySelector("img")).toBeNull();
    expect(onFileChange).toHaveBeenLastCalledWith(null);
    expect(document.activeElement).toBe(input);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview");
  });
});
