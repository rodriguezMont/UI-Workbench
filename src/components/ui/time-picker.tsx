import { useMemo } from "react";

import { formatTime, timeSlots } from "@/lib/date-time";
import { messages } from "@/messages";

import { Select, type SelectOption } from "./select";

const m = messages.ui.timePicker;

/**
 * The time: **a list of times in steps**, not a clock face.
 *
 * **Why not `<input type="time">`.** The same reason as the date and the
 * select: its picker belongs to the operating system, and on some platforms it
 * is a wheel that scrolls minute by minute. Opening hours and appointments move
 * in 15 or 30 minutes, and a short list is picked with one tap.
 *
 * **It is the [select](./select.tsx) underneath**, not a new list: keyboard,
 * focus, colors, hint and error come from there. **Typing jumps**: with the
 * list open, "4" goes to 4:00 AM and "4:3" to 4:30 AM — the select's prefix
 * search, standing in for typing the time. The list opens on the chosen time,
 * never at the top.
 *
 * **On screen, 12 hours ("2:30 PM"); in the submission, `HH:mm` ("14:30")** —
 * the format of `<input type="time">`. A time off the step, coming from an
 * older value, is not lost: it joins the list in its place instead of
 * vanishing on the first click.
 */

type SelectProps = React.ComponentProps<typeof Select>;

type TimePickerProps = Omit<SelectProps, "options" | "multiple" | "value" | "defaultValue" | "onValueChange" | "icon" | "searchable"> & {
  /** `HH:mm`, 24-hour. */
  value?: string;
  defaultValue?: string;
  /** Receives `HH:mm`. */
  onValueChange?: (value: string) => void;
  /** Minutes between one time and the next. Default: 30. */
  step?: number;
  /** First time offered, `HH:mm`. */
  min?: string;
  /** Last time offered, `HH:mm`, included when it falls on the step. */
  max?: string;
};

export function TimePicker({ step, min, max, value, defaultValue, onValueChange, placeholder = m.placeholder, ...rest }: TimePickerProps) {
  const kept = value ?? defaultValue ?? "";
  const options = useMemo<SelectOption[]>(() => {
    const times = timeSlots({ step, min, max });
    // `HH:mm` sorts as text, so the kept time lands in its place.
    if (formatTime(kept) && !times.includes(kept)) {
      times.push(kept);
      times.sort();
    }
    return times.map((t) => ({ value: t, label: formatTime(t) }));
  }, [step, min, max, kept]);

  return (
    <Select
      {...rest}
      icon="time"
      placeholder={placeholder}
      options={options}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
    />
  );
}
