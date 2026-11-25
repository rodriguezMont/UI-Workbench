import { useState } from "react";
import { Check, FolderInput, Menu, MoreHorizontal, Pencil, Share2, Sparkles, Trash2 } from "lucide-react";

import {
  ActionMenu,
  ActionMenuContent,
  ActionMenuItem,
  ActionMenuLabel,
  ActionMenuSeparator,
  ActionMenuTrigger,
} from "@/components/ui/action-menu";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Overlay, OverlayContent, OverlayTrigger } from "@/components/ui/overlay";
import { FullScreenPanel } from "@/components/ui/overlay/full-screen-panel";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SideMenu } from "@/components/ui/side-menu";
import { toast } from "@/components/ui/toast";
import { messages } from "@/messages";

import { Sample, Section } from "./Section";

const t = messages.workbench.overlay;

function Responsive() {
  return (
    <Sample title={t.responsive.title} note={t.responsive.note}>
      <div>
        <Overlay>
          <OverlayTrigger>
            <Button variant="secondary">{t.responsive.open}</Button>
          </OverlayTrigger>
          <OverlayContent
            title={t.responsive.heading}
            description={t.responsive.description}
            actions={[
              { label: t.responsive.apply, onSelect: () => toast.success(t.responsive.applied) },
              { label: t.responsive.clear, tone: "ghost" },
            ]}
          >
            <ul className="flex flex-col">
              {t.responsive.options.map((option) => (
                <li key={option} className="flex min-h-[var(--tap-target)] items-center border-b border-border text-sm">
                  {option}
                </li>
              ))}
            </ul>
          </OverlayContent>
        </Overlay>
      </div>
    </Sample>
  );
}

function Alert() {
  return (
    <Sample title={t.alert.title} note={t.alert.note}>
      <div>
        <Overlay kind="alert">
          <OverlayTrigger>
            <Button variant="secondary">
              <Trash2 size={16} aria-hidden />
              {t.alert.open}
            </Button>
          </OverlayTrigger>
          <OverlayContent
            title={t.alert.heading}
            description={t.alert.description}
            actions={[
              { label: t.alert.confirm, tone: "destructive", onSelect: () => toast(t.alert.done) },
              { label: t.alert.cancel, tone: "secondary", cancel: true },
            ]}
          />
        </Overlay>
      </div>
    </Sample>
  );
}

function Dialogs() {
  return (
    <Sample title={t.dialog.title}>
      <div className="flex flex-wrap gap-3">
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

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary">
              <Sparkles size={16} aria-hidden />
              {t.dialog.celebrate}
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
      </div>
    </Sample>
  );
}

function SheetSample() {
  return (
    <Sample title={t.sheet.title}>
      <div>
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
      </div>
    </Sample>
  );
}

function FullScreen() {
  const [open, setOpen] = useState(false);
  return (
    <Sample title={t.fullScreen.title}>
      <div>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          {t.fullScreen.open}
        </Button>
        {open ? (
          <FullScreenPanel title={t.fullScreen.heading} onClose={() => setOpen(false)}>
            <p className="p-4 text-sm text-secondary">{t.fullScreen.body}</p>
          </FullScreenPanel>
        ) : null}
      </div>
    </Sample>
  );
}

function SideMenuSample() {
  const [open, setOpen] = useState(false);
  return (
    <Sample title={t.sideMenu.title} note={t.sideMenu.note}>
      <div>
        <Button variant="secondary" onClick={() => setOpen(true)} className="md:hidden" aria-expanded={open}>
          <Menu size={18} aria-hidden />
          {t.sideMenu.open}
        </Button>
        <SideMenu open={open} onOpenChange={setOpen} label={t.sideMenu.label} title={<span className="font-bold">{messages.workbench.title}</span>}>
          <nav aria-label={t.sideMenu.label} className="flex flex-col p-2">
            {t.sideMenu.items.map((item) => (
              <a
                key={item}
                href="#overlay"
                onClick={() => setOpen(false)}
                className="flex min-h-[var(--tap-target)] items-center rounded-md px-3 text-sm text-primary hover:bg-surface-hover"
              >
                {item}
              </a>
            ))}
          </nav>
        </SideMenu>
      </div>
    </Sample>
  );
}

function ActionMenuSample() {
  const ran = (label: string) => () => toast(`${t.actionMenu.ran}: ${label}`);
  return (
    <Sample title={t.actionMenu.title}>
      <div>
        <ActionMenu>
          <ActionMenuTrigger asChild>
            <Button variant="secondary" size="icon" aria-label={t.actionMenu.trigger}>
              <MoreHorizontal size={18} aria-hidden />
            </Button>
          </ActionMenuTrigger>
          <ActionMenuContent align="start">
            <ActionMenuLabel>{t.actionMenu.group}</ActionMenuLabel>
            <ActionMenuItem icon={Pencil} onSelect={ran(t.actionMenu.rename)}>
              {t.actionMenu.rename}
            </ActionMenuItem>
            <ActionMenuItem icon={Share2} onSelect={ran(t.actionMenu.share)}>
              {t.actionMenu.share}
            </ActionMenuItem>
            <ActionMenuItem icon={FolderInput} disabled description={t.actionMenu.moveDisabled}>
              {t.actionMenu.move}
            </ActionMenuItem>
            <ActionMenuSeparator />
            <ActionMenuItem icon={Trash2} destructive onSelect={ran(t.actionMenu.delete)}>
              {t.actionMenu.delete}
            </ActionMenuItem>
          </ActionMenuContent>
        </ActionMenu>
      </div>
    </Sample>
  );
}

export function OverlaySection() {
  return (
    <Section id="overlay" heading={t.heading} intro={t.intro}>
      <div className="flex flex-col gap-8">
        <div className="grid gap-8 md:grid-cols-2">
          <Responsive />
          <Alert />
        </div>
        <Separator />
        <div className="grid gap-8 md:grid-cols-2">
          <Dialogs />
          <SheetSample />
        </div>
        <Separator />
        <div className="grid gap-8 md:grid-cols-3">
          <FullScreen />
          <SideMenuSample />
          <ActionMenuSample />
        </div>
      </div>
    </Section>
  );
}
