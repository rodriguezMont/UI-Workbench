import { useState } from "react";
import { Check, Pencil, Share2, Sparkles, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Overlay, OverlayContent, OverlayTrigger } from "@/components/ui/overlay";
import { FullScreenPanel } from "@/components/ui/overlay/full-screen-panel";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "@/components/ui/toast";
import { messages } from "@/messages";

import { Piece, State } from "../Piece";
import { SectionPage } from "./SectionPage";

const t = messages.workbench.demos;

function FullScreenDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        {t.fullScreen.open}
      </Button>
      {open ? (
        <FullScreenPanel title={t.fullScreen.heading} onClose={() => setOpen(false)}>
          <p className="p-4 text-sm text-secondary">{t.fullScreen.body}</p>
        </FullScreenPanel>
      ) : null}
    </>
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
        <State label={t.dialog.plain}>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary">
                <Pencil size={16} aria-hidden />
                {t.dialog.open}
              </Button>
            </DialogTrigger>
            <DialogContent title={t.dialog.heading} description={t.dialog.description}>
              <div className="mt-2 flex justify-end">
                <Button>{t.dialog.save}</Button>
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
              <Button className="w-full">{t.dialog.celebrateDone}</Button>
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
