import { useState } from "react";
import { ClipboardCopy, RotateCw, TriangleAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/cn";
import { messages } from "@/messages";

import { Button } from "./button";

const m = messages.ui.error;

/**
 * The error on screen — **what happened, and what the person can do**.
 *
 * Both halves are required, and the second is the one that usually goes
 * missing. "Something went wrong" informs and abandons: the person stares at
 * a dead screen without knowing whether to wait, reload, or whether the
 * problem is theirs.
 *
 * ## Four rules this component carries
 *
 * **1. Never show the technical message.** `ECONNREFUSED` helps nobody and
 * says more about the infrastructure than it should. The detail belongs in the
 * log, with a request identifier — and never passwords, tokens, keys, personal
 * identifiers or authenticated request bodies.
 *
 * **2. No error without a human explanation.** `description` is **required**:
 * the type refuses the generic panel instead of trusting the discipline of
 * whoever writes the next screen.
 *
 * **3. The code is never the message; it is the handle for support.** It is
 * not printed: it sits behind "Copy error code" and only travels if the person
 * decides to contact support. A `req_8f3a21c7` printed in the middle of an
 * error panel is a technical message under another name. If the clipboard
 * fails, then the code is shown — without it, the support ticket becomes
 * archaeology.
 *
 * **4. `role="alert"` is right here** (and would be wrong on a form field).
 * This error **replaces** content the person was expecting, so they need to
 * know at once. A validation error, by contrast, is already in server-rendered
 * HTML and would be announced out of context on load.
 */
export function ErrorState({
  title = m.title,
  description,
  icon: Icon = TriangleAlert,
  onRetry,
  retryLabel = m.retry,
  code,
  copyLabel = m.copyCode,
  alive = true,
  className,
  children,
}: {
  title?: string;
  /**
   * **Required.** From the reader's point of view — what happened and what to
   * expect. Never the technical message, never the code.
   */
  description: string;
  /**
   * Follows the title and changes with the cause — offline, timeout, access
   * denied. **Never carries the information alone**: the "never color alone"
   * rule applies to glyphs too.
   */
  icon?: LucideIcon;
  onRetry?: () => void;
  retryLabel?: string;
  /**
   * The request identifier, so support can find the log line. **Not printed**
   * — it feeds the copy button.
   */
  code?: string;
  copyLabel?: string;
  /**
   * `false` removes the alert role. **For showcases only.** A product error
   * never appears with the page: it replaces content the person expected,
   * which is why it interrupts.
   */
  alive?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  // The attempt remembers WHICH code it refers to. After a retry that fails
  // again, the panel is the same and the code is new: an inherited "Code
  // copied." would claim the clipboard holds the new code when it holds the
  // old one, and support would find the wrong log line.
  const [attempt, setAttempt] = useState<{ code: string; ok: boolean } | null>(null);
  const current = attempt && attempt.code === code ? attempt : null;
  // Only a failure reveals the code — an insecure context, or a denied
  // permission. Then showing it is the only way left to reach support.
  const revealed = current?.ok === false;
  const notice = !current ? "" : current.ok ? m.copied : m.copyFailed;

  async function copy() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setAttempt({ code, ok: true });
    } catch {
      setAttempt({ code, ok: false });
    }
  }

  return (
    <div
      role={alive ? "alert" : undefined}
      className={cn(
        // `w-full`, like `Empty`: a panel that takes the place of the content
        // that failed, not an inline notice.
        "flex w-full flex-col items-center justify-center rounded-lg border-2 border-error bg-surface px-6 py-10 text-center",
        className,
      )}
    >
      <Icon size={32} aria-hidden className="text-error" />
      <p className="mt-3 text-base font-medium text-primary">{title}</p>
      <p className="mt-1 max-w-[48ch] text-sm text-secondary">{description}</p>

      {onRetry ? (
        <div className="mt-5">
          <Button onClick={onRetry}>
            <RotateCw size={18} aria-hidden />
            {retryLabel}
          </Button>
        </div>
      ) : null}

      {children ? <div className="mt-5">{children}</div> : null}

      {code ? (
        <div className="mt-5 flex flex-col items-center">
          <Button variant="ghost" size="sm" onClick={copy}>
            <ClipboardCopy size={16} aria-hidden />
            {copyLabel}
          </Button>
          {/* The live region starts empty on purpose: to announce, it must be
              in the DOM before the text arrives. No reserved height — the text
              only appears after a click, and a shift the person caused is not
              a layout jump. */}
          <p role="status" className={cn("text-xs text-subtle", notice && "mt-1")}>
            {notice}
          </p>
          {revealed ? (
            <p className="mt-1 font-mono text-xs text-subtle">
              <span className="sr-only">{m.codeForSupport} </span>
              {code}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
