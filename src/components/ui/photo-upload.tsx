import { useEffect, useId, useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";

import { cn } from "@/lib/cn";
import { formatBytes } from "@/lib/file-check";
import { IMAGE_ACCEPT, checkImageFile } from "@/lib/image-formats";
import { messages } from "@/messages";

import { Button } from "./button";
import { CHOOSE_FILE_LABEL } from "./file-upload";
import { FieldMessages, describedByOf } from "./fieldset";

const m = messages.ui.photoUpload;

/**
 * Choosing a photo — the interaction, **with no destination**.
 *
 * Choose, see, replace, remove. **Nothing is sent anywhere from here**: the
 * chosen file reaches the caller through `onFileChange`, and where it goes
 * (and who resizes it) is the caller's decision. For a picture that must fit
 * a fixed shape, the [cropper](./image-cropper.tsx) is the next step.
 *
 * **The limit here is a courtesy, never a control.** Anyone can skip a check
 * in the browser; the one that counts is the server's. This only spares the
 * wait for a file that would be refused.
 *
 * **The preview has an empty `alt` on purpose**: it adds nothing for someone
 * who hears the file name right next to it.
 */

const MB = 1024 * 1024;

type Preview = { url: string; name: string; bytes: number };

type PhotoUploadProps = {
  label: string;
  hint?: string;
  /** A courtesy, not a lock. The server decides for real. */
  maxBytes?: number;
  accept?: string;
  /** The chosen file, or `null` when the person removes it. */
  onFileChange?: (file: File | null) => void;
  className?: string;
};

export function PhotoUpload({ label, hint, maxBytes = 5 * MB, accept = IMAGE_ACCEPT, onFileChange, className }: PhotoUploadProps) {
  const base = useId();
  const labelId = `${base}-label`;
  const chooseId = `${base}-choose`;
  const inputId = `${base}-input`;
  const ids = { hintId: `${base}-hint`, errorId: `${base}-error` };

  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);

  // An address from `createObjectURL` holds the file in memory until someone
  // gives it back. The cleanup runs when the preview changes — revoking the
  // previous one — and when the component leaves, revoking the last.
  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview.url);
  }, [preview]);

  function choose(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;

    const refusal = checkImageFile(file, maxBytes);
    if (refusal) {
      setError(refusal);
      // Back to empty, so the same file can be chosen again once the person
      // has made it smaller — without this, `change` does not fire.
      event.currentTarget.value = "";
      return;
    }

    setError(undefined);
    setPreview({ url: URL.createObjectURL(file), name: file.name, bytes: file.size });
    onFileChange?.(file);
  }

  function remove() {
    setPreview(null);
    setError(undefined);
    onFileChange?.(null);
    // Without this the input keeps the removed file, and choosing **the same
    // file** again would do nothing — the browser only fires `change` when the
    // value changes. It is the likeliest path: removing to choose again is
    // usually "I clicked the wrong one", and the right file is the one that
    // just left. Focus goes back to the choose button, which stays.
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.focus();
    }
  }

  return (
    <div className={cn("w-full", className)}>
      <span id={labelId} className="mb-1.5 block text-sm font-medium text-primary">
        {label}
      </span>

      <div className="flex flex-wrap items-start gap-4">
        <div
          className={cn(
            "flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2",
            error ? "border-error" : preview ? "border-border" : "border-dashed border-border-strong",
          )}
        >
          {preview ? (
            <img src={preview.url} alt="" className="size-full object-cover" />
          ) : (
            <ImagePlus size={28} aria-hidden className="text-subtle" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={accept}
            onChange={choose}
            aria-labelledby={`${labelId} ${chooseId}`}
            aria-describedby={describedByOf(ids, hint, error)}
            aria-invalid={Boolean(error) || undefined}
            className="peer sr-only"
          />
          <label id={chooseId} htmlFor={inputId} className={CHOOSE_FILE_LABEL}>
            <ImagePlus size={18} aria-hidden />
            {preview ? m.replace : m.choose}
          </label>

          {preview ? (
            <div className="flex flex-wrap items-center gap-2">
              <p className="min-w-0 truncate text-sm text-secondary">
                {preview.name} <span className="text-subtle">· {formatBytes(preview.bytes)}</span>
              </p>
              <Button variant="ghost" size="sm" onClick={remove}>
                <Trash2 size={16} aria-hidden />
                {m.remove}
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <FieldMessages {...ids} hint={hint} error={error} />
    </div>
  );
}
