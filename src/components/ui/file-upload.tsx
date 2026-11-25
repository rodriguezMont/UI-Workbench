import { useEffect, useId, useRef, useState } from "react";
import { CheckCircle2, FileText, RotateCcw, Upload, X, XCircle } from "lucide-react";

import { cn } from "@/lib/cn";
import { checkFile, describeAccept, fileKey, formatBytes } from "@/lib/file-check";
import { messages } from "@/messages";

import { Button, buttonVariants } from "./button";
import { FieldMessages } from "./fieldset";
import { ProgressBar } from "./progress";

const m = messages.ui.fileUpload;

/**
 * File upload — drop or choose, check, follow, remove.
 *
 * **Where the file goes belongs to the caller, so it comes in as a prop**
 * (`upload`). The component calls that function with the file, an
 * `onProgress` and a `signal`, and draws whatever happens. **A real
 * implementation needs `XMLHttpRequest`** (or a storage SDK that reports
 * progress): `fetch` does not report upload progress.
 *
 * **The checks here are a courtesy, never a control**
 * ([`file-check.ts`](../../lib/file-check.ts)): the server decides. A refused
 * file never enters the list; the sentence says which file and why, and it
 * clears on the next choice.
 *
 * **Dragging is a shortcut, never the way in.** The choose button is always
 * there; "Drag files here" only shows where there is a fine pointer, because
 * on a phone it would promise a gesture that does not exist.
 *
 * **Removing during an upload cancels it** — the `signal` aborts — and so does
 * leaving the screen. An orphan upload would keep spending the person's data.
 *
 * **Listeners hear the outcome, not every percent**: one announcement per
 * file, when it finishes or fails.
 */

export type UploadFn = (
  file: File,
  options: { onProgress: (fraction: number) => void; signal: AbortSignal },
) => Promise<void>;

export type FileStatus = "uploading" | "done" | "failed";

type Item = {
  id: string;
  key: string;
  file: File;
  status: FileStatus;
  progress: number;
};

const MB = 1024 * 1024;

/**
 * The visible "button" that is really the file input's label. The input stays
 * reachable by keyboard and invisible; `peer-focus-visible` gives the ring
 * back, which `sr-only` would hide. Shared with the photo upload.
 */
export const CHOOSE_FILE_LABEL = cn(
  buttonVariants({ variant: "secondary" }),
  "cursor-pointer",
  "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus-ring)]",
);

type FileUploadProps = {
  label: string;
  hint?: string;
  /** The same text as the `accept` attribute: `application/pdf,image/png,.pdf`. */
  accept: string;
  /** A courtesy, not a lock. */
  maxBytes?: number;
  /** With 1, the picker chooses a single file. */
  maxFiles?: number;
  upload: UploadFn;
  /** The files that arrived, and how many are still on their way. */
  onChange?: (state: { done: File[]; pending: number }) => void;
  className?: string;
};

