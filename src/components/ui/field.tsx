import { useEffect, useId, useRef, useState } from "react";
import { CircleCheck, CircleX } from "lucide-react";

import { cn } from "@/lib/cn";
import { NAME_LIMIT, TEXT_LIMITS, defaultMaxLength, keepNameCharacters } from "@/lib/text-limits";
import { messages } from "@/messages";

import { FIELD_ICONS, type FieldIcon } from "./field-icons";
import { FieldMessages, describedByOf, useFieldsetState } from "./fieldset";
import { Spinner } from "./progress";

const m = messages.ui.field;

/**
 * The form field.
 *
 * **This piece exists so the accessibility wiring is written once.** Label
 * tied to the control, hint and error pointed at by `aria-describedby`,
 * `aria-invalid` when wrong — every form that redid this by hand would get a
 * piece wrong, and the wrong piece does not show on screen for sighted users.
 *
 * **The error is never just a red border.** It has a glyph and text, because
 * color alone excludes whoever does not perceive it — and because the border
 * scrolls out of view while the message stays.
 *
 * **Why the message is not `role="alert"`.** An alert fires when it appears,
 * and on a server-rendered page the message is already in the HTML: a screen
 * reader would announce the errors on load, out of context. Wiring it through
 * `aria-describedby` delivers the text at the right moment — when focus
 * reaches the field. Client-side validation needs its own live region, a
 * decision for when it exists.
 */

type Base = {
  label: string;
  /**
   * Supporting text, **descriptive**: "At least 8 characters", never "Type at
   * least 8". It stays visible with a right value, and the error takes its
   * place (see `FieldMessages`). A disabled field uses this slot to say why.
   */
  hint?: React.ReactNode;
  /** Present = the field is invalid. The string is the message. */
  error?: string;
  /**
   * A label that is hidden but read. For a field whose purpose is already
   * obvious on screen — a search next to a magnifier — never to save space.
   */
  hiddenLabel?: boolean;
};

/** Prefix, suffix and action only exist on `input`: a multi-line text area has no "$" to go with it. */
type Adornments = {
  /** Short text or an icon **before** the value — "$", a magnifier. Text is read with the description; an icon is decorative. */
  prefix?: React.ReactNode;
  /** Short text **after** the value — "mi", "%". */
  suffix?: React.ReactNode;
  /**
   * A button inside the field, at the right end — the password eye. **Never
   * replaced** by the right-end status: an eye that disappears when the
   * password errors takes away the way to see what went wrong.
   */
  endAction?: React.ReactNode;
  /** The data's icon, by key from the [dictionary](./field-icons.ts). It takes the prefix's place. */
  icon?: FieldIcon;
  /**
   * The value's state, drawn at the right end. Only needed by whoever
   * processes or confirms something — the error does not depend on it.
   *
   * - `idle` — nothing to show (the suffix, if any, appears).
   * - `loading` — something is being processed (looking up an address): a
   *   spinner, and the field is **read-only**, never disabled — disabled loses
   *   focus, leaves the form submission, and screen readers skip it.
   * - `valid` — **confirmed by someone who knows**, and only after the person
   *   leaves the field. A right format is not confirmation: a mask knows a ZIP
   *   has five digits, not that it exists. A check mark that lies teaches
   *   people to distrust all of them.
   *
   * Invalid is not a status: it is `error`, and **every field with an error
   * gets the X at the end**, with or without `status`.
   */
  status?: "idle" | "loading" | "valid";
  /** What a screen reader hears when processing starts. */
  loadingLabel?: string;
  /** What a screen reader hears when the value is confirmed. */
  validLabel?: string;
  /**
   * What the value may hold, enforced as the person types. `name` keeps
   * letters, spaces, apostrophes, hyphens and periods only, and caps the length
   * at `NAME_LIMIT` — for people, cities, a name on a card.
   */
  allow?: "name";
};

/** The single-line field's props — the base of the password and masked fields. */
export type InputFieldProps = Base & Adornments & Omit<React.ComponentProps<"input">, "id" | "prefix"> & { as?: "input" };

type TextareaProps = Base & Omit<React.ComponentProps<"textarea">, "id"> & { as: "textarea" };

/**
 * The text inset that makes room for the adornment. Short text is measured in
 * `ch`; an icon has the fixed 18px of its cell. The adornment sits over the
 * field, not beside it, so the `input` stays the 44px box that takes touch
 * and focus.
 */
function inset(node: React.ReactNode): string {
  const isText = typeof node === "string" || typeof node === "number";
  return isText ? `calc(${String(node).length}ch + 1.25rem)` : "2.5rem";
}

