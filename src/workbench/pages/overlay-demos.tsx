import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { ArrowUpDown, Check, ListFilter, MapPin, Pencil, Sparkles, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CheckboxList } from "@/components/ui/checkbox-list";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogTrigger,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Overlay, OverlayContent, OverlayTrigger } from "@/components/ui/overlay";
import { FullScreenPanel } from "@/components/ui/overlay/full-screen-panel";
import { Radio, RadioGroup } from "@/components/ui/radio-group";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "@/components/ui/toast";
import { normalize } from "@/lib/normalize";
import { messages } from "@/messages";

/**
 * The live demos of the Overlay section, kept apart from the section page so
 * the page stays a list of pieces and states.
 */

const t = messages.workbench.demos;

const FILTERS = t.overlay.options.map((o) => ({ value: o.label, label: o.label, count: o.count }));
const ALL = t.overlay.options.reduce((a, o) => a + o.count, 0);

/**
 * Filters as a list screen uses them: real checkboxes, long enough to scroll,
 * and the main action counting what it will show.
 */
export function FilterOverlayDemo() {
  const o = t.overlay;
  const [chosen, setChosen] = useState<string[]>([]);
  const count = chosen.length ? FILTERS.filter((f) => chosen.includes(f.value)).reduce((a, f) => a + f.count, 0) : ALL;
  return (
    <Overlay>
      <OverlayTrigger>
        <Button variant="secondary">
          <ListFilter size={16} aria-hidden />
          {o.open}
        </Button>
      </OverlayTrigger>
      <OverlayContent
        title={o.heading}
        description={o.description}
        actions={[
          { label: o.show(count), onSelect: () => toast.success(o.applied) },
          { label: o.clear, tone: "ghost", onSelect: () => setChosen([]) },
        ]}
      >
        <CheckboxList legend={o.heading} hiddenLegend options={FILTERS} value={chosen} onValueChange={setChosen} />
      </OverlayContent>
    </Overlay>
  );
}

export function AlertOverlayDemo() {
  const o = t.overlay;
  return (
    <Overlay kind="alert">
      <OverlayTrigger>
        <Button variant="secondary">
          <Trash2 size={16} aria-hidden />
          {o.alertOpen}
        </Button>
      </OverlayTrigger>
      <OverlayContent
        title={o.alertHeading}
        description={o.alertDescription}
        actions={[
          { label: o.confirm, tone: "destructive", icon: <Trash2 size={16} aria-hidden />, onSelect: () => toast(o.done) },
          { label: o.cancel, tone: "secondary", cancel: true },
        ]}
      />
    </Overlay>
  );
}

