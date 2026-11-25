import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Check, Pencil, Share2, Sparkles, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Overlay, OverlayContent, OverlayTrigger } from "@/components/ui/overlay";
import { FullScreenPanel } from "@/components/ui/overlay/full-screen-panel";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "@/components/ui/toast";
import { normalize } from "@/lib/normalize";
import { messages } from "@/messages";

import { Piece, State } from "../Piece";
import { SectionPage } from "./SectionPage";

const t = messages.workbench.demos;

/**
 * The panel as a picker uses it: a search field that takes focus on opening,
 * a list that narrows as the person types, and focus back on the trigger when
 * the panel has gone — the panel leaves both jobs to whoever opens it.
 */
function FullScreenDemo() {
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

export function OverlayPage() {
  const toastKinds = ["info", "success", "warning", "error"] as const;

  return (
    <SectionPage id="overlay">
      <Piece id="overlay">
        <State label={t.overlay.default} note={t.overlay.defaultNote}>
          <Overlay>
            <OverlayTrigger>
              <Button variant="secondary">{t.overlay.open}</Button>
            </OverlayTrigger>
            <OverlayContent
              title={t.overlay.heading}
              description={t.overlay.description}
              actions={[
                { label: t.overlay.apply, onSelect: () => toast.success(t.overlay.applied) },
                { label: t.overlay.clear, tone: "ghost" },
              ]}
            >
              <ul className="flex flex-col">
                {t.overlay.options.map((option) => (
                  <li key={option} className="flex min-h-[var(--tap-target)] items-center border-b border-border text-sm">
                    {option}
                  </li>
                ))}
              </ul>
            </OverlayContent>
          </Overlay>
        </State>
        <State label={t.overlay.alert} note={t.overlay.alertNote}>
          <Overlay kind="alert">
            <OverlayTrigger>
              <Button variant="secondary">
                <Trash2 size={16} aria-hidden />
                {t.overlay.alertOpen}
              </Button>
            </OverlayTrigger>
            <OverlayContent
              title={t.overlay.alertHeading}
              description={t.overlay.alertDescription}
              actions={[
                { label: t.overlay.confirm, tone: "destructive", onSelect: () => toast(t.overlay.done) },
                { label: t.overlay.cancel, tone: "secondary", cancel: true },
              ]}
            />
          </Overlay>
        </State>
      </Piece>

      <Piece id="sheet">
        <State label={t.sheet.label} note={t.sheet.note}>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="secondary">
                <Share2 size={16} aria-hidden />
                {t.sheet.open}
              </Button>
            </SheetTrigger>
            <SheetContent title={t.sheet.heading} description={t.sheet.description}>
              <p className="text-sm text-secondary">{t.sheet.body}</p>
            </SheetContent>
          </Sheet>
        </State>
      </Piece>

      <Piece id="dialog">
        <State label={t.dialog.plain} note={t.dialog.plainNote}>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary">
                <Pencil size={16} aria-hidden />
                {t.dialog.open}
              </Button>
            </DialogTrigger>
            <DialogContent title={t.dialog.heading} description={t.dialog.description}>
              <Field label={t.dialog.name} defaultValue={t.dialog.nameValue} placeholder={t.dialog.namePlaceholder} />
              <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <DialogClose asChild>
                  <Button variant="secondary">{t.dialog.cancel}</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button onClick={() => toast.success(t.dialog.saved)}>{t.dialog.save}</Button>
                </DialogClose>
              </div>
            </DialogContent>
          </Dialog>
        </State>
        <State label={t.dialog.celebrate} note={t.dialog.celebrateNote}>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary">
                <Sparkles size={16} aria-hidden />
                {t.dialog.celebrateOpen}
              </Button>
            </DialogTrigger>
            <DialogContent
              title={t.dialog.celebrateHeading}
              description={t.dialog.celebrateText}
              media={
                <span className="flex size-10 items-center justify-center rounded-full bg-signal text-on-signal">
                  <Check size={20} aria-hidden />
                </span>
              }
            >
              <DialogClose asChild>
                <Button size="lg" className="w-full">
                  {t.dialog.celebrateDone}
                </Button>
              </DialogClose>
            </DialogContent>
          </Dialog>
        </State>
      </Piece>

      <Piece id="full-screen-panel">
        <State label={t.fullScreen.label} note={t.fullScreen.note}>
          <FullScreenDemo />
        </State>
      </Piece>

      <Piece id="toast">
        <State label={t.toast.label} note={t.toast.note} wide>
          {toastKinds.map((kind) => (
            <Button
              key={kind}
              variant="secondary"
              onClick={() =>
                kind === "error"
                  ? toast.error(t.toast.messages.error, { description: t.toast.errorDescription })
                  : toast[kind](t.toast.messages[kind])
              }
            >
              {t.toast[kind]}
            </Button>
          ))}
        </State>
      </Piece>
    </SectionPage>
  );
}
