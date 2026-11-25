import { useId, useState } from "react";
import { Minus, Plus, type LucideIcon } from "lucide-react";
import { Slider as Radix } from "radix-ui";

import { cn } from "@/lib/cn";
import { nudge } from "@/lib/slider";
import { messages } from "@/messages";

import { Button } from "./button";
import { FieldMessages, describedByOf, useFieldsetState } from "./fieldset";

const m = messages.ui.slider;

type SliderProps = {
  label: string;
  hint?: React.ReactNode;
  error?: string;
  /** Name in the form submission. */
  name?: string;
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /** When the person lets go of the thumb — to save without saving on every pixel. */
  onValueCommit?: (value: number) => void;
  min?: number;
  max?: number;
  /** The step of dragging and of the arrow keys. */
  step?: number;
  /** The step of the buttons. Defaults to the drag's. */
  buttonStep?: number;
  /** The value as it reads: `25 mi`, `125%`. It also goes to screen readers. */
  formatValue?: (value: number) => string;
  /** The readout at the end of the label. */
  showValue?: boolean;
  /**
   * The label leaves the screen and stays for listeners only — when the piece
   * around it already says what the slider adjusts (an image cropper's zoom).
   */
  hiddenLabel?: boolean;
  /** The minimum and the maximum written under the track. */
  showBounds?: boolean;
  /** The − and the +. */
  buttons?: boolean;
  decreaseIcon?: LucideIcon;
  increaseIcon?: LucideIcon;
  /** Defaults to "Decrease {label}". */
  decreaseLabel?: string;
  /** Defaults to "Increase {label}". */
  increaseLabel?: string;
  disabled?: boolean;
  className?: string;
};

/**
 * The slider: **one value in a continuous range**, with a button on each side.
 *
 * **Why not `<input type="range">`.** The track and the thumb belong to the
 * operating system, and `accent-color` only changes the color. Dragging, the
 * keyboard and ARIA come from **Radix's Slider** (already in `radix-ui`); the
 * look comes from the tokens.
 *
 * **Every gesture has a button.** Dragging asks for a precision not every
 * finger has, and − and + move one step per tap — the button's step can be
 * larger than the drag's (a zoom moves 25% per tap and 1% per drag). At an
 * end, that side's button turns off.
 *
 * **The keyboard follows the ARIA pattern**: arrows move one step, Page Up and
 * Page Down move ten, Home and End go to the ends.
 *
 * **The value is read and heard.** The readout sits at the end of the label
 * ("25 mi"), and the thumb says the same through `aria-valuetext` — "25" alone
 * does not say of what. The ends of the range can show under the track.
 *
 * **The thumb is a 20px dot with a 44px touch area**, and the filled track is
 * the signal color. Hint and error come from `FieldMessages`, as in every
 * field; the form submits the number through Radix's hidden input.
 */
export function Slider({
  label,
  hint,
  error,
  name,
  value,
  defaultValue,
  onValueChange,
  onValueCommit,
  min = 0,
  max = 100,
  step = 1,
  buttonStep,
  formatValue = String,
  showValue = true,
  hiddenLabel = false,
  showBounds = false,
  buttons = true,
  decreaseIcon: DecreaseIcon = Minus,
  increaseIcon: IncreaseIcon = Plus,
  decreaseLabel,
  increaseLabel,
  disabled,
  className,
}: SliderProps) {
  const base = useId();
  const labelId = `${base}-label`;
  const ids = { hintId: `${base}-hint`, errorId: `${base}-error` };

  const [inner, setInner] = useState(defaultValue ?? min);
  const current = value ?? inner;
  const range = { min, max, step };
  const { reasonId } = useFieldsetState();
  const describedBy = [describedByOf(ids, hint, error), reasonId].filter(Boolean).join(" ") || undefined;

  function change(next: number) {
    if (value === undefined) setInner(next);
    onValueChange?.(next);
  }

  function move(delta: number) {
    const next = nudge(current, delta, range);
    if (next === current) return;
    change(next);
    // A button is a single tap: it already is the "let go".
    onValueCommit?.(next);
  }

  const tapStep = buttonStep ?? step;

  return (
    <div className={cn("w-full", className)}>
      {hiddenLabel && !showValue ? (
        <span id={labelId} className="sr-only">
          {label}
        </span>
      ) : (
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          <span id={labelId} className={cn("text-sm font-medium text-primary", hiddenLabel && "sr-only")}>
            {label}
          </span>
          {showValue ? (
            // For sighted users only: listeners get the same text from the
            // thumb. It follows the track: red on error, faded when disabled.
            <span aria-hidden className={cn("shrink-0 text-sm font-medium tabular-nums", error ? "text-error" : "text-signal-label", disabled && "opacity-50")}>
              {formatValue(current)}
            </span>
          ) : null}
        </div>
      )}

      <div className={cn("flex items-center", buttons && "gap-1")}>
        {buttons ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={decreaseLabel ?? m.decrease(label)}
            disabled={disabled || current <= min}
            onClick={() => move(-tapStep)}
          >
            <DecreaseIcon size={20} aria-hidden />
          </Button>
        ) : null}

        <div className={cn("min-w-0 flex-1", buttons && "px-2")}>
          <Radix.Root
            name={name}
            min={min}
            max={max}
            step={step}
            value={[current]}
            onValueChange={([v]) => v !== undefined && change(v)}
            onValueCommit={([v]) => v !== undefined && onValueCommit?.(v)}
            disabled={disabled}
            className={cn(
              "relative flex w-full touch-none select-none items-center",
              "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
            )}
            style={{ minHeight: "var(--tap-target)" }}
          >
            <Radix.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-border">
              <Radix.Range className={cn("absolute h-full", error ? "bg-error-fill" : "bg-signal")} />
            </Radix.Track>
            <Radix.Thumb
              aria-labelledby={labelId}
              aria-describedby={describedBy}
              aria-valuetext={formatValue(current)}
              aria-invalid={error ? true : undefined}
              // Radix only sets `data-disabled`: without this, listeners get
              // a disabled slider as if it worked.
              aria-disabled={disabled || undefined}
              className={cn(
                // A 20px dot with a 44px touch area: the `touch-area` `::after`.
                "touch-area relative block size-5 cursor-grab rounded-full border-2 bg-surface shadow-md",
                "transition-[box-shadow,scale] duration-[var(--motion-fast)] ease-[var(--motion-ease)]",
                "hover:scale-110 active:cursor-grabbing active:scale-110",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]",
                "data-[disabled]:cursor-not-allowed data-[disabled]:hover:scale-100",
                error ? "border-error" : "border-signal",
              )}
            />
          </Radix.Root>
          {showBounds ? (
            // For sighted users only: screen readers already hear the minimum
            // and the maximum through `aria-valuemin` and `aria-valuemax`.
            <div aria-hidden className="-mt-1.5 flex justify-between text-xs tabular-nums text-subtle">
              <span>{formatValue(min)}</span>
              <span>{formatValue(max)}</span>
            </div>
          ) : null}
        </div>

        {buttons ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={increaseLabel ?? m.increase(label)}
            disabled={disabled || current >= max}
            onClick={() => move(tapStep)}
          >
            <IncreaseIcon size={20} aria-hidden />
          </Button>
        ) : null}
      </div>

      <FieldMessages {...ids} hint={hint} error={error} />
    </div>
  );
}
