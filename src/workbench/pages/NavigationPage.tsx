import { useState } from "react";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SideMenu } from "@/components/ui/side-menu";
import { messages } from "@/messages";

import { Piece, PieceNote, State } from "../Piece";
import { useShell } from "../Shell";
import { SectionPage } from "./SectionPage";

const t = messages.workbench.demos;

/**
 * The shell is this page's own frame, so its showcase drives the real one
 * through `useShell` instead of drawing a copy that could drift from it.
 */
function ShellControls() {
  const shell = useShell();
  if (!shell) return null;
  return (
    <>
      <Button variant="secondary" onClick={shell.toggleRail} className="max-md:hidden" aria-pressed={!shell.railOpen}>
        {shell.railOpen ? <PanelLeftClose size={18} aria-hidden /> : <PanelLeftOpen size={18} aria-hidden />}
        {shell.railOpen ? t.appShell.collapse : t.appShell.expand}
      </Button>
      <Button variant="secondary" onClick={shell.openDrawer} className="md:hidden">
        <Menu size={18} aria-hidden />
        {t.appShell.openDrawer}
      </Button>
    </>
  );
}

function SideMenuDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)} className="md:hidden" aria-expanded={open}>
        <Menu size={18} aria-hidden />
        {t.sideMenu.open}
      </Button>
      <SideMenu open={open} onOpenChange={setOpen} label={t.sideMenu.title} title={<span className="font-bold">{t.sideMenu.title}</span>}>
        <nav aria-label={t.sideMenu.title} className="flex flex-col p-2">
          {t.sideMenu.items.map((item) => (
            <a
              key={item}
              href="#side-menu"
              onClick={() => setOpen(false)}
              className="flex min-h-[var(--tap-target)] items-center rounded-md px-3 text-sm text-primary hover:bg-surface-hover"
            >
              {item}
            </a>
          ))}
        </nav>
      </SideMenu>
    </>
  );
}

export function NavigationPage() {
  return (
    <SectionPage id="navigation">
      <Piece id="app-shell">
        <State label={t.appShell.label} note={t.appShell.note}>
          <ShellControls />
        </State>
        <PieceNote>
          <p className="max-w-[var(--measure)]">{t.appShell.explain}</p>
        </PieceNote>
      </Piece>
      <Piece id="side-menu">
        <State label={t.sideMenu.label} note={t.sideMenu.note}>
          <SideMenuDemo />
        </State>
      </Piece>
    </SectionPage>
  );
}
