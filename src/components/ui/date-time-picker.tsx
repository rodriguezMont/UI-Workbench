import { useState } from "react";

import { cn } from "@/lib/cn";
import { joinDateTime, splitDateTime } from "@/lib/date-time";
import { messages } from "@/messages";

import { DatePicker } from "./date-picker";
import { Fieldset } from "./fieldset";
import { TimePicker } from "./time-picker";

const m = messages.ui.dateTimePicker;

/**
 * Date and time together: **the [date](./date-picker.tsx) and the
 * [time](./time-picker.tsx) side by side, in a group**, not a third control.
 *
 * **Why two pieces and not one panel** with a calendar and a clock. Each half
 * already solves its own keyboard, error and touch; a single panel would need
 * a third keyboard, and whoever only wants to change the time would have to
 * cross the calendar. Side by side, each one changes on its own.
 *
 * **The group is a `<fieldset>`** ([fieldset](./fieldset.tsx)): a screen
 * reader hears "Meeting starts, group" on entering it, then "Date" and
 * "Time". The hint and the error of the whole — "the end comes after the
 * start" — belong to the group; the error of a typed date stays under the date.
 *
 * **The submission is `yyyy-mm-ddTHH:mm`**, the format of
 * `<input type="datetime-local">`, with no time zone (see `date-time.ts`).
 * **One part missing, the value is empty**: half a date and half a time are
 * not a moment.
 *
 * On phones the two stack; from `sm` up the date takes the wider column,
 * because its text is longer than "2:30 PM".
 */
export function DateTimePicker({
  label,
  hint,
  error,
  name,
  value,
  defaultValue,
  onValueChange,
  min,
  max,
  step,
  minTime,
  maxTime,
  disabled,
  className,
}: {
  label: string;
  hint?: string;
  /** The error of the whole group. */
  error?: string;
  /** Name in the submission — it carries `yyyy-mm-ddTHH:mm`. */
  name?: string;
  value?: string;
  defaultValue?: string;
  /** Receives `yyyy-mm-ddTHH:mm`, or empty while a part is missing. */
  onValueChange?: (value: string) => void;
  /** First and last dates, `yyyy-mm-dd`. */
  min?: string;
  max?: string;
  /** The time step, in minutes. */
  step?: number;
  /** The time range, `HH:mm`. */
  minTime?: string;
  maxTime?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [parts, setParts] = useState(() => splitDateTime(value ?? defaultValue ?? ""));

  // Controlled: the outside value rules when it is complete, or when it is
  // cleared. While the person fills only one part, the outside value is empty
  // and must not erase the other.
  const [seen, setSeen] = useState(value);
  if (value !== seen) {
    setSeen(value);
    if (value !== undefined && joinDateTime(parts.date, parts.time) !== value) {
      setParts(value ? splitDateTime(value) : { date: "", time: "" });
    }
  }

  function change(next: { date: string; time: string }) {
    const before = joinDateTime(parts.date, parts.time);
    setParts(next);
    const after = joinDateTime(next.date, next.time);
    if (after !== before) onValueChange?.(after);
  }

  return (
    <Fieldset legend={label} hint={hint} error={error} disabled={disabled} className={className}>
      {name ? <input type="hidden" name={name} value={joinDateTime(parts.date, parts.time)} /> : null}
      <div className={cn("grid items-start gap-3", "sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]")}>
        <DatePicker
          label={m.date}
          value={parts.date}
          onValueChange={(date) => change({ ...parts, date })}
          min={min}
          max={max}
          disabled={disabled}
        />
        <TimePicker
          label={m.time}
          value={parts.time}
          onValueChange={(time) => change({ ...parts, time })}
          step={step}
          min={minTime}
          max={maxTime}
          disabled={disabled}
        />
      </div>
    </Fieldset>
  );
}
