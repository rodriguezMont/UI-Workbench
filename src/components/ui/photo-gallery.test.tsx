// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { messages } from "@/messages";
import { installDomStubs } from "@/test/dom";

import { type GalleryPhoto, PhotoGallery } from "./photo-gallery";

const m = messages.ui.photoGallery;

beforeEach(() => installDomStubs());
afterEach(cleanup);

const PHOTOS: GalleryPhoto[] = [
  { id: "a", url: "a.png", alt: "The front desk" },
  { id: "b", url: "b.png" },
  { id: "c", url: "c.png" },
];

const alts = () => screen.getAllByRole("img").map((img) => img.getAttribute("alt"));

async function openMenu(n: number) {
  screen.getByRole("button", { name: m.actions(n) }).focus();
  await userEvent.keyboard("{Enter}");
  return screen.findByRole("menu");
}

describe("PhotoGallery", () => {
  it("for a visitor, an empty gallery renders nothing", () => {
    const { container } = render(<PhotoGallery label="Office" />);
    expect(container.innerHTML).toBe("");
  });

  it("names every photo — by its own text, or by place and gallery", () => {
    render(<PhotoGallery label="Office" defaultPhotos={PHOTOS} />);
    expect(screen.getByRole("heading", { name: "Office" })).toBeDefined();
    expect(alts()).toEqual(["The front desk", m.photoOf(2, "Office"), m.photoOf(3, "Office")]);
    // A visitor gets no handles and no menus.
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("editable: the count, the main badge, a handle per photo and the add tile", () => {
    render(<PhotoGallery label="Office" defaultPhotos={PHOTOS} max={4} editable />);
    expect(screen.getByText(m.count(3, 4))).toBeDefined();
    expect(screen.getByText(m.main)).toBeDefined();
    expect(screen.getAllByRole("button", { name: /^Move photo/ })).toHaveLength(3);
    expect(screen.getByRole("button", { name: m.add })).toBeDefined();
  });

  it("make main takes the photo to the front and says so", async () => {
    const onPhotosChange = vi.fn();
    render(<PhotoGallery label="Office" defaultPhotos={PHOTOS} editable onPhotosChange={onPhotosChange} />);

    // By keyboard, as a keyboard user would: the menu opens on its first item.
    const menu = await openMenu(3);
    expect(document.activeElement).toBe(within(menu).getByRole("menuitem", { name: m.makeMain }));
    await userEvent.keyboard("{Enter}");

    expect(onPhotosChange.mock.lastCall?.[0].map((p: GalleryPhoto) => p.id)).toEqual(["c", "a", "b"]);
    expect(screen.getByText(m.nowMain(3))).toBeDefined();
    await vi.waitFor(() => expect(document.activeElement).toBe(screen.getByRole("button", { name: m.move(1) })));
  });

  it("the main photo's menu only removes; removing updates the count", async () => {
    render(<PhotoGallery label="Office" defaultPhotos={PHOTOS} max={3} editable />);
    // Full: no add tile, and the reason instead.
    expect(screen.queryByRole("button", { name: m.add })).toBeNull();
    expect(screen.getByText(m.full(3))).toBeDefined();

    const menu = await openMenu(1);
    expect(within(menu).queryByRole("menuitem", { name: m.makeMain })).toBeNull();
    await userEvent.click(within(menu).getByRole("menuitem", { name: m.remove }));

    expect(screen.getByText(m.count(2, 3))).toBeDefined();
    expect(screen.getByText(m.removed(1, 2, 3))).toBeDefined();
    expect(screen.getByRole("button", { name: m.add })).toBeDefined();
  });
});
