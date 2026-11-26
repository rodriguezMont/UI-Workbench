import { useRef, useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Field } from "@/components/ui/field";
import { Fieldset } from "@/components/ui/fieldset";
import { MaskedField } from "@/components/ui/masked-field";
import { PhoneField } from "@/components/ui/masked-field/phone-field";
import { Slider } from "@/components/ui/slider";
import { Switch, useSwitchSave } from "@/components/ui/switch";
import { TimePicker } from "@/components/ui/time-picker";
import { dateToIso, formatTime, isoToDisplay, splitDateTime } from "@/lib/date-time";
import { messages } from "@/messages";

const t = messages.workbench.demos;

/** The value that would be submitted, written under the piece. */
export function Submitted({ value, empty = t.masked.nothing }: { value: string; empty?: string }) {
  return (
    <p className="w-full text-xs text-secondary">
      {t.masked.submitted}: <code className="font-mono text-primary">{value || empty}</code>
    </p>
  );
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Fields as a form uses them: two columns, an icon on each, and the email
 * checked when the person leaves it — never on every key, when "jane@" is
 * typing in progress, not a mistake.
 */
export function FieldFormDemo() {
  const f = t.field;
  const [error, setError] = useState<string>();
  return (
    <div className="grid w-full gap-3 sm:grid-cols-2">
      <Field label={f.name} icon="name" placeholder={f.namePlaceholder} autoComplete="name" />
      <Field
        label={f.email}
        icon="email"
        type="email"
        placeholder={f.emailPlaceholder}
        autoComplete="email"
        error={error}
        onChange={() => setError(undefined)}
        onBlur={(e) => {
          const value = e.currentTarget.value;
          setError(value && !EMAIL.test(value) ? (value.includes("@") ? f.emailNoDomain : f.emailError) : undefined);
        }}
      />
      <Field label={f.website} icon="website" placeholder={f.websitePlaceholder} autoComplete="url" />
      <Field label={f.company} icon="business" placeholder={f.companyPlaceholder} autoComplete="organization" />
    </div>
  );
}

/** A pretend lookup: a few ZIP codes the demo knows. Nothing leaves the page. */
const ZIP_CITIES: Record<string, { city: string; state: string }> = {
  "90210": { city: "Beverly Hills", state: "CA" },
  "10001": { city: "New York", state: "NY" },
  "60601": { city: "Chicago", state: "IL" },
};

/**
 * The ZIP code as a form uses it: when the person leaves it, it looks the city
 * up (read-only, with a spinner, while it waits) and fills the city and state —
 * read-only, with the reason in their hint.
 */
export function ZipLookupDemo() {
  const m = t.masked;
  const [zip, setZip] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "found">("idle");
  const [error, setError] = useState<string>();
  const [place, setPlace] = useState<{ city: string; state: string }>();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function lookUp() {
    const digits = zip.replace(/\D/g, "").slice(0, 5);
    if (!digits) return;
    if (digits.length < 5) {
      setError(m.zipMissing(5 - digits.length));
      return;
    }
    setState("loading");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const found = ZIP_CITIES[digits];
      setState(found ? "found" : "idle");
      setPlace(found);
      setError(found ? undefined : m.zipUnknown);
    }, 900);
  }

  return (
    <div className="grid w-full gap-3 sm:grid-cols-2">
      <MaskedField
        mask="zip"
        label={m.zipLabel}
        icon="zip"
        placeholder="90210"
        hint={m.zipHint}
        error={error}
        value={zip}
        readOnly={state === "loading"}
        status={state === "loading" ? "loading" : state === "found" ? "valid" : "idle"}
        loadingLabel={m.zipLooking}
        validLabel={m.zipFound}
        onValueChange={(value) => {
          setZip(value);
          setError(undefined);
          setState("idle");
          setPlace(undefined);
        }}
        onBlur={lookUp}
      />
      <div className="grid grid-cols-[1fr_6rem] gap-3">
        <Field label={m.cityLabel} readOnly value={place?.city ?? ""} placeholder="Springfield" hint={place ? m.filledHint : undefined} />
        <Field label={m.stateLabel} readOnly value={place?.state ?? ""} placeholder="IL" />
      </div>
    </div>
  );
}

export function PhoneDemo() {
  const [value, setValue] = useState("");
  return (
    <div className="flex w-full flex-col gap-2">
      <PhoneField label={t.masked.intlLabel} hint={t.masked.intlHint} onValueChange={setValue} />
      <Submitted value={value} />
    </div>
  );
}

