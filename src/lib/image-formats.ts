import { messages } from "@/messages";

import { describeAccept, formatBytes } from "./file-check";

/**
 * The image formats: aspect ratio, output size and the shape of the crop.
 * **One place**: the cropper, the previews and, when there is one, the server
 * that reprocesses uploads all read from here.
 *
 * **The shape is for display, not for the file.** The logo is saved square
 * and the screen shows it in a circle: storing the circle on a transparent
 * background would tie the file to one screen's drawing, and a logo also
 * appears in square places (a share card, a list).
 */

const m = messages.ui.imageFormats;

export type ImageFormatId = "cover" | "logo" | "photo";

export type ImageFormat = {
  id: ImageFormatId;
  /** The format's name on screen: "Cover". */
  label: string;
  /** Width divided by height. */
  aspect: number;
  /** The size of the file the crop produces. */
  width: number;
  height: number;
  /** How the crop is drawn while framing. */
  shape: "rect" | "round";
};

export const IMAGE_FORMATS: Record<ImageFormatId, ImageFormat> = {
  // A wide band across the top of a profile.
  cover: { id: "cover", label: m.cover, aspect: 4, width: 1600, height: 400, shape: "rect" },
  // Square in the file, a circle on screen.
  logo: { id: "logo", label: m.logo, aspect: 1, width: 512, height: 512, shape: "round" },
  // 4:3 is what most phone cameras shoot natively, so little is cut.
  photo: { id: "photo", label: m.photo, aspect: 4 / 3, width: 1600, height: 1200, shape: "rect" },
};

/** The types accepted for cropping. */
export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";

/**
 * The check before the file is opened — **a courtesy, never a control**:
 * whoever sends the request can skip anything the browser checks, and the
 * check that counts is the server's. This only spares the wait for a file that
 * would be refused.
 *
 * Returns the error sentence, or `null` when the file is fine.
 */
export function checkImageFile(file: { size: number; type: string }, maxBytes: number): string | null {
  if (!IMAGE_ACCEPT.split(",").includes(file.type)) return m.notAnImage(describeAccept(IMAGE_ACCEPT));
  if (file.size > maxBytes) return m.tooLarge(formatBytes(file.size), formatBytes(maxBytes));
  return null;
}

/** The rectangle, in pixels of the original image, that the crop chose. */
export type CropArea = { x: number; y: number; width: number; height: number };

/**
 * The box that holds the rotated image. A quarter turn swaps width and
 * height; any other angle grows both.
 */
export function rotatedSize(width: number, height: number, degrees: number) {
  const rad = (degrees * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  return {
    width: Math.round(width * cos + height * sin),
    height: Math.round(width * sin + height * cos),
  };
}

/**
 * **The image is small for the format** when the crop is less than half the
 * output width: enlarged more than twice, it blurs. A warning, never a block —
 * it may be the only picture the person has.
 */
export function isLowResolution(area: CropArea, format: ImageFormat): boolean {
  return area.width < format.width / 2;
}

/** What the produced file is, as the screen writes it: `1600×400 · WEBP · 84 KB`. */
export function describeOutput(bytes: number, type: string, format: ImageFormat): string {
  const kind = type.replace("image/", "").toUpperCase();
  return `${format.width}×${format.height} · ${kind} · ${formatBytes(bytes)}`;
}

/**
 * Crops in the browser and returns the file at its final size.
 *
 * **Cropping here saves bandwidth and storage**: what goes up is already the
 * size the screen uses, not the camera's full resolution. **It is not
 * validation** — a server should still reprocess whatever it receives.
 *
 * WebP when the browser can encode it; JPEG otherwise. Never PNG: a photo
 * saved as PNG weighs several times more.
 */
export async function renderCrop(src: string, area: CropArea, rotation: number, format: ImageFormat): Promise<Blob> {
  const image = await loadImage(src);

  // 1. The whole image, rotated, on a canvas the size of the box that holds it.
  const turned = rotatedSize(image.naturalWidth, image.naturalHeight, rotation);
  const whole = document.createElement("canvas");
  whole.width = turned.width;
  whole.height = turned.height;
  const wholeCtx = whole.getContext("2d");
  if (!wholeCtx) throw new Error("Canvas 2D is not available.");
  wholeCtx.translate(turned.width / 2, turned.height / 2);
  wholeCtx.rotate((rotation * Math.PI) / 180);
  wholeCtx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

  // 2. The crop of it, already scaled to the output size.
  const out = document.createElement("canvas");
  out.width = format.width;
  out.height = format.height;
  const ctx = out.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is not available.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(whole, area.x, area.y, area.width, area.height, 0, 0, format.width, format.height);

  const webp = await toBlob(out, "image/webp");
  if (webp?.type === "image/webp") return webp;
  const jpeg = await toBlob(out, "image/jpeg");
  if (!jpeg) throw new Error("The image could not be encoded.");
  return jpeg;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The image could not be opened."));
    image.src = src;
  });
}

function toBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, 0.85));
}
