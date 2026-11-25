import { locale, messages } from "@/messages";

/**
 * Checking a file before it is sent — **a courtesy, never a control**.
 *
 * Whoever sends the request can skip anything the browser checks; the check
 * that counts is the server's. This only spares the person from watching a
 * bar fill for a file that would be refused at the end.
 *
 * Pure functions: the upload component reads them, and so do the tests.
 */

const m = messages.ui.fileCheck;

/**
 * `accept` is the same text as the `<input type="file">` attribute: a MIME
 * type (`application/pdf`), a family (`image/*`) or an extension (`.pdf`),
 * separated by commas. **One text for the system picker and for this check**:
 * two lists would disagree on the first new format.
 */
export function acceptsFile(file: { name: string; type: string }, accept: string): boolean {
  const tokens = splitAccept(accept);
  if (tokens.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return tokens.some((t) => {
    if (t.startsWith(".")) return name.endsWith(t);
    if (t.endsWith("/*")) return type.startsWith(t.slice(0, -1));
    return type === t;
  });
}

function splitAccept(accept: string): string[] {
  return accept
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

/** The name people know, not the MIME type. */
const FORMAT_NAMES: Record<string, string> = {
  "application/pdf": "PDF",
  ".pdf": "PDF",
  "image/jpeg": "JPG",
  ".jpg": "JPG",
  ".jpeg": "JPG",
  "image/png": "PNG",
  ".png": "PNG",
  "image/webp": "WebP",
  ".webp": "WebP",
  "image/*": m.anyImage,
};

const orList = new Intl.ListFormat(locale, { type: "disjunction" });

/** `application/pdf,image/jpeg,.jpg` → `PDF or JPG`. A format never repeats. */
export function describeAccept(accept: string): string {
  const names = [
    ...new Set(
      splitAccept(accept).map((t) => FORMAT_NAMES[t] ?? (t.split("/").pop() ?? t).replace(".", "").toUpperCase()),
    ),
  ];
  return orList.format(names);
}

const KB = 1024;
const MB = KB * KB;

const oneDecimalAtMost = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });

/** A size to read: `320 KB`, `4.2 MB`. Below 1 KB it still says `1 KB` — never zero. */
export function formatBytes(bytes: number): string {
  if (bytes < MB) return `${Math.max(1, Math.round(bytes / KB))} KB`;
  return `${oneDecimalAtMost.format(bytes / MB)} MB`;
}

/**
 * The refusal sentence, or `null` when the file may go on. The file name is in
 * the sentence because the person may have dropped several at once.
 */
export function checkFile(
  file: { name: string; type: string; size: number },
  { accept, maxBytes }: { accept: string; maxBytes: number },
): string | null {
  if (!acceptsFile(file, accept)) return m.notAccepted(file.name, describeAccept(accept));
  if (file.size === 0) return m.empty(file.name);
  if (file.size > maxBytes) return m.tooLarge(file.name, formatBytes(file.size), formatBytes(maxBytes));
  return null;
}

/**
 * The same file chosen twice: name, size and last-modified time. The browser
 * gives no path, and reading the content to compare would cost more than the
 * repeated upload it is meant to prevent.
 */
export function fileKey(file: { name: string; size: number; lastModified: number }): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}
