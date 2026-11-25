// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { IMAGE_FORMATS } from "@/lib/image-formats";
import { messages } from "@/messages";
import { installDomStubs } from "@/test/dom";

import { Button } from "./button";
import { ImageCropper, useImagePicker } from "./image-cropper";

const m = messages.ui.imageCropper;

beforeEach(() => {
  installDomStubs();
  URL.createObjectURL = vi.fn(() => "blob:original");
  URL.revokeObjectURL = vi.fn();
});
afterEach(cleanup);

const user = () => userEvent.setup({ applyAccept: false });

function PickerDemo({ onCropped = () => {} }: { onCropped?: (file: Blob) => void }) {
  const picker = useImagePicker({ format: IMAGE_FORMATS.photo, onCropped });
  return (
    <>
      <Button onClick={picker.pick}>Pick</Button>
      {picker.error ? <p role="alert">{picker.error}</p> : null}
      {picker.picker}
    </>
  );
}

describe("ImageCropper", () => {
  it("opens as a dialog named after the format, with every control a pinch has", () => {
    render(<ImageCropper open onOpenChange={() => {}} src="blob:x" format={IMAGE_FORMATS.cover} onConfirm={() => {}} />);
    expect(screen.getByRole("dialog", { name: m.title("Cover") })).toBeDefined();
    expect(screen.getByRole("slider", { name: m.zoom })).toBeDefined();
    for (const name of [m.rotateLeft, m.rotateRight, m.reset]) expect(screen.getByRole("button", { name })).toBeDefined();
  });

  it("cannot apply before the crop area is known", () => {
    render(<ImageCropper open onOpenChange={() => {}} src="blob:x" format={IMAGE_FORMATS.logo} onConfirm={() => {}} />);
    expect((screen.getByRole("button", { name: m.apply }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("useImagePicker", () => {
  it("an accepted image opens the cropper; closing gives the original's address back", async () => {
    const { container } = render(<PickerDemo />);
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    expect(input.getAttribute("aria-label")).toBe(m.choose("Photo"));

    await user().upload(input, new File(["x"], "photo.jpg", { type: "image/jpeg" }));
    expect(screen.getByRole("dialog", { name: m.title("Photo") })).toBeDefined();

    await user().keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:original");
  });

  it("a file that is not an image never opens the cropper and says why", async () => {
    const { container } = render(<PickerDemo />);
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;

    await user().upload(input, new File(["GIF89a"], "anim.gif", { type: "image/gif" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("alert").textContent).toMatch(/JPG, PNG, or WebP/);
  });
});
