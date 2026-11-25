import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { CardForm } from "@/components/ui/card-form";
import { FileRow, FileUpload, type UploadFn } from "@/components/ui/file-upload";
import { ImageCropper, useImagePicker } from "@/components/ui/image-cropper";
import { IMAGE_FORMATS, type ImageFormat, type ImageFormatId, describeOutput } from "@/lib/image-formats";
import { messages } from "@/messages";

import { SAMPLE_LANDSCAPE, SAMPLE_SMALL } from "../samples";

/**
 * The live demos of the files-and-images pieces, kept apart from the section
 * page so the page stays a list of pieces and states.
 */

const t = messages.workbench.demos;
const MB = 1024 * 1024;

/** Documents: what a typical "attach your paperwork" field accepts. */
const DOCUMENTS = "application/pdf,image/jpeg,image/png";

/**
 * A pretend upload, **for the workbench only**: a clock fills the bar and no
 * byte leaves the browser. In a component, a bar driven by a clock would lie
 * (see `progress.tsx`); here it stands in for a real transfer. With
 * `failFirst`, each file's first attempt stops at 60% and the retry succeeds.
 */
function pretendUpload(failFirst: boolean): UploadFn {
  const failedOnce = new Set<string>();
  return (file, { onProgress, signal }) =>
    new Promise<void>((resolve, reject) => {
      let done = 0;
      const fails = failFirst && !failedOnce.has(file.name);
      const tick = setInterval(() => {
        done = Math.min(1, done + 0.04);
        onProgress(done);
        if (fails && done >= 0.6) {
          clearInterval(tick);
          failedOnce.add(file.name);
          reject(new Error("pretend failure"));
        } else if (done >= 1) {
          clearInterval(tick);
          resolve();
        }
      }, 100);
      signal.addEventListener("abort", () => {
        clearInterval(tick);
        reject(signal.reason);
      });
    });
}

export function FileUploadDemo({ maxFiles, failFirst = false, single = false }: { maxFiles?: number; failFirst?: boolean; single?: boolean }) {
  // One pretend server per mounted demo: "already failed" does not leak between states.
  const [upload] = useState(() => pretendUpload(failFirst));
  return (
    <FileUpload
      label={single ? t.fileUpload.singleLabel : t.fileUpload.label}
      hint={single ? undefined : t.fileUpload.hint}
      accept={DOCUMENTS}
      maxFiles={maxFiles}
      upload={upload}
    />
  );
}

/** The three rows standing still, to compare without waiting. */
export function FileRowsDemo() {
  const [uploading, uploaded, failed] = t.fileUpload.rowNames;
  return (
    <ul className="w-full space-y-2">
      <li>
        <FileRow name={uploading!} bytes={2.4 * MB} status="uploading" progress={0.45} onRemove={() => {}} />
      </li>
      <li>
        <FileRow name={uploaded!} bytes={380 * 1024} status="done" progress={1} onRemove={() => {}} />
      </li>
      <li>
        <FileRow name={failed!} bytes={6.1 * MB} status="failed" progress={0.6} onRemove={() => {}} onRetry={() => {}} />
      </li>
    </ul>
  );
}

type Result = { url: string; text: string; round: boolean };

/** Every address created on an event is noted here and given back on unmount. */
function useOwnedUrls() {
  const owned = useRef(new Set<string>());
  useEffect(() => {
    const live = owned.current;
    return () => live.forEach((u) => URL.revokeObjectURL(u));
  }, []);
  return {
    create(file: Blob) {
      const url = URL.createObjectURL(file);
      owned.current.add(url);
      return url;
    },
    release(url: string) {
      URL.revokeObjectURL(url);
      owned.current.delete(url);
    },
  };
}

const FORMAT_BUTTONS: { id: ImageFormatId; label: string }[] = [
  { id: "cover", label: t.imageCropper.cover },
  { id: "logo", label: t.imageCropper.logo },
  { id: "photo", label: t.imageCropper.photo },
];

/**
 * The cropper with the inline sample, in each format, or with an image of the
 * reviewer's own. The result shows the file the crop produced.
 */
export function ImageCropperDemo({ small = false }: { small?: boolean }) {
  const [format, setFormat] = useState<ImageFormat>(IMAGE_FORMATS.cover);
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const urls = useOwnedUrls();

  function show(file: Blob, cropped: ImageFormat) {
    if (result) urls.release(result.url);
    setResult({ url: urls.create(file), text: describeOutput(file.size, file.type, cropped), round: cropped.shape === "round" });
  }

  const own = useImagePicker({ format: IMAGE_FORMATS.photo, onCropped: (file) => show(file, IMAGE_FORMATS.photo) });

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {small ? (
          <Button
            variant="secondary"
            onClick={() => {
              setFormat(IMAGE_FORMATS.cover);
              setOpen(true);
            }}
          >
            {t.imageCropper.smallSample}
          </Button>
        ) : (
          <>
            {FORMAT_BUTTONS.map(({ id, label }) => (
              <Button
                key={id}
                variant="secondary"
                onClick={() => {
                  setFormat(IMAGE_FORMATS[id]);
                  setOpen(true);
                }}
              >
                {label}
              </Button>
            ))}
            <Button variant="ghost" onClick={own.pick}>
              {t.imageCropper.own}
            </Button>
          </>
        )}
      </div>
      {own.error ? <p className="text-sm font-medium text-error">{own.error}</p> : null}

      <div className="text-sm text-secondary">
        <span className="block text-xs font-medium text-subtle">{t.imageCropper.result}</span>
        {result ? (
          <figure className="mt-1.5 space-y-1">
            <img
              src={result.url}
              alt=""
              className={result.round ? "size-24 rounded-full border border-border object-cover" : "max-h-32 w-auto max-w-full rounded-md border border-border"}
            />
            <figcaption className="font-mono text-xs text-primary">{result.text}</figcaption>
          </figure>
        ) : (
          <p className="mt-1">{t.imageCropper.noResult}</p>
        )}
      </div>

      <ImageCropper
        open={open}
        onOpenChange={setOpen}
        src={small ? SAMPLE_SMALL : SAMPLE_LANDSCAPE}
        format={format}
        onConfirm={(file) => show(file, format)}
      />
      {own.picker}
    </div>
  );
}

/** The card form with the one thing a page may show: whether it is complete. */
export function CardFormDemo({ declined = false }: { declined?: boolean }) {
  const [complete, setComplete] = useState(false);
  return (
    <div className="flex w-full flex-col gap-2">
      <CardForm
        hint={declined ? t.cardForm.declinedHint : undefined}
        error={declined ? t.cardForm.declinedError : undefined}
        onChange={(card) => setComplete(card.complete)}
      />
      <p className="text-xs text-secondary">
        {t.cardForm.complete}: <code className="font-mono text-primary">{complete ? t.cardForm.yes : t.cardForm.no}</code>
      </p>
      {declined ? null : <p className="text-xs text-subtle">{t.cardForm.testNumbers}</p>}
    </div>
  );
}
