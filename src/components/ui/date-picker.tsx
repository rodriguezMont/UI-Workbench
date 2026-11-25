import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover } from "radix-ui";
import { DayPicker, type DayPickerLocale } from "react-day-picker";
import { enUS } from "react-day-picker/locale";

import { cn } from "@/lib/cn";
import {
  MONTH_NAMES,
  checkDate,
  dateToIso,
  displayToIso,
  isoToDate,
  isoToDisplay,
  monthAllowed,
  yearAllowed,
  yearPageStart,
  type DateBounds,
} from "@/lib/date-time";
import { scrollToFitBelow } from "@/lib/overlay";
import { locale, messages } from "@/messages";

import type { InputFieldProps } from "./field";
import { MaskedField } from "./masked-field";

const m = messages.ui.datePicker;

/**
 * The date: **typed, or picked from a calendar**, and both write the same
 * field.
 *
 * **Why not `<input type="date">`.** Its calendar is drawn by the operating
 * system, like the open list of a native `<select>`: no CSS reaches it, and it
 * looks different on every platform. The calendar here is **react-day-picker**
 * (MIT) without its stylesheet: the grid, the keyboard and the date math are
 * the library's; the look is ours, through the tokens.
 *
 * **Typing stays the shortest path.** The field is the
 * [masked field](./masked-field.tsx) (`MM/DD/YYYY`, numeric keyboard), and the
 * calendar button sits at its end, like the password eye. Whoever knows the
 * date types eight digits; whoever looks for "next Tuesday" opens the calendar.
 *
 * **The submission is `yyyy-mm-dd`**, in a hidden input — the format of
 * `<input type="date">`, which a server reads without guessing the order of
 * month and day. An incomplete, nonexistent or out-of-range date submits empty:
 * never a date the person did not see.
 *
 * **The error shows after leaving the field**, never on every key: "09/1" is
 * typing in progress, not a mistake. The caller's `error` wins.
 *
 * **The calendar keyboard is the ARIA grid's**: arrows move by day, Page Up and
 * Page Down change the month, Home and End go to the start and end of the
 * week, Enter picks, Escape closes and returns focus to the button. **The
 * month title opens the months, and the year opens the years** — see
 * `Calendar`. The week starts on Sunday, as US calendars do.
 */

type DatePickerProps = Omit<
  InputFieldProps,
  | "as"
  | "type"
  | "ref"
  | "value"
  | "defaultValue"
  | "onChange"
  | "min"
  | "max"
  | "name"
  | "icon"
  | "prefix"
  | "suffix"
  | "endAction"
  | "status"
  | "loadingLabel"
  | "validLabel"
> & {
  /** `yyyy-mm-dd`. Empty means "no date". */
  value?: string;
  defaultValue?: string;
  /** Receives `yyyy-mm-dd`, or empty while the typed date is not valid. */
  onValueChange?: (value: string) => void;
  /** Name in the form submission — it carries the `yyyy-mm-dd`. */
  name?: string;
  /** First accepted date, `yyyy-mm-dd`. */
  min?: string;
  /** Last accepted date, `yyyy-mm-dd`. */
  max?: string;
};

/** The value the text produces: only a valid date inside the bounds. */
function valueOf(text: string, bounds: DateBounds): string {
  return checkDate(text, bounds) === null ? (displayToIso(text) ?? "") : "";
}

/**
 * The calendar locale for each interface locale. **A map, not a loose
 * import:** the day `locale` gains another value, TypeScript asks for its
 * calendar here — a missing one breaks the build instead of showing up in the
 * wrong language. en-US starts the week on Sunday.
 */
const CALENDAR_LOCALES: Record<typeof locale, DayPickerLocale> = { "en-US": enUS };

const fullDate = new Intl.DateTimeFormat(locale, { dateStyle: "full" });
const weekdayShort = new Intl.DateTimeFormat(locale, { weekday: "short" });

