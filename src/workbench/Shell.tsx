import { createContext, useContext, useEffect, useState } from "react";
import { Menu, Moon, PanelLeftClose, PanelLeftOpen, Sun } from "lucide-react";
import { NavLink } from "react-router";

import { Logo } from "@/components/brand/logo";
import { SideMenu } from "@/components/ui/side-menu";
import { Toaster } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { messages } from "@/messages";

import { useLedger } from "./ledger";
import { SECTIONS } from "./registry";
import { SECTION_ICONS } from "./section-icons";
import { setWorkbenchTheme, useWorkbenchTheme } from "./theme";

const m = messages.workbench;

/**
 * The workbench shell: a sticky header, a side panel that collapses on
 * desktop, and a drawer behind the hamburger on phones.
 *
 * The panel is as wide as the logo plus padding, so the panel's edge is the
 * line that separates the logo from the page title. Collapsed, the mark alone
 * stays, and each section is a 44px icon box.
 */
const RAIL_OPEN = "16rem";
const RAIL_CLOSED = "6rem";

/**
 * What the shell lets a page control. It exists for the shell's own showcase:
 * the shell is the frame and cannot fit inside a piece, so the piece drives
 * the real one instead of drawing a copy that could drift from it.
 */
type ShellControls = {
  railOpen: boolean;
  toggleRail: () => void;
  openDrawer: () => void;
};

const ShellContext = createContext<ShellControls | null>(null);

/** `null` outside the shell — the caller decides what to show without it. */
export function useShell() {
  return useContext(ShellContext);
}