/** The parent box sums up its children: checked, unchecked or "some". */
export function IndeterminateDemo() {
  const c = t.checkbox;
  const items = c.notifications;
  const [on, setOn] = useState<readonly string[]>([items[0]!]);
  const all = on.length === items.length;
  return (
    <Fieldset legend={c.notificationsLegend}>
      <Checkbox label={c.allNotifications} checked={all} indeterminate={on.length > 0 && !all} onChange={() => setOn(all ? [] : items)} />
      <div className="pl-8">
        {items.map((item) => (
          <Checkbox
            key={item}
            label={item}
            checked={on.includes(item)}
            onChange={() =>
              setOn((current) => (current.includes(item) ? current.filter((i) => i !== item) : items.filter((i) => i === item || current.includes(i))))
            }
          />
        ))}
      </div>
    </Fieldset>
  );
}

/** A pretend server: answers after a moment, or fails on purpose. */
const pretendSave = (fails: boolean) => () =>
  new Promise<void>((resolve, reject) => setTimeout(() => (fails ? reject(new Error("demo")) : resolve()), 900));

/**
 * The failure is already on screen when the page loads — the state is what
 * the piece shows — and a tap runs it again: the switch moves, saves, fails
 * and goes back.
 */
export function FailedSwitchDemo() {
  const s = t.switch;
  const state = useSwitchSave(false, pretendSave(true));
  const [first, setFirst] = useState(true);
  return (
    <Switch
      label={s.calendar}
      checked={state.checked}
      saving={state.saving}
      error={first ? messages.ui.switch.saveFailed : state.error}
      onChange={(e) => {
        setFirst(false);
        state.onChange(e);
      }}
    />
  );
}

function Preference({ label, initial }: { label: string; initial: boolean }) {
  const state = useSwitchSave(initial, pretendSave(false));
  return <Switch label={label} {...state} />;
}

/** A settings list: each row saves on its own, with a line between rows. */
export function PreferencesDemo() {
  return (
    <div className="w-full divide-y divide-border">
      {t.switch.prefs.map((label, i) => (
        <Preference key={label} label={label} initial={i !== 1} />
      ))}
    </div>
  );
}

/** The slider with the number it would submit under it. */
export function SliderSubmittedDemo() {
  const s = t.slider;
  const [value, setValue] = useState(25);
  return (
    <div className="flex w-full flex-col gap-2">
      <Slider label={s.distance} name="distance" min={0} max={100} step={5} value={value} onValueChange={setValue} formatValue={s.miles} showBounds />
      <Submitted value={String(value)} />
    </div>
  );
}

/** A date picker with what it would submit under it. */
export function DateDemo({ initial = "" }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <div className="flex w-full flex-col gap-2">
      <DatePicker label={t.datePicker.start} defaultValue={initial} onValueChange={setValue} />
      <Submitted value={value} empty={t.datePicker.nothing} />
    </div>
  );
}

/** A date years back, bounded by today: the month title is the way there. */
export function FarDateDemo() {
  const [today] = useState(() => dateToIso(new Date()));
  return <DatePicker label={t.datePicker.founded} hint={t.datePicker.foundedHint} defaultValue="1998-04-12" max={today} />;
}

export function TimeDemo({ initial = "" }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <div className="flex w-full flex-col gap-2">
      <TimePicker label={t.timePicker.opens} defaultValue={initial || undefined} onValueChange={setValue} />
      <Submitted value={value} empty={t.timePicker.nothing} />
    </div>
  );
}

export function DateTimeDemo({ initial = "" }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <div className="flex w-full flex-col gap-2">
      <DateTimePicker label={t.dateTimePicker.starts} defaultValue={initial || undefined} onValueChange={setValue} />
      <Submitted value={value} empty={t.dateTimePicker.nothing} />
    </div>
  );
}

/**
 * A period: each end checks itself, and only the page, which sees both, can
 * say the end came first. The error belongs to the end's group.
 */
export function PeriodDemo() {
  const d = t.dateTimePicker;
  const [start, setStart] = useState("2026-09-20T09:00");
  const [end, setEnd] = useState("2026-09-18T18:00");
  const startParts = splitDateTime(start);
  const backwards = Boolean(start && end && end <= start);
  return (
    <div className="grid w-full gap-4 md:grid-cols-2">
      <DateTimePicker label={d.saleStarts} defaultValue={start} onValueChange={setStart} />
      <DateTimePicker
        label={d.saleEnds}
        defaultValue={end}
        onValueChange={setEnd}
        error={backwards ? d.endsBefore(isoToDisplay(startParts.date), formatTime(startParts.time)) : undefined}
      />
    </div>
  );
}
