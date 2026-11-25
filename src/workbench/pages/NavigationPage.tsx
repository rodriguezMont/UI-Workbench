import { useState } from "react";
import { Link } from "react-router";
import { CircleHelp, Mail, Menu, PanelLeftClose, PanelLeftOpen, Phone, Rss, Search as SearchIcon } from "lucide-react";

import { AccountSwitcher } from "@/components/ui/account-switcher";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Filters, toggleFilterValue, type FilterSelection } from "@/components/ui/filters";
import { Footer, type FooterGroup, type FooterLink } from "@/components/ui/footer";
import { Header } from "@/components/ui/header";
import { TextLink } from "@/components/ui/link";
import { Search } from "@/components/ui/search";
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
      {/* The drawer only exists on phones: from 768px there is nothing to open. */}
      <p className="text-sm text-secondary max-md:hidden">{t.sideMenu.desktopHint}</p>
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

/** What a demo did, written under it. */
function Outcome({ label, value }: { label: string; value: string }) {
  return (
    <p className="w-full text-xs text-secondary">
      {label}: <code className="font-mono text-primary">{value || t.header.nothing}</code>
    </p>
  );
}

function AccountDemo({ ended = false, onEvent }: { ended?: boolean; onEvent?: (text: string) => void }) {
  const d = t.accountSwitcher;
  const [active, setActive] = useState<string>(ended ? "" : d.accounts[0]!.id);
  return (
    <AccountSwitcher
      accounts={d.accounts}
      activeId={active}
      onSwitch={(id) => {
        setActive(id);
        onEvent?.(`${d.switched} ${d.accounts.find((a) => a.id === id)?.name ?? id}`);
      }}
      endedName={ended ? d.endedName : undefined}
      accountLink={<Link to="/navigation#account-switcher" />}
      onSignOut={() => onEvent?.(d.signedOut)}
    />
  );
}

function AccountSwitcherState({ ended = false }: { ended?: boolean }) {
  const [last, setLast] = useState("");
  return (
    <div className="flex w-full flex-col items-start gap-2">
      <AccountDemo ended={ended} onEvent={setLast} />
      <Outcome label={t.accountSwitcher.lastAction} value={last} />
    </div>
  );
}

function HeaderDemo() {
  const [searched, setSearched] = useState("");
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="w-full rounded-md border border-border">
        <Header
          homeLink={<Link to="/navigation#header" />}
          search={{ suggestions: t.search.terms, onSubmit: setSearched, placeholder: t.search.placeholder }}
          actions={
            <Button variant="ghost" size="icon-sm" aria-label={t.header.help}>
              <CircleHelp size={20} aria-hidden />
            </Button>
          }
          account={<AccountDemo />}
        />
      </div>
      <Outcome label={t.header.searched} value={searched} />
    </div>
  );
}

function SearchDemo({ variant }: { variant: "floating" | "inline" | "large" | "full-screen" }) {
  const [searched, setSearched] = useState("");
  const common = { suggestions: t.search.terms, onSubmit: setSearched, placeholder: t.search.placeholder };
  return (
    <div className="flex w-full flex-col gap-2">
      {variant === "full-screen" ? (
        <Search
          {...common}
          context={t.search.context}
          trigger={
            <Button variant="secondary">
              <SearchIcon size={18} aria-hidden />
              {t.search.open}
            </Button>
          }
        />
      ) : (
        <Search
          {...common}
          inline={variant === "inline"}
          size={variant === "large" ? "lg" : "md"}
          showLabel={variant === "large"}
          label={variant === "large" ? t.search.label : undefined}
        />
      )}
      <Outcome label={t.search.searched} value={searched} />
    </div>
  );
}

const slug = (label: string) => label.toLowerCase().replace(/\s+/g, "-");

const footerLinks = (labels: readonly string[]): FooterLink[] => labels.map((label) => ({ id: slug(label), label, href: "#footer" }));

const FOOTER_GROUPS: readonly FooterGroup[] = t.footer.groups.map((g) => ({ title: g.title, links: footerLinks(g.links) }));