/** A sheet with real content: a choice, and the two ways out. */
export function SortSheetDemo() {
  const s = t.sheet;
  const [sort, setSort] = useState(s.sorts[0]!);
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="secondary">
          <ArrowUpDown size={16} aria-hidden />
          {s.open}
        </Button>
      </SheetTrigger>
      <SheetContent title={s.heading} description={s.description}>
        <RadioGroup legend={s.sortLegend} hiddenLegend value={sort} onValueChange={setSort}>
          {s.sorts.map((option) => (
            <Radio key={option} value={option} label={option} />
          ))}
        </RadioGroup>
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <SheetClose asChild>
            <Button variant="secondary">{s.cancel}</Button>
          </SheetClose>
          <SheetClose asChild>
            <Button onClick={() => toast.success(s.sorted(sort))}>{s.apply}</Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** A list longer than the sheet: scrolling it must not close it. */
export function CitySheetDemo() {
  const s = t.sheet;
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="secondary">
          <MapPin size={16} aria-hidden />
          {s.longOpen}
        </Button>
      </SheetTrigger>
      <SheetContent title={s.longHeading}>
        <ul className="-mx-1">
          {s.cities.map((city) => (
            <li key={city}>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  toast.success(s.chosen(city));
                }}
                className="flex w-full items-center border-b border-border px-1 text-left text-sm text-primary hover:bg-surface-hover"
                style={{ minHeight: "var(--tap-target)" }}
              >
                {city}
              </button>
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  );
}

export function RenameDialogDemo() {
  const d = t.dialog;
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <Pencil size={16} aria-hidden />
          {d.open}
        </Button>
      </DialogTrigger>
      <DialogContent title={d.heading} description={d.description}>
        <Field label={d.name} defaultValue={d.nameValue} placeholder={d.namePlaceholder} />
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <DialogClose asChild>
            <Button variant="secondary">{d.cancel}</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button onClick={() => toast.success(d.saved)}>{d.save}</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AlertDialogDemo() {
  const d = t.dialog;
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="secondary">
          <Trash2 size={16} aria-hidden />
          {d.alertOpen}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent title={d.alertHeading} description={d.alertText}>
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <AlertDialogCancel asChild>
            <Button variant="secondary">{d.cancel}</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="destructive" onClick={() => toast(d.deleted)}>
              <Trash2 size={16} aria-hidden />
              {d.alertConfirm}
            </Button>
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function CelebrationDialogDemo() {
  const d = t.dialog;
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <Sparkles size={16} aria-hidden />
          {d.celebrateOpen}
        </Button>
      </DialogTrigger>
      <DialogContent
        title={d.celebrateHeading}
        description={d.celebrateText}
        media={
          <span className="flex size-10 items-center justify-center rounded-full bg-signal text-on-signal">
            <Check size={20} aria-hidden />
          </span>
        }
      >
        <DialogClose asChild>
          <Button size="lg" className="w-full">
            {d.celebrateDone}
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The panel as a picker uses it: a search field that takes focus on opening,
 * a list that narrows as the person types, and focus back on the trigger when
 * the panel has gone — the panel leaves both jobs to whoever opens it.
 */
export function FullScreenDemo() {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [chosen, setChosen] = useState("");
  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const cities = t.select.timezoneOptions.filter((city) => normalize(city).includes(normalize(term.trim())));

  function openPanel() {
    // Synchronous, inside the tap: outside it, iOS does not open the keyboard.
    flushSync(() => setOpen(true));
    search.current?.focus();
  }

  return (
    <div className="flex flex-col gap-2">
      <Button ref={trigger} variant="secondary" onClick={openPanel}>
        {chosen || t.fullScreen.open}
      </Button>
      {open ? (
        <FullScreenPanel
          title={t.fullScreen.heading}
          onClose={() => setOpen(false)}
          onClosed={() => {
            setTerm("");
            trigger.current?.focus();
          }}
        >
          <div className="border-b border-border p-3">
            <Field
              ref={search}
              label={t.fullScreen.heading}
              hiddenLabel
              type="search"
              icon="search"
              autoComplete="off"
              placeholder={t.fullScreen.searchPlaceholder}
              value={term}
              onChange={(e) => setTerm(e.currentTarget.value)}
            />
          </div>
          <ul className="flex-1 overflow-y-auto">
            {cities.map((city) => (
              <li key={city}>
                <button
                  type="button"
                  onClick={() => {
                    setChosen(city);
                    setOpen(false);
                  }}
                  className="flex w-full items-center border-b border-border px-4 text-left text-sm text-primary hover:bg-surface-hover"
                  style={{ minHeight: "var(--tap-target)" }}
                >
                  {city}
                </button>
              </li>
            ))}
          </ul>
        </FullScreenPanel>
      ) : null}
    </div>
  );
}

const KINDS = ["info", "success", "warning", "error"] as const;

/** The four kinds, each with its description. */
export function ToastKindsDemo() {
  const k = t.toast;
  return (
    <div className="flex flex-wrap gap-2">
      {KINDS.map((kind) => (
        <Button key={kind} variant="secondary" onClick={() => toast[kind](k.messages[kind], { description: k.descriptions[kind] })}>
          {k[kind]}
        </Button>
      ))}
    </div>
  );
}

/** Three outcomes in a row: stacked on a computer, queued on a phone. */
export function ToastThreeDemo() {
  const k = t.toast;
  return (
    <Button
      variant="secondary"
      onClick={() => {
        toast.success(k.messages.success, { description: k.descriptions.success });
        toast.info(k.messages.info, { description: k.descriptions.info });
        toast.warning(k.messages.warning, { description: k.descriptions.warning });
      }}
    >
      {k.fireThree}
    </Button>
  );
}
