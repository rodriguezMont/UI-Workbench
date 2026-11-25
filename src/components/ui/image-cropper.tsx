import { useRef, useState } from "react";
import Cropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { AlertTriangle, RotateCcw, RotateCw, Undo2, XCircle } from "lucide-react";

import { cn } from "@/lib/cn";
import { describeAccept } from "@/lib/file-check";
import { type CropArea, IMAGE_ACCEPT, type ImageFormat, checkImageFile, isLowResolution, renderCrop } from "@/lib/image-formats";
import { messages } from "@/messages";

import { Button } from "./button";
import { Dialog, DialogContent } from "./dialog";
import { Spinner } from "./progress";
import { Slider } from "./slider";

const m = messages.ui.imageCropper;

/**
 * The image cropper: frames a picture to the format it will fill.
 *
 * **The format rules, and the person only frames.** Cover, logo and photo
 * have a fixed aspect ratio and output size in
 * [`image-formats.ts`](../../lib/image-formats.ts); nobody picks a ratio
 * here. What comes out is the file at its final size.
 *
 * **The gestures are react-easy-crop's; the look is the tokens'.** Dragging,
 * pinching, the mouse wheel and the arrow keys come from the library — which
 * is where home-made croppers break on phones. The slider, the buttons, the
 * copy and the colors are the library's own pieces. Its CSS comes in as an
 * import, not as a `<style>` injected at run time.
 *
 * **Every gesture has a path without a pinch.** Whoever uses a keyboard or a
 * single finger zooms with the slider (arrows, Home and End), and rotating and
 * resetting have buttons. No filters, brightness or contrast: framing is the
 * whole job.
 *
 * **A dialog, not the sheet, also on phones.** A sheet closes with a drag
 * down, which is the same gesture as framing: the two would fight. On phones
 * the dialog fills the screen.
 *
 * **A small image warns, never blocks**: it may be the only one the person has.
 *
 * **The backdrop is the feature surface**, dark in both schemes: the picture
 * is what lights up, and the shade outside the crop is the same surface,
 * translucent.
 */

const ZOOM_MIN = 1;
const ZOOM_MAX = 4;

type ImageCropperProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The chosen image's address (`createObjectURL`). */
  src: string | null;
  format: ImageFormat;
  onConfirm: (file: Blob) => void;
  /**
   * Where focus goes on close, when it is not the element that opened it —
   * that one may have gone with the new file. With no answer, focus returns to
   * whatever was focused when the cropper opened.
   */
  returnFocusTo?: () => HTMLElement | null | undefined;
};