export function FileUpload({ label, hint, accept, maxBytes = 10 * MB, maxFiles = 5, upload, onChange, className }: FileUploadProps) {
  const base = useId();
  const labelId = `${base}-label`;
  const chooseId = `${base}-choose`;
  const inputId = `${base}-input`;
  const hintId = `${base}-hint`;
  const errorId = `${base}-error`;

  const [items, setItems] = useState<Item[]>([]);
  const [rejections, setRejections] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  // With a counter: the same sentence twice in a row (failed, retried, failed)
  // would not change the text, and a listener would not hear the second one.
  const [announcement, setAnnouncement] = useState({ text: "", n: 0 });
  const announce = (text: string) => setAnnouncement((a) => ({ text, n: a.n + 1 }));

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const controllers = useRef(new Map<string, AbortController>());
  // `dragenter` and `dragleave` fire for every child crossed: counting them
  // keeps the border from flickering while the file passes over the text.
  const dragDepth = useRef(0);
  const nextId = useRef(0);
  // Where focus goes after a removal: the next row, or the choose button.
  const focusAfterRemove = useRef<string | null | undefined>(undefined);

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onChangeRef.current?.({
      done: items.filter((i) => i.status === "done").map((i) => i.file),
      pending: items.filter((i) => i.status === "uploading").length,
    });
  }, [items]);

  // Leaving the screen cancels whatever is on its way.
  useEffect(() => {
    const live = controllers.current;
    return () => {
      live.forEach((c) => c.abort());
      live.clear();
    };
  }, []);

  useEffect(() => {
    const target = focusAfterRemove.current;
    if (target === undefined) return;
    focusAfterRemove.current = undefined;
    const button = target ? listRef.current?.querySelector<HTMLElement>(`[data-item="${target}"] button`) : null;
    // With no next row, focus returns to the choose button — which may have
    // just come back, if the list was at its limit.
    (button ?? inputRef.current)?.focus();
  }, [items]);

  const full = items.length >= maxFiles;

  function patch(id: string, change: Partial<Item>) {
    setItems((current) => current.map((i) => (i.id === id ? { ...i, ...change } : i)));
  }

  function start(id: string, file: File) {
    const controller = new AbortController();
    controllers.current.set(id, controller);
    const { signal } = controller;

    upload(file, {
      signal,
      onProgress: (fraction) => {
        if (!signal.aborted) patch(id, { progress: fraction });
      },
    })
      .then(() => {
        if (signal.aborted) return;
        patch(id, { status: "done", progress: 1 });
        announce(m.uploaded(file.name));
      })
      .catch(() => {
        // The raw error never reaches the screen: it is for the log of whoever
        // implements `upload`, and the person needs to know what to do.
        if (signal.aborted) return;
        patch(id, { status: "failed" });
        announce(m.failed(file.name));
      })
      .finally(() => {
        if (controllers.current.get(id) === controller) controllers.current.delete(id);
      });
  }

  function add(files: File[]) {
    const refused: string[] = [];
    const added: Item[] = [];
    const keys = new Set(items.map((i) => i.key));
    let room = maxFiles - items.length;

    for (const file of files) {
      const key = fileKey(file);
      if (keys.has(key)) {
        refused.push(m.duplicate(file.name));
        continue;
      }
      const refusal = checkFile(file, { accept, maxBytes });
      if (refusal) {
        refused.push(refusal);
        continue;
      }
      if (room <= 0) {
        refused.push(m.overLimit(file.name, m.files(maxFiles)));
        continue;
      }
      room -= 1;
      keys.add(key);
      nextId.current += 1;
      added.push({ id: `${base}-${nextId.current}`, key, file, status: "uploading", progress: 0 });
    }

    setRejections(refused);
    if (added.length === 0) return;
    setItems((current) => [...current, ...added]);
    added.forEach((item) => start(item.id, item.file));
  }

  function remove(id: string) {
    controllers.current.get(id)?.abort();
    controllers.current.delete(id);
    const at = items.findIndex((i) => i.id === id);
    const next = items[at + 1] ?? items[at - 1];
    focusAfterRemove.current = next?.id ?? null;
    setItems((current) => current.filter((i) => i.id !== id));
    setRejections([]);
  }

  function retry(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    patch(id, { status: "uploading", progress: 0 });
    start(id, item.file);
  }

  const describedBy = rejections.length ? errorId : hint ? hintId : undefined;

  return (
    <div className={cn("w-full", className)}>
      <span id={labelId} className="mb-1.5 block text-sm font-medium text-primary">
        {label}
      </span>

      <div
        onDragEnter={(e) => {
          e.preventDefault();
          dragDepth.current += 1;
          if (!full) setDragging(true);
        }}
        onDragOver={(e) => {
          // Without this the browser opens the file in place of the page.
          e.preventDefault();
          e.dataTransfer.dropEffect = full ? "none" : "copy";
        }}
        onDragLeave={() => {
          dragDepth.current = Math.max(0, dragDepth.current - 1);
          if (dragDepth.current === 0) setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          dragDepth.current = 0;
          setDragging(false);
          if (!full) add(Array.from(e.dataTransfer.files));
        }}
        className={cn(
          "flex flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center",
          "transition-colors duration-[var(--motion-instant)] ease-[var(--motion-ease)]",
          dragging ? "border-accent bg-surface-hover" : rejections.length ? "border-error" : "border-border-strong",
        )}
      >
        <Upload size={28} aria-hidden className={dragging ? "text-accent" : "text-subtle"} />

        {full ? (
          <p className="text-sm text-secondary">{m.full(m.files(maxFiles))}</p>
        ) : (
          <>
            <p aria-hidden className="hidden text-sm text-secondary pointer-fine:block">
              {dragging ? m.dropToUpload : m.dragHere}
            </p>
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              accept={accept}
              multiple={maxFiles > 1}
              onChange={(e) => {
                add(Array.from(e.currentTarget.files ?? []));
                // The same file may be chosen again after being removed —
                // without this, `change` does not fire.
                e.currentTarget.value = "";
              }}
              // The group's label, then what the button says: "Documents,
              // Choose files".
              aria-labelledby={`${labelId} ${chooseId}`}
              aria-describedby={describedBy}
              aria-invalid={rejections.length > 0 || undefined}
              className="peer sr-only"
            />
            <label id={chooseId} htmlFor={inputId} className={CHOOSE_FILE_LABEL}>
              {maxFiles > 1 ? m.chooseMany : m.chooseOne}
            </label>
            <p className="text-xs text-subtle">
              {m.rules(describeAccept(accept), formatBytes(maxBytes))}
              {maxFiles > 1 ? m.upToFiles(m.files(maxFiles)) : null}
            </p>
          </>
        )}
      </div>

      {rejections.length ? (
        // The error takes the hint's place, as in every field.
        <ul id={errorId} className="mt-1.5 space-y-1">
          {rejections.map((r, i) => (
            // The sentence may repeat: two files with the same name and size.
            <li key={i} className="flex items-start gap-1.5 text-sm font-medium text-error [overflow-wrap:anywhere]">
              <XCircle size={16} aria-hidden className="mt-0.5 shrink-0" />
              {r}
            </li>
          ))}
        </ul>
      ) : (
        <FieldMessages hintId={hintId} errorId={errorId} hint={hint} />
      )}

      {items.length ? (
        <ul ref={listRef} aria-label={m.list} className="mt-3 space-y-2">
          {items.map((item) => (
            <li key={item.id} data-item={item.id}>
              <FileRow
                name={item.file.name}
                bytes={item.file.size}
                status={item.status}
                progress={item.progress}
                onRemove={() => remove(item.id)}
                onRetry={() => retry(item.id)}
              />
            </li>
          ))}
        </ul>
      ) : null}

      {/* Always mounted: a live region born with its text is not announced.
          The key remounts the text, so the same sentence twice is heard twice. */}
      <p role="status" className="sr-only">
        <span key={announcement.n}>{announcement.text}</span>
      </p>
    </div>
  );
}