export function Field(props: InputFieldProps | TextareaProps) {
  const { label, hint, error, hiddenLabel, className, as, ...rest } = props;

  const base = useId();
  const id = `${base}-field`;
  const hintId = `${base}-hint`;
  const errorId = `${base}-error`;
  const prefixId = `${base}-prefix`;
  const suffixId = `${base}-suffix`;
  const statusId = `${base}-status`;
  const limitId = `${base}-limit`;

  // The caller's `aria-invalid` and `aria-describedby` add up, never get
  // dropped: the phone field shows its error on a line spanning the country
  // and the number, outside the field, and must paint the border and link it.
  const external = rest as React.AriaAttributes;
  const invalid = Boolean(error) || external["aria-invalid"] === true || external["aria-invalid"] === "true";

  // The counter only exists on a text area with a limit. The length comes from
  // the controlled value when there is one; otherwise from what was typed.
  const textareaProps = as === "textarea" ? (rest as React.ComponentProps<"textarea">) : null;
  const maxLength = textareaProps?.maxLength;
  const [typed, setLength] = useState(() => String(textareaProps?.defaultValue ?? "").length);
  const length = textareaProps?.value !== undefined ? String(textareaProps.value).length : typed;

  const {
    prefix: prefixProp,
    suffix,
    endAction,
    icon,
    status,
    loadingLabel = m.processing,
    validLabel = m.confirmed,
    allow,
    ...inputRest
  } = as === "textarea" ? ({} as Adornments) : (rest as Adornments);
  const isText = (n: React.ReactNode) => typeof n === "string" || typeof n === "number";

  const Icon = icon ? FIELD_ICONS[icon] : null;
  const prefix = Icon ? <Icon size={18} /> : prefixProp;
  const loading = status === "loading";

  // The right end: one place, one thing. The button never leaves; then, what
  // is happening now (processing) beats what went wrong, which beats what went
  // right, which beats the suffix.
  const end = endAction
    ? "action"
    : loading
      ? "loading"
      : invalid
        ? "invalid"
        : status === "valid"
          ? "valid"
          : suffix
            ? "suffix"
            : null;

  // Order matters: a screen reader reads in the declared order, and the error
  // comes first because it changes what the person must do now. The text
  // adornment comes after: "$" completes the label, it does not replace it.
  // Inside a disabled group, the reason is the group's hint.
  const { reasonId } = useFieldsetState();
  const describedBy =
    [
      describedByOf({ hintId, errorId }, hint, error),
      external["aria-describedby"],
      reasonId,
      isText(prefix) ? prefixId : null,
      end === "suffix" && isText(suffix) ? suffixId : null,
      end === "valid" ? statusId : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  // Read-only as declared by the caller — not the lock while processing, which
  // is transient and already has the spinner to say so.
  const readOnly = Boolean(
    (inputRest as React.ComponentProps<"input">).readOnly ?? (rest as React.ComponentProps<"textarea">).readOnly,
  );

  const control = cn(
    // `field-text`: 16px on phones, so iOS does not zoom.
    "field-text w-full rounded-md border-2 px-3 py-2 text-primary",
    // **Read-only has its own look**: a recessed background and a light
    // border — "filled in, and not yours to change". The text keeps full
    // color: the value is for reading and is submitted, which is what sets it
    // apart from disabled, which fades everything.
    readOnly ? "bg-surface-sunken" : "bg-surface",
    // Focus lights the border itself (the `field-glow` utility).
    "field-glow",
    "placeholder:text-subtle",
    "disabled:cursor-not-allowed disabled:opacity-50",
    loading && "cursor-progress",
    // **Read-only takes no focus**: a field nobody writes in does not ask for
    // "you are here". It leaves the Tab order (`tabIndex` below) and, if a
    // click focuses it to select and copy, draws no indicator. The value stays
    // visible, labeled and read by screen readers.
    readOnly && "cursor-default focus-visible:outline-none",
    // `enabled:` — a disabled field that changes border on hover says "you can
    // click" while its opacity says the opposite.
    invalid ? "border-error" : readOnly ? "border-border" : "border-border-strong enabled:hover:border-accent",
    className,
  );
  const adornment = "field-text pointer-events-none absolute top-1/2 flex -translate-y-1/2 items-center text-secondary";

  return (
    <div className="w-full">
      <label htmlFor={id} className={cn("mb-1.5 block text-sm font-medium text-primary", hiddenLabel && "sr-only")}>
        {label}
      </label>

      {as === "textarea" ? (
        <AutoTextarea
          {...(rest as React.ComponentProps<"textarea">)}
          id={id}
          // Every field has a ceiling; the counter only shows when the caller
          // declared the limit.
          maxLength={maxLength ?? TEXT_LIMITS.textarea}
          aria-invalid={invalid || undefined}
          aria-describedby={[describedBy, maxLength ? limitId : null].filter(Boolean).join(" ") || undefined}
          // Same rule as the input: read-only leaves the Tab order.
          tabIndex={readOnly ? -1 : (rest as React.ComponentProps<"textarea">).tabIndex}
          className={control}
          onLength={setLength}
        />
      ) : (
        <div className="relative">
          {prefix ? (
            // Always `aria-hidden`: the text arrives through `aria-describedby`,
            // which reads hidden content. Without this, "$" would be read twice.
            <span id={prefixId} aria-hidden className={cn(adornment, "left-3")}>
              {prefix}
            </span>
          ) : null}
          <input
            {...(inputRest as React.ComponentProps<"input">)}
            id={id}
            // Every free-text field has a ceiling, even when nobody asked.
            maxLength={
              (inputRest as React.ComponentProps<"input">).maxLength ??
              (allow === "name" ? NAME_LIMIT : defaultMaxLength((inputRest as React.ComponentProps<"input">).type))
            }
            onChange={(event) => {
              if (allow === "name") {
                const input = event.currentTarget;
                const kept = keepNameCharacters(input.value);
                if (kept !== input.value) {
                  // Keep the caret where the person was typing, minus what was dropped.
                  const caret = (input.selectionStart ?? input.value.length) - (input.value.length - kept.length);
                  input.value = kept;
                  input.setSelectionRange(caret, caret);
                }
              }
              (inputRest as React.ComponentProps<"input">).onChange?.(event);
            }}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            aria-busy={loading || undefined}
            // Read-only, not disabled, while processing.
            readOnly={loading || (inputRest as React.ComponentProps<"input">).readOnly}
            tabIndex={readOnly ? -1 : (inputRest as React.ComponentProps<"input">).tabIndex}
            className={control}
            style={{
              minHeight: "var(--tap-target)",
              paddingLeft: prefix ? inset(prefix) : undefined,
              paddingRight:
                end === "action"
                  ? // The button takes the 44px square at the end.
                    "var(--tap-target)"
                  : end === "suffix"
                    ? inset(suffix)
                    : end
                      ? "2.5rem"
                      : undefined,
              ...rest.style,
            }}
          />
          {end === "action" ? (
            <span className="absolute inset-y-0 right-0 flex items-center">{endAction}</span>
          ) : end === "suffix" ? (
            <span id={suffixId} aria-hidden className={cn(adornment, "right-3")}>
              {suffix}
            </span>
          ) : end ? (
            // Decorative: what they say arrives through the live region below
            // and through the error message, which has its own glyph and text.
            <span aria-hidden className={cn(adornment, "right-3")}>
              {end === "loading" ? (
                <Spinner size={18} />
              ) : end === "invalid" ? (
                <CircleX size={18} className="text-error" />
              ) : (
                <CircleCheck size={18} className="text-success" />
              )}
            </span>
          ) : null}
          {status !== undefined ? (
            // Always mounted, even empty: a live region born with its text is not announced.
            <span id={statusId} role="status" className="sr-only">
              {loading ? loadingLabel : status === "valid" ? validLabel : ""}
            </span>
          ) : null}
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <FieldMessages hintId={hintId} errorId={errorId} hint={hint} error={error} className="min-w-0" />
        {maxLength ? (
          <>
            {/* The number changes on every key, so it is not announced: the
                limit is read once, through the field's description. */}
            <span
              aria-hidden
              className={cn("mt-1.5 ml-auto shrink-0 text-sm tabular-nums", length > maxLength ? "font-medium text-error" : "text-subtle")}
            >
              {length}/{maxLength}
            </span>
            <span id={limitId} className="sr-only">
              {m.upTo(maxLength)}
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
}

/**
 * The text area that grows while the person writes: **3 to 8 lines**, with
 * inner scrolling after that, and **no resize handle** — the handle does not
 * exist on phones, and without a limit the box would push the whole screen.
 *
 * The height is measured from `scrollHeight`, not `field-sizing: content`,
 * which not every browser supports. The floor and ceiling are CSS (`lh` is one
 * line of the field itself), applied on top of the computed height.
 */
function AutoTextarea({
  onLength,
  onInput,
  className,
  ...props
}: React.ComponentProps<"textarea"> & { onLength: (n: number) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const fit = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const cs = getComputedStyle(el);
    const borders = Number.parseFloat(cs.borderTopWidth) + Number.parseFloat(cs.borderBottomWidth);
    el.style.height = `${el.scrollHeight + borders}px`;
  };

  // Width changes line wrapping: the observer recomputes when the field
  // narrows or widens. Running with the height already right changes nothing,
  // so there is no loop.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // A controlled value changes without a typing event.
  useEffect(fit, [props.value]);

  return (
    <textarea
      {...props}
      ref={ref}
      rows={3}
      onInput={(e) => {
        fit();
        onLength(e.currentTarget.value.length);
        onInput?.(e);
      }}
      className={cn(
        className,
        // `block`: inline, a textarea leaves descender space below, and the
        // hint would sit lower than on other fields.
        "block resize-none overflow-y-auto",
        "min-h-[calc(3lh+1.25rem)] max-h-[calc(8lh+1.25rem)]",
      )}
    />
  );
}