export function DatePicker({
  value,
  defaultValue,
  onValueChange,
  name,
  min,
  max,
  error,
  disabled,
  readOnly,
  label,
  onBlur,
  ...rest
}: DatePickerProps) {
  const bounds = { min, max };
  const [text, setText] = useState(() => isoToDisplay(value ?? defaultValue ?? ""));
  const [left, setLeft] = useState(false);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("days");
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Open, the calendar must fit below the field: in a short window it fit on
  // neither side and the positioning pushed it off screen. Scroll only what is
  // missing — see `scrollToFitBelow`. One frame after mounting, which is when
  // the panel has a height; the positioner follows the scroll by itself.
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      const field = inputRef.current?.getBoundingClientRect();
      const panel = panelRef.current;
      if (!field || !panel) return;
      const by = scrollToFitBelow({
        anchorTop: field.top,
        anchorBottom: field.bottom,
        panelHeight: panel.offsetHeight,
        viewportHeight: window.innerHeight,
      });
      if (by > 0) window.scrollBy({ top: by, behavior: "instant" });
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  // A controlled value that changes from outside (a reset, a prefill) rewrites
  // the text — but only when it disagrees with what the text already produces;
  // otherwise every key of an incomplete date would erase what was typed.
  const [seen, setSeen] = useState(value);
  if (value !== seen) {
    setSeen(value);
    if (value !== undefined && valueOf(text, bounds) !== value) setText(isoToDisplay(value));
  }

  const current = valueOf(text, bounds);
  const ownError = left ? checkDate(text, bounds) : null;
  const selected = isoToDate(current);
  const today = dateToIso(new Date());
  const todayFits = (!min || today >= min) && (!max || today <= max);

  function write(next: string) {
    setText(next);
    const before = valueOf(text, bounds);
    const after = valueOf(next, bounds);
    if (after !== before) onValueChange?.(after);
  }

  function pick(day: Date | undefined) {
    // Clicking the selected day again would clear it: a calendar picks, the
    // field is where a date is erased.
    if (!day) return;
    write(isoToDisplay(dateToIso(day)));
    setLeft(true);
    setOpen(false);
  }

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        // Every opening starts on the days.
        if (next) setView("days");
      }}
    >
      {/* **No `Popover.Anchor`: the button is the anchor.** It sits at the
          right end of the field, sharing its bottom edge, so the panel opens
          in the same place. A separate anchor also makes Radix remount the
          trigger once while it registers, and a tap that lands during that
          remount hits a button that no longer exists. */}
      {name ? <input type="hidden" name={name} value={current} /> : null}
      <MaskedField
        {...rest}
        ref={inputRef}
        mask="date"
        icon="date"
        label={label}
        placeholder={rest.placeholder ?? m.placeholder}
        value={text}
        onValueChange={write}
        onBlur={(e) => {
          // Moving to the calendar button is not "done typing".
          if (e.relatedTarget?.closest("[data-calendar-toggle]")) return;
          setLeft(true);
          onBlur?.(e);
        }}
        error={error ?? ownError ?? undefined}
        disabled={disabled}
        readOnly={readOnly}
        endAction={
          <Popover.Trigger asChild>
            <button
              type="button"
              data-calendar-toggle
              aria-label={m.openCalendar(label)}
              aria-haspopup="dialog"
              disabled={disabled || readOnly}
              // Leaving the button for anywhere but the field means the person
              // is done. Without this, Tab, Tab left an invalid date silent.
              onBlur={(e) => {
                if (e.relatedTarget !== inputRef.current) setLeft(true);
              }}
              className={cn(
                "flex size-[var(--tap-target)] items-center justify-center rounded-md text-secondary",
                "transition-colors duration-[var(--motion-instant)] hover:text-accent",
                "focus-visible:outline-offset-[-6px] disabled:cursor-not-allowed disabled:opacity-50",
                open && "text-accent",
              )}
            >
              <CalendarDays size={18} aria-hidden />
            </button>
          </Popover.Trigger>
        }
      />
      <Popover.Portal>
        <Popover.Content
          ref={panelRef}
          // Aligned by the right edge, under the button that opened it: the
          // panel appears where the person tapped, not far from the finger.
          align="end"
          sideOffset={6}
          collisionPadding={8}
          aria-label={m.calendar(label)}
          // The library focuses the selected day (or today); Radix would take
          // focus to the first button, the previous-month arrow.
          onOpenAutoFocus={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => {
            // Escape in an upper view goes back one level; only the days close.
            if (view === "days") return;
            e.preventDefault();
            setView(view === "years" ? "months" : "days");
          }}
          className={cn(
            "z-50 rounded-lg border border-border bg-surface-raised p-3 floating-edge",
            "animate-[ui-fade-in_var(--motion-fast)_var(--motion-ease-out)]",
          )}
        >
          <Calendar selected={selected} onSelect={pick} min={min} max={max} view={view} onView={setView} />
          {todayFits ? (
            <div className="mt-2 flex justify-end border-t border-border pt-2">
              <button
                type="button"
                onClick={() => pick(new Date())}
                style={{ minHeight: "var(--tap-target)" }}
                className="rounded-md px-3 text-sm font-medium text-link underline underline-offset-2 hover:decoration-2"
              >
                {m.today}
              </button>
            </div>
          ) : null}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