/**
 * One row of the list. Exported so a page can show the three states side by
 * side without running an upload for each one.
 */
export function FileRow({
  name,
  bytes,
  status,
  progress,
  onRemove,
  onRetry,
}: {
  name: string;
  bytes: number;
  status: FileStatus;
  /** From 0 to 1. */
  progress: number;
  onRemove?: () => void;
  onRetry?: () => void;
}) {
  const percent = Math.round(Math.min(1, Math.max(0, progress)) * 100);

  return (
    <div className={cn("rounded-md border bg-surface px-3 py-2.5", status === "failed" ? "border-error" : "border-border")}>
      <div className="flex items-center gap-3">
        <FileText size={20} aria-hidden className="shrink-0 text-subtle" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-primary" title={name}>
            {name}
          </p>
          <p className={cn("flex items-center gap-1 text-xs", status === "failed" ? "font-medium text-error" : "text-secondary")}>
            {status === "done" ? (
              <CheckCircle2 size={14} aria-hidden className="shrink-0 text-success" />
            ) : status === "failed" ? (
              <XCircle size={14} aria-hidden className="shrink-0" />
            ) : null}
            <span className="truncate">
              {formatBytes(bytes)} · {status === "uploading" ? m.uploading(percent) : status === "done" ? m.done : m.notUploaded}
            </span>
          </p>
        </div>
        {/* An 8px gap: 36px boxes with 44px touch areas overlap their
            neighbor with less than that. */}
        <div className="flex shrink-0 items-center gap-2">
          {status === "failed" && onRetry ? (
            <Button variant="ghost" size="icon-sm" onClick={onRetry} aria-label={m.retry(name)}>
              <RotateCcw size={16} aria-hidden />
            </Button>
          ) : null}
          {onRemove ? (
            <Button variant="ghost" size="icon-sm" onClick={onRemove} aria-label={status === "uploading" ? m.cancel(name) : m.remove(name)}>
              <X size={16} aria-hidden />
            </Button>
          ) : null}
        </div>
      </div>
      {/* What to do wraps to its own line and is never cut: at 375px it does
          not fit beside the size. */}
      {status === "failed" ? <p className="mt-1.5 text-xs text-secondary">{m.advice}</p> : null}
      {status === "done" ? null : (
        <ProgressBar
          className="mt-2"
          value={progress}
          label={m.progress(name)}
          tone={status === "failed" ? "error" : "default"}
          valueText={status === "failed" ? m.failedAt(percent) : undefined}
        />
      )}
    </div>
  );
}