function SectionLinks({ onNavigate, compact = false }: { onNavigate?: () => void; compact?: boolean }) {
  return (
    <ul className="space-y-1">
      {SECTIONS.map((section) => {
        const Icon = SECTION_ICONS[section.id];
        const box = compact ? "mx-auto size-11 justify-center" : "px-3 py-2";
        return (
          <li key={section.id}>
            {section.built ? (
              <NavLink
                to={`/${section.id}`}
                onClick={onNavigate}
                title={compact ? section.name : undefined}
                aria-label={compact ? section.name : undefined}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-md text-sm transition-colors duration-[var(--motion-instant)]",
                    box,
                    isActive
                      ? "bg-surface-hover font-medium text-accent-label [&>svg]:text-accent"
                      : "text-secondary hover:bg-surface-hover",
                  )
                }
              >
                <Icon size={compact ? 22 : 18} aria-hidden className="shrink-0" />
                {compact ? null : section.name}
              </NavLink>
            ) : (
              <span
                className={cn("flex cursor-not-allowed items-center gap-2 text-sm text-subtle", box)}
                title={compact ? m.shell.notBuiltNamed(section.name) : m.shell.notBuilt}
              >
                <Icon size={compact ? 22 : 18} aria-hidden className="shrink-0" />
                {compact ? null : section.name}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Light or dark, for whoever reviews. The icon says what the button DOES —
 * the moon turns on dark, the sun goes back to light — and `aria-pressed`
 * says the state.
 */
function ThemeToggle() {
  const dark = useWorkbenchTheme() === "dark";
  return (
    <button
      type="button"
      onClick={() => setWorkbenchTheme(dark ? "light" : "dark")}
      aria-label={m.shell.darkTheme}
      aria-pressed={dark}
      title={dark ? m.shell.toLight : m.shell.toDark}
      className="flex shrink-0 items-center justify-center rounded-md text-secondary transition-colors duration-[var(--motion-instant)] hover:bg-surface-hover hover:text-primary"
      style={{ width: "var(--tap-target)", height: "var(--tap-target)" }}
    >
      {dark ? <Sun size={20} aria-hidden /> : <Moon size={20} aria-hidden />}
    </button>
  );
}

/** The rule's colors, from the frame's corner outward. */
const STOPS = "var(--frame-rule-from) 0%, var(--frame-rule-via) 45%, var(--frame-rule-to) 100%";

const RULES = {
  // Down the panel's edge, top to bottom.
  vertical: {
    line: `linear-gradient(to bottom, ${STOPS})`,
    className: "inset-y-0 right-0 w-px",
    haloClassName: "inset-y-0 -right-px w-[3px]",
  },
  // Along the header's foot, left to right: it starts where the panel's rule starts.
  horizontal: {
    line: `linear-gradient(to right, ${STOPS})`,
    className: "inset-x-0 bottom-0 h-px",
    haloClassName: "inset-x-0 -bottom-px h-[3px]",
  },
} as const;

/**
 * The frame's two rules — the panel's edge and the header's foot. Each one is
 * a single gradient over its whole length, starting light at the corner where
 * they meet, with a blurred copy behind it as a glow. Decoration only, so
 * hidden from assistive tech.
 */
function ChromeRule({ edge }: { edge: keyof typeof RULES }) {
  const rule = RULES[edge];
  return (
    <>
      <span aria-hidden className={cn("pointer-events-none absolute opacity-55 blur-[3px]", rule.haloClassName)} style={{ background: rule.line }} />
      <span aria-hidden data-chrome-rule={edge} className={cn("pointer-events-none absolute", rule.className)} style={{ background: rule.line }} />
    </>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const [railOpen, setRailOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { editable } = useLedger();

  // `data-hydrated` tells the layout ruler the page responds: a click before
  // hydration is lost.
  useEffect(() => {
    document.documentElement.dataset.hydrated = "";
    return () => {
      delete document.documentElement.dataset.hydrated;
    };
  }, []);

  return (
    <ShellContext.Provider
      value={{ railOpen, toggleRail: () => setRailOpen((v) => !v), openDrawer: () => setDrawerOpen(true) }}
    >
      {/* `--header-h` is where the phone's toast banner docks. */}
      <div className="min-h-screen bg-surface-sunken md:flex" style={{ "--header-h": "64px" } as React.CSSProperties}>
        {/* **The logo lives at the top of the panel**, so the panel's border
            runs whole, from top to bottom. Collapsed, the mark stays. Only
            from 768px — below, the panel is the drawer and the logo moves to
            the header. */}
        <aside
          className="sticky top-0 z-20 hidden h-screen shrink-0 bg-surface-chrome transition-[width] ease-[var(--motion-ease)] md:block"
          style={{ width: railOpen ? RAIL_OPEN : RAIL_CLOSED, transitionDuration: "var(--motion-base)" }}
        >
          <ChromeRule edge="vertical" />
          {/* `overflow-hidden` inside, not on the panel: the label comes back
              before the width finishes growing and would spill for a moment. */}
          <div className="flex h-full flex-col overflow-hidden">
            <NavLink
              to="/"
              // No rule under the logo: the header's rule ends at the panel's
              // border, and a second one here sat a pixel off it, crossing it.
              className="flex h-16 shrink-0 items-center md:h-20"
              style={{ paddingInline: railOpen ? "1rem" : "0", justifyContent: railOpen ? "flex-start" : "center" }}
            >
              {railOpen ? <Logo height={28} /> : <Logo variant="mark" height={28} />}
            </NavLink>

            <nav aria-label={m.shell.sections} className="p-2">
              <SectionLinks compact={!railOpen} />
            </nav>

            <button
              type="button"
              onClick={() => setRailOpen((v) => !v)}
              aria-label={railOpen ? m.shell.collapseRail : m.shell.expandRail}
              className="absolute bottom-3 left-1/2 flex shrink-0 -translate-x-1/2 items-center justify-center rounded-md text-subtle transition-colors duration-[var(--motion-instant)] hover:bg-surface-hover hover:text-secondary"
              style={{ width: "var(--tap-target)", height: "var(--tap-target)" }}
            >
              {railOpen ? <PanelLeftClose size={20} aria-hidden /> : <PanelLeftOpen size={20} aria-hidden />}
            </button>
          </div>
        </aside>

        {/* A full-height column: without it the page would end with the
            content on a short section. */}
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          {/* 64px on phones, 80px from 768 so the title block lines up with
              the logo block at the top of the panel. */}
          <header className="sticky top-0 z-30 bg-surface-chrome">
            <ChromeRule edge="horizontal" />
            <div className="flex h-16 items-center gap-3 px-4 sm:px-6 md:h-20">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label={m.shell.openMenu}
                aria-expanded={drawerOpen}
                className="-ml-2 -mr-1 flex shrink-0 items-center justify-center rounded-md text-secondary transition-colors duration-[var(--motion-instant)] hover:bg-surface-hover md:hidden"
                style={{ width: "var(--tap-target)", height: "var(--tap-target)" }}
              >
                <Menu size={22} aria-hidden />
              </button>

              <NavLink to="/" className="flex min-w-0 items-center gap-3">
                {/* On phones the logo sits here; from 768px it moves up to the
                    panel, and the panel's border is the divider. */}
                <span className="flex md:hidden">
                  <Logo variant="mark" height={26} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium leading-tight text-primary">{m.title}</span>
                  <span className="hidden truncate text-xs leading-tight text-subtle sm:block">{m.tagline}</span>
                </span>
              </NavLink>

              <div className="ml-auto flex items-center gap-2">
                <ThemeToggle />
                <span className="hidden rounded-full border border-border px-3 py-1 text-xs text-secondary sm:inline">
                  {m.shell.noindex}
                </span>
                <span className="hidden rounded-full border border-accent px-3 py-1 text-xs text-accent-label lg:inline">
                  {editable ? m.shell.localApprovals : m.shell.readOnly}
                </span>
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 bg-[image:var(--stage-light)] bg-fixed px-4 py-8 sm:px-6">
            <div className="mx-auto max-w-[var(--container)]">{children}</div>
          </main>
        </div>

        <SideMenu
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          label={m.shell.sections}
          title={
            <>
              <Logo variant="mark" height={26} label={null} />
              <span className="text-sm font-medium">{m.title}</span>
            </>
          }
        >
          <nav className="flex-1 overflow-y-auto p-2">
            <SectionLinks onNavigate={() => setDrawerOpen(false)} />
          </nav>
        </SideMenu>

        {/* Inside the block that sets `--header-h`, so the banner inherits it. */}
        <Toaster />
      </div>
    </ShellContext.Provider>
  );
}