export function ImageCropper({ open, onOpenChange, src, format, onConfirm, returnFocusTo }: ImageCropperProps) {
  // Opened by state, not by a Radix trigger: without a trigger it does not
  // know where to return focus. Whatever was focused on open receives it.
  const origin = useRef<HTMLElement | null>(null);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onOpenAutoFocus={() => {
          origin.current = document.activeElement as HTMLElement | null;
        }}
        onCloseAutoFocus={(event) => {
          const target = [returnFocusTo?.(), origin.current].find((el) => el?.isConnected);
          if (!target) return;
          event.preventDefault();
          target.focus();
        }}
        title={m.title(format.label)}
        description={m.description}
        // The whole screen on phones; the wide dialog from `sm`.
        className={cn(
          "flex h-dvh max-h-dvh w-screen max-w-none flex-col rounded-none border-0 p-4",
          "sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:w-[calc(100vw-2rem)] sm:max-w-2xl sm:rounded-lg sm:border sm:p-5",
        )}
      >
        {/* The content unmounts on close: every opening starts from scratch,
            and the framing of one image does not leak into the next. */}
        <Frame
          src={src}
          format={format}
          onConfirm={(file) => {
            onConfirm(file);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function Frame({ src, format, onConfirm }: Pick<ImageCropperProps, "src" | "format" | "onConfirm">) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [area, setArea] = useState<CropArea | null>(null);
  const [cropping, setCropping] = useState(false);
  const [error, setError] = useState<string>();

  const reset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  async function apply() {
    if (!src || !area) return;
    setCropping(true);
    setError(undefined);
    try {
      onConfirm(await renderCrop(src, area, rotation, format));
    } catch {
      setError(m.failed(describeAccept(IMAGE_ACCEPT)));
    } finally {
      setCropping(false);
    }
  }

  const small = area ? isLowResolution(area, format) : false;
  const round = format.shape === "round";

  return (
    <>
      <div className="relative min-h-64 flex-1 overflow-hidden rounded-md bg-surface-feature sm:h-80 sm:flex-none">
        {src ? (
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={format.aspect}
            cropShape={format.shape}
            showGrid={!round}
            minZoom={ZOOM_MIN}
            maxZoom={ZOOM_MAX}
            zoomSpeed={0.5}
            keyboardStep={10}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={(_, pixels) => setArea(pixels)}
            disableAutomaticStylesInjection
            style={{
              cropAreaStyle: {
                border: "2px solid var(--text-on-feature)",
                // The library paints the shade outside the crop with `color`.
                color: "color-mix(in srgb, var(--surface-feature) 65%, transparent)",
              },
            }}
            cropperProps={{ tabIndex: 0, "aria-label": m.area(format.label), role: "group" }}
          />
        ) : null}
      </div>

      {/* What changes while framing is announced, and so is the error. No
          reserved height — empty, it takes no room. Always rendered: a live
          region hidden with `display: none` may not announce. */}
      <div aria-live="polite">
        {error ? (
          <p className="mt-3 flex items-start gap-1.5 text-sm font-medium text-error">
            <XCircle size={16} aria-hidden className="mt-0.5 shrink-0" />
            {error}
          </p>
        ) : small ? (
          <p className="mt-3 flex items-start gap-1.5 text-sm text-warning">
            <AlertTriangle size={16} aria-hidden className="mt-0.5 shrink-0" />
            {m.lowResolution}
          </p>
        ) : null}
      </div>

      {/* One row: the slider, the turns, the reset and the action that
          confirms. Cancelling is the dialog's X — two ways to give up on the
          same screen is one too many. The slider shows no label or percent:
          the dialog already says what happens here, and listeners get both
          from the thumb. */}
      <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-x-3">
        <div className="min-w-24 flex-1 sm:min-w-32">
          <Slider
            label={m.zoom}
            hiddenLabel
            showValue={false}
            buttons={false}
            min={ZOOM_MIN}
            max={ZOOM_MAX}
            step={0.01}
            value={zoom}
            onValueChange={setZoom}
            formatValue={(v) => `${Math.round(v * 100)}%`}
          />
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="icon" aria-label={m.rotateLeft} onClick={() => setRotation((r) => (r - 90) % 360)}>
            <RotateCcw size={20} aria-hidden />
          </Button>
          <Button variant="ghost" size="icon" aria-label={m.rotateRight} onClick={() => setRotation((r) => (r + 90) % 360)}>
            <RotateCw size={20} aria-hidden />
          </Button>
          <Button variant="ghost" size="icon" aria-label={m.reset} onClick={reset}>
            <Undo2 size={20} aria-hidden />
          </Button>
        </div>

        {/* On phones the visible label shortens to fit the row; the accessible
            name stays whole, and "Apply" is inside it. */}
        <Button
          className="shrink-0"
          onClick={apply}
          disabled={!area || cropping}
          aria-busy={cropping || undefined}
          aria-label={cropping ? undefined : m.apply}
        >
          {cropping ? <Spinner size={18} /> : null}
          {cropping ? (
            m.cropping
          ) : (
            <span>
              {m.applyShort}
              <span className="hidden sm:inline">{m.applyRest}</span>
            </span>
          )}
        </Button>
      </div>
    </>
  );
}

/** The original may be the camera's full picture: the crop is what shrinks it. */
const ORIGINAL_MAX_BYTES = 20 * 1024 * 1024;

/**
 * Choose, crop, use — the path of every fixed-format image.
 *
 * `pick()` opens the file picker; an accepted file opens the cropper in the
 * requested format, and `onCropped` receives the final file. `picker` is what
 * must be on screen (the hidden input and the dialog). `error` says why a file
 * was refused before opening.
 *
 * **The original's address is given back when the cropper closes** — applied
 * or cancelled. Whoever receives the final file looks after its address.
 */
export function useImagePicker({
  format,
  onCropped,
  maxBytes = ORIGINAL_MAX_BYTES,
  returnFocusTo,
}: {
  format: ImageFormat;
  onCropped: (file: Blob) => void;
  maxBytes?: number;
  returnFocusTo?: () => HTMLElement | null | undefined;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState<string>();

  function close(open: boolean) {
    if (open || !src) return;
    URL.revokeObjectURL(src);
    setSrc(null);
  }

  const picker = (
    <>
      {/* Truly hidden: the caller's own button opens it. */}
      <input
        ref={input}
        type="file"
        hidden
        accept={IMAGE_ACCEPT}
        aria-label={m.choose(format.label)}
        onChange={(e) => {
          const file = e.currentTarget.files?.[0];
          // Back to empty: choosing the same file again must fire.
          e.currentTarget.value = "";
          if (!file) return;
          const refusal = checkImageFile(file, maxBytes);
          setError(refusal ?? undefined);
          if (!refusal) setSrc(URL.createObjectURL(file));
        }}
      />
      <ImageCropper open={src !== null} onOpenChange={close} src={src} format={format} onConfirm={onCropped} returnFocusTo={returnFocusTo} />
    </>
  );

  return {
    pick: () => input.current?.click(),
    picker,
    error,
    clearError: () => setError(undefined),
  };
}