type View = "days" | "months" | "years";

/** The first day of the month of `date`, pulled inside the bounds. */
function startingMonth(date: Date, first?: Date, last?: Date): Date {
  const d = first && date < first ? first : last && date > last ? last : date;
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

const cell = cn(
  "rounded-md text-sm tabular-nums",
  "transition-colors duration-[var(--motion-instant)] ease-[var(--motion-ease)]",
  "hover:bg-surface-highlight",
  "focus-visible:outline-offset-[-2px]",
);
// The selected, the current and the out-of-range cells look the same in the
// three views; in the days, the same classes go through react-day-picker's
// `[&>button]:` below.
const selectedCls = "bg-signal font-medium text-on-signal hover:bg-signal";
const currentCls = "font-bold ring-1 ring-inset ring-accent";
const outOfRangeCls = "cursor-not-allowed text-subtle line-through opacity-60 hover:bg-transparent";

const arrowCls = cn(
  "flex size-[var(--tap-target)] items-center justify-center rounded-md text-primary",
  "transition-colors duration-[var(--motion-instant)] ease-[var(--motion-ease)]",
  "hover:bg-surface-highlight hover:text-accent",
  // No `pointer-events-none`: an arrow with nowhere to go stays a target (the
  // click does nothing) instead of letting the tap fall through.
  "aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:bg-transparent aria-disabled:hover:text-primary",
);

/**
 * The calendar in three views: **days, months and years**.
 *
 * **The title is the shortcut.** "September 2026" opens the twelve months; in
 * the months, "2026" opens the years, twelve at a time. Picking goes down one
 * level, and Escape goes up one. Without it, a date of birth decades back
 * costs hundreds of arrow presses.
 *
 * **The days are react-day-picker's**, dressed by the tokens; the header and
 * the month and year grids are ours, because its own month and year picker is
 * a native `<select>`. **The three views share one size** — seven 44px cells
 * square — so the panel does not jump when the view changes.
 *
 * **The selected cell takes the signal fill**, the strongest mark. **The
 * current one is a ring** (today, this month, this year). Out of range fades
 * and is struck through: the strike is the shape, because opacity alone is
 * only color.
 */
function Calendar({
  selected,
  onSelect,
  min,
  max,
  view,
  onView,
}: {
  selected: Date | undefined;
  onSelect: (day: Date | undefined) => void;
  min?: string;
  max?: string;
  view: View;
  onView: (view: View) => void;
}) {
  const bounds = { min, max };
  const first = min ? isoToDate(min) : undefined;
  const last = max ? isoToDate(max) : undefined;
  const outside = [...(first ? [{ before: first }] : []), ...(last ? [{ after: last }] : [])];

  const [month, setMonth] = useState(() => startingMonth(selected ?? new Date(), first, last));
  const year = month.getFullYear();
  const mi = month.getMonth();
  const [page, setPage] = useState(() => yearPageStart(year));
  const now = new Date();

  function changeView(next: View) {
    // The years open on the page of the year in view.
    if (next === "years") setPage(yearPageStart(year));
    onView(next);
  }

  /** A chosen year keeps the month — or takes its first month that fits. */
  function goToYear(y: number) {
    const fits = Array.from({ length: 12 }, (_, i) => i).filter((i) => monthAllowed(y, i, bounds));
    const target = fits.includes(mi) ? mi : (fits[0] ?? mi);
    setMonth(new Date(y, target, 1));
  }

  // What the arrows and the title do, in each view.
  const steps = {
    days: {
      title: m.monthTitle(MONTH_NAMES[mi]!, year),
      previous: m.previousMonth,
      next: m.nextMonth,
      canGoBack: monthAllowed(mi === 0 ? year - 1 : year, (mi + 11) % 12, bounds),
      canGoForward: monthAllowed(mi === 11 ? year + 1 : year, (mi + 1) % 12, bounds),
      back: () => setMonth(new Date(year, mi - 1, 1)),
      forward: () => setMonth(new Date(year, mi + 1, 1)),
    },
    months: {
      title: String(year),
      previous: m.previousYear,
      next: m.nextYear,
      canGoBack: yearAllowed(year - 1, bounds),
      canGoForward: yearAllowed(year + 1, bounds),
      back: () => goToYear(year - 1),
      forward: () => goToYear(year + 1),
    },
    years: {
      title: `${page}–${page + 11}`,
      previous: m.previousYears,
      next: m.nextYears,
      canGoBack: yearAllowed(page - 1, bounds),
      canGoForward: yearAllowed(page + 12, bounds),
      back: () => setPage(page - 12),
      forward: () => setPage(page + 12),
    },
  }[view];

  return (
    <div className="text-primary">
      <div className="mb-2 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center">
        <button
          type="button"
          aria-label={steps.previous}
          aria-disabled={!steps.canGoBack || undefined}
          onClick={() => steps.canGoBack && steps.back()}
          className={arrowCls}
        >
          <ChevronLeft size={20} aria-hidden />
        </button>
        {view === "years" ? (
          <span className="justify-self-center text-sm font-bold">{steps.title}</span>
        ) : (
          <button
            type="button"
            onClick={() => changeView(view === "days" ? "months" : "years")}
            aria-label={view === "days" ? m.chooseMonth(steps.title) : m.chooseYear(steps.title)}
            style={{ minHeight: "var(--tap-target)" }}
            className={cn(
              "inline-flex items-center gap-1 justify-self-center rounded-md px-3 text-sm font-bold",
              "transition-colors duration-[var(--motion-instant)] ease-[var(--motion-ease)]",
              "hover:bg-surface-highlight hover:text-accent",
            )}
          >
            {steps.title}
            {/* The chevron says the title opens something. */}
            <ChevronDown size={16} aria-hidden />
          </button>
        )}
        <button
          type="button"
          aria-label={steps.next}
          aria-disabled={!steps.canGoForward || undefined}
          onClick={() => steps.canGoForward && steps.forward()}
          className={arrowCls}
        >
          <ChevronRight size={20} aria-hidden />
        </button>
      </div>

      {/* A change of month, year or page is heard: the title is a button, and
          screen readers do not announce a button whose text changes. */}
      <p role="status" className="sr-only">
        {steps.title}
      </p>

      {view === "days" ? (
        <DayPicker
          mode="single"
          locale={CALENDAR_LOCALES[locale]}
          weekStartsOn={0}
          selected={selected}
          onSelect={onSelect}
          month={month}
          onMonthChange={setMonth}
          startMonth={first}
          endMonth={last}
          disabled={outside}
          autoFocus
          hideNavigation
          showOutsideDays
          fixedWeeks
          components={{ MonthCaption: () => <></> }}
          formatters={{ formatWeekdayName: (day) => weekdayShort.format(day) }}
          labels={{
            labelGrid: (date) => m.monthTitle(MONTH_NAMES[date.getMonth()]!, date.getFullYear()),
            labelDayButton: (date, modifiers) => m.day(fullDate.format(date), Boolean(modifiers.today), Boolean(modifiers.selected)),
          }}
          classNames={{
            root: "animate-[ui-fade-in_var(--motion-fast)_var(--motion-ease-out)]",
            months: "",
            month: "",
            month_grid: "border-collapse",
            weekdays: "",
            weekday: "size-[var(--tap-target)] p-0 text-xs font-medium text-subtle",
            weeks: "",
            week: "",
            day: "size-[var(--tap-target)] p-0 text-center",
            day_button: cn(cell, "size-[var(--tap-target)] disabled:cursor-not-allowed disabled:hover:bg-transparent"),
            // The same three marks as the grids, spelled out: Tailwind only
            // generates a class that appears whole in the source.
            today: "[&>button]:font-bold [&>button]:ring-1 [&>button]:ring-inset [&>button]:ring-accent",
            selected: "[&>button]:bg-signal [&>button]:font-medium [&>button]:text-on-signal [&>button]:hover:bg-signal",
            outside: "[&>button]:text-subtle",
            disabled: "[&>button]:text-subtle [&>button]:line-through [&>button]:opacity-60",
            hidden: "invisible",
          }}
        />
      ) : view === "months" ? (
        <Grid
          // A fixed key: changing the year does not remount the grid, so focus
          // stays on the arrow — Enter, Enter moves two years instead of
          // picking a month.
          key="months"
          label={m.monthsOf(year)}
          items={MONTH_NAMES.map((name, i) => ({
            key: i,
            text: name,
            selected: i === mi,
            current: year === now.getFullYear() && i === now.getMonth(),
            outside: !monthAllowed(year, i, bounds),
          }))}
          onPick={(i) => {
            setMonth(new Date(year, i, 1));
            onView("days");
          }}
        />
      ) : (
        <Grid
          key="years"
          label={m.yearsOf(steps.title)}
          items={Array.from({ length: 12 }, (_, i) => page + i).map((y) => ({
            key: y,
            text: String(y),
            selected: y === year,
            current: y === now.getFullYear(),
            outside: !yearAllowed(y, bounds),
          }))}
          onPick={(y) => {
            goToYear(y);
            onView("months");
          }}
        />
      )}
    </div>
  );
}

/**
 * The months or years grid: twelve buttons in three columns, in the same
 * square as the days. **Arrows move** (sideways one cell, up and down one
 * row), skipping what is out of range; Enter picks. Focus starts on the
 * selected one.
 */
function Grid({
  label,
  items,
  onPick,
}: {
  label: string;
  items: { key: number; text: string; selected: boolean; current: boolean; outside: boolean }[];
  onPick: (key: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = ref.current;
    const target =
      grid?.querySelector<HTMLButtonElement>('[aria-pressed="true"]:not([aria-disabled])') ??
      grid?.querySelector<HTMLButtonElement>("button:not([aria-disabled])");
    target?.focus();
  }, []);

  function onKey(e: React.KeyboardEvent) {
    const step = ({ ArrowLeft: -1, ArrowRight: 1, ArrowUp: -3, ArrowDown: 3 } as Record<string, number>)[e.key];
    const buttons = [...(ref.current?.querySelectorAll("button") ?? [])];
    const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (!step || i < 0) return;
    e.preventDefault();
    let j = i + step;
    while (buttons[j]?.hasAttribute("aria-disabled")) j += step;
    buttons[j]?.focus();
  }

  return (
    <div
      ref={ref}
      role="group"
      aria-label={label}
      onKeyDown={onKey}
      className={cn(
        "grid size-[calc(var(--tap-target)*7)] grid-cols-3 grid-rows-4 gap-1",
        "animate-[ui-fade-in_var(--motion-fast)_var(--motion-ease-out)]",
      )}
    >
      {items.map((it) => (
        <button
          key={it.key}
          type="button"
          aria-pressed={it.selected}
          aria-current={it.current ? "date" : undefined}
          aria-disabled={it.outside || undefined}
          onClick={() => !it.outside && onPick(it.key)}
          className={cn(cell, it.current && currentCls, it.selected && selectedCls, it.outside && outOfRangeCls)}
        >
          {it.text}
        </button>
      ))}
    </div>
  );
}