/** A rough format check for the demo; the server is the one that knows. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function FooterDemo() {
  const d = t.footer;
  const [error, setError] = useState<string>();
  const [intercepted, setIntercepted] = useState("");
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="w-full overflow-hidden rounded-md border border-border">
        <Footer
          groups={FOOTER_GROUPS}
          legal={footerLinks(d.legal)}
          contacts={[
            { id: "email", label: d.email, href: "mailto:hello@example.com", icon: Mail },
            { id: "call", label: d.call, href: "tel:+15555550100", icon: Phone },
            { id: "feed", label: d.feed, href: "https://example.com/feed.xml", icon: Rss, external: true },
          ]}
          copyright={{ holder: d.holder, since: 2020 }}
          newsletter={{
            action: "#footer",
            title: d.newsletterTitle,
            error,
            onEdit: () => setError(undefined),
            // The error says what is missing: the @, or the domain after it.
            onLeave: (value) =>
              setError(value && !EMAIL.test(value) ? (value.includes("@") ? d.emailNoDomain : d.emailError) : undefined),
            consent: (
              <>
                {d.consentBefore}
                <TextLink href="#footer" tone="subtle">
                  {d.privacy}
                </TextLink>
                {d.consentAfter}
              </>
            ),
          }}
          onAction={(id, event) => {
            // The demo goes nowhere: every link and the newsletter stop here.
            event.preventDefault();
            setIntercepted(id);
          }}
        />
      </div>
      <Outcome label={d.intercepted} value={intercepted} />
    </div>
  );
}

function FiltersDemo() {
  const [selected, setSelected] = useState<FilterSelection>({ category: ["backpacks"] });
  return (
    <Filters
      groups={t.filters.groups}
      selected={selected}
      onToggle={(group, value) => setSelected((current) => toggleFilterValue(current, group, value))}
      onClear={() => setSelected({})}
      className="w-full"
    />
  );
}

export function NavigationPage() {
  return (
    <SectionPage id="navigation">
      <Piece id="app-shell">
        <State label={t.appShell.label} note={t.appShell.note}>
          <ShellControls />
        </State>
        <PieceNote paragraphs={[t.appShell.explain]} />
      </Piece>
      <Piece id="side-menu">
        <State label={t.sideMenu.label} note={t.sideMenu.note}>
          <SideMenuDemo />
        </State>
      </Piece>
      <Piece id="header">
        <State label={t.header.full} note={t.header.fullNote} wide>
          <HeaderDemo />
        </State>
        <State label={t.header.plain} note={t.header.plainNote} wide>
          <div className="w-full overflow-hidden rounded-md">
            <Header homeLink={<Link to="/navigation#header" />} forceDark />
          </div>
        </State>
      </Piece>
      <Piece id="breadcrumb">
        <State label={t.breadcrumb.links} note={t.breadcrumb.linksNote}>
          <Breadcrumb
            items={t.breadcrumb.items.map((label, i) =>
              // The third step has no page yet: it shows as text.
              i === 2 ? { label } : { label, link: <Link to="/navigation#breadcrumb" /> },
            )}
          />
        </State>
        <State label={t.breadcrumb.narrow} note={t.breadcrumb.narrowNote}>
          <Breadcrumb items={t.breadcrumb.deep.map((label) => ({ label, href: "#breadcrumb" }))} />
        </State>
      </Piece>
      <Piece id="footer">
        <State label={t.footer.full} note={t.footer.fullNote} wide>
          <FooterDemo />
        </State>
      </Piece>
      <Piece id="search">
        <State label={t.search.floating} note={t.search.floatingNote}>
          <SearchDemo variant="floating" />
        </State>
        <State label={t.search.inline} note={t.search.inlineNote}>
          <SearchDemo variant="inline" />
        </State>
        <State label={t.search.large} note={t.search.largeNote}>
          <SearchDemo variant="large" />
        </State>
        <State label={t.search.fullScreen} note={t.search.fullScreenNote}>
          <SearchDemo variant="full-screen" />
        </State>
      </Piece>
      <Piece id="filters">
        <State label={t.filters.label} note={t.filters.labelNote} wide>
          <FiltersDemo />
        </State>
      </Piece>
      <Piece id="account-switcher">
        <State label={t.accountSwitcher.label} note={t.accountSwitcher.labelNote}>
          <AccountSwitcherState />
        </State>
        <State label={t.accountSwitcher.ended} note={t.accountSwitcher.endedNote}>
          <AccountSwitcherState ended />
        </State>
      </Piece>
    </SectionPage>
  );
}
