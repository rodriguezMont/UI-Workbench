import { useMemo, useState } from "react";
import { Link } from "react-router";
import { CircleHelp, ListFilter, Mail, Menu, PanelLeftClose, PanelLeftOpen, Phone, Rss, Search as SearchIcon } from "lucide-react";

import { AccountSwitcher } from "@/components/ui/account-switcher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { Field } from "@/components/ui/field";
import { ActiveFilters, Filters, toggleFilterValue, type FilterGroup, type FilterSelection } from "@/components/ui/filters";
import { Footer, type FooterGroup, type FooterLink } from "@/components/ui/footer";
import { Header } from "@/components/ui/header";
import { TextLink } from "@/components/ui/link";
import { Overlay, OverlayContent, OverlayTrigger } from "@/components/ui/overlay";
import { Search } from "@/components/ui/search";
import { Select } from "@/components/ui/select";
import { SideMenu } from "@/components/ui/side-menu";
import { cn } from "@/lib/cn";
import { formatDollars } from "@/lib/format";
import { normalize } from "@/lib/normalize";
import { messages } from "@/messages";

import { Outcome } from "../Outcome";
import { SAMPLE_PORTRAIT } from "../samples";
import { useShell } from "../Shell";

/**
 * The live demos of the Navigation section, kept apart from the section page
 * so the page stays a list of pieces and states.
 */

const t = messages.workbench.demos;

// ── App shell ──────────────────────────────────────────────────────────────

/** A block of the sketch: a role surface with the border, nothing more. */
const BLOCK = "rounded-sm border border-border";

/** The desktop frame drawn small: it follows the real shell's panel. */
function DesktopSketch({ open }: { open: boolean }) {
  return (
    <div role="img" aria-label={t.appShell.schematicDesktop(open)} className={cn(BLOCK, "flex h-32 w-full max-w-xs flex-col gap-1 bg-surface-sunken p-1.5")}>
      <div className={cn(BLOCK, "h-4 bg-surface-chrome")} />
      <div className="flex min-h-0 flex-1 gap-1">
        <div
          className={cn(BLOCK, "flex flex-col gap-1 bg-surface-chrome p-1 transition-[width]")}
          style={{ width: open ? "30%" : "10%", transitionDuration: "var(--motion-base)" }}
        >
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="h-1.5 rounded-full bg-border-strong" style={{ width: open ? "80%" : "100%" }} />
          ))}
        </div>
        <div className={cn(BLOCK, "flex-1 bg-surface")} />
      </div>
    </div>
  );
}

/** The phone frame drawn small: the header with the menu, and the drawer over the page. */
function PhoneSketch() {
  return (
    <div role="img" aria-label={t.appShell.schematicPhone} className={cn(BLOCK, "relative flex h-40 w-24 flex-col gap-1 overflow-hidden bg-surface-sunken p-1.5")}>
      <div className={cn(BLOCK, "flex h-4 items-center bg-surface-chrome px-1")}>
        <Menu size={10} aria-hidden className="text-secondary" />
      </div>
      <div className={cn(BLOCK, "flex-1 bg-surface")} />
      <div className={cn(BLOCK, "absolute inset-y-1.5 left-1.5 flex w-14 flex-col gap-1 bg-surface-chrome p-1 shadow-md")}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="h-1.5 w-4/5 rounded-full bg-border-strong" />
        ))}
      </div>
    </div>
  );
}

/**
 * The shell is this page's own frame, so its showcase drives the real one
 * through `useShell` instead of drawing a copy that could drift from it.
 */
export function ShellDesktopDemo() {
  const shell = useShell();
  if (!shell) return null;
  return (
    <div className="flex w-full flex-col items-start gap-3">
      <DesktopSketch open={shell.railOpen} />
      <Button variant="secondary" onClick={shell.toggleRail} className="max-md:hidden" aria-pressed={!shell.railOpen}>
        {shell.railOpen ? <PanelLeftClose size={18} aria-hidden /> : <PanelLeftOpen size={18} aria-hidden />}
        {shell.railOpen ? t.appShell.collapse : t.appShell.expand}
      </Button>
    </div>
  );
}

export function ShellPhoneDemo() {
  const shell = useShell();
  if (!shell) return null;
  return (
    <div className="flex w-full flex-col items-start gap-3">
      <PhoneSketch />
      <Button variant="secondary" onClick={shell.openDrawer} className="md:hidden">
        <Menu size={18} aria-hidden />
        {t.appShell.openDrawer}
      </Button>
      <p className="text-sm text-secondary max-md:hidden">{t.appShell.phoneHint}</p>
    </div>
  );
}

export function SideMenuDemo() {
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

// ── Account switcher ───────────────────────────────────────────────────────

/** One account with a photo, so the three kinds of avatar show side by side. */
const ACCOUNTS = t.accountSwitcher.accounts.map((a, i) => (i === 0 ? { ...a, avatarUrl: SAMPLE_PORTRAIT } : a));

export function AccountDemo({ ended = false, onEvent }: { ended?: boolean; onEvent?: (text: string) => void }) {
  const d = t.accountSwitcher;
  const [active, setActive] = useState<string>(ended ? "" : ACCOUNTS[0]!.id);
  return (
    <AccountSwitcher
      accounts={ACCOUNTS}
      activeId={active}
      onSwitch={(id) => {
        setActive(id);
        onEvent?.(`${d.switched} ${ACCOUNTS.find((a) => a.id === id)?.name ?? id}`);
      }}
      endedName={ended ? d.endedName : undefined}
      accountLink={<Link to="/navigation#account-switcher" />}
      onSignOut={() => onEvent?.(d.signedOut)}
    />
  );
}

/** The switcher where it lives: at the end of a header row. */
export function AccountSwitcherState({ ended = false }: { ended?: boolean }) {
  const [last, setLast] = useState("");
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex h-14 w-full items-center justify-end rounded-md border border-border bg-surface-chrome px-3">
        <AccountDemo ended={ended} onEvent={setLast} />
      </div>
      {ended ? null : <Outcome label={t.accountSwitcher.lastAction} value={last} />}
    </div>
  );
}

// ── Header ─────────────────────────────────────────────────────────────────

/** A strip of page under the header, so it reads as chrome over content. */
function PageStrip({ lines = 3 }: { lines?: number }) {
  return (
    <div aria-hidden className="space-y-2 bg-surface-sunken p-4">
      {t.header.pageLines.slice(0, lines).map((line) => (
        <div key={line} className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-secondary">
          {line}
        </div>
      ))}
    </div>
  );
}

export function HeaderDemo() {
  const [searched, setSearched] = useState("");
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="w-full overflow-hidden rounded-md border border-border">
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
        <PageStrip />
      </div>
      <Outcome label={t.header.searched} value={searched} />
    </div>
  );
}

/** A scrolling frame: the sticky header holds its place inside it. */
export function StickyHeaderDemo() {
  return (
    <div className="h-64 w-full overflow-y-auto rounded-md border border-border" tabIndex={0} aria-label={t.header.sticky}>
      <Header homeLink={<Link to="/navigation#header" />} sticky />
      <PageStrip lines={t.header.pageLines.length} />
    </div>
  );
}

export function DarkHeaderDemo() {
  return (
    <div className="flex h-64 w-full flex-col overflow-hidden rounded-md border border-border">
      <Header homeLink={<Link to="/navigation#header" />} forceDark />
      <div className="flex-1 bg-surface-sunken">
        <PageStrip lines={3} />
      </div>
    </div>
  );
}

// ── Search ─────────────────────────────────────────────────────────────────

export function SearchDemo({ variant }: { variant: "floating" | "inline" | "large" | "full-screen" }) {
  const [searched, setSearched] = useState("");
  const common = { suggestions: t.search.terms, onSubmit: setSearched, placeholder: t.search.placeholder };
  return (
    <div className="flex h-full w-full flex-col gap-2">
      {variant === "full-screen" ? (
        <div>
          {/* A label like the large search's, so the two controls line up. */}
          <span aria-hidden className="mb-1.5 block text-sm font-medium text-primary">
            {t.search.fullScreenLabel}
          </span>
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
        </div>
      ) : (
        <Search
          {...common}
          inline={variant === "inline"}
          size={variant === "large" ? "lg" : "md"}
          showLabel={variant === "large"}
          label={variant === "large" ? t.search.label : undefined}
        />
      )}
      <Outcome label={t.search.searched} value={searched} className="mt-auto" />
    </div>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────

const slug = (label: string) => label.toLowerCase().replace(/\s+/g, "-");
const footerLinks = (labels: readonly string[]): FooterLink[] => labels.map((label) => ({ id: slug(label), label, href: "#footer" }));
const FOOTER_GROUPS: readonly FooterGroup[] = t.footer.groups.map((g) => ({ title: g.title, links: footerLinks(g.links) }));

/** A rough format check for the demo; the server is the one that knows. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function FooterDemo({ forceDark = false }: { forceDark?: boolean }) {
  const d = t.footer;
  const [error, setError] = useState<string>();
  const [intercepted, setIntercepted] = useState("");
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="w-full overflow-hidden rounded-md border border-border">
        <Footer
          forceDark={forceDark}
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
            onLeave: (value) => setError(value && !EMAIL.test(value) ? (value.includes("@") ? d.emailNoDomain : d.emailError) : undefined),
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
      {forceDark ? null : <Outcome label={d.intercepted} value={intercepted} />}
    </div>
  );
}

// ── Filters ────────────────────────────────────────────────────────────────

type Bag = (typeof t.filters.catalog)[number];

const matches = (bag: Bag, selected: FilterSelection, skip?: string) =>
  Object.entries(selected).every(([group, values]) => group === skip || values.length === 0 || values.includes(bag[group as "category" | "color"]));

/**
 * Live counts: each option counts the bags that match every *other* group's
 * choice plus this option — within a group the choices add up, across groups
 * they narrow.
 */
function liveGroups(bags: readonly Bag[], selected: FilterSelection): FilterGroup[] {
  return t.filters.groups.map((group) => ({
    ...group,
    options: group.options.map((o) => ({
      ...o,
      count: bags.filter((b) => matches(b, selected, group.id) && b[group.id as "category" | "color"] === o.value).length,
    })),
  }));
}

/** Search, filters in the overlay, chips and sort on the page, and the list they shape. */
export function FiltersInContextDemo() {
  const f = t.filters;
  const [term, setTerm] = useState("");
  const [selected, setSelected] = useState<FilterSelection>({ category: ["backpacks"] });
  const [sort, setSort] = useState("relevance");

  const searched = useMemo(() => f.catalog.filter((b) => normalize(b.name).includes(normalize(term.trim()))), [f.catalog, term]);
  const groups = liveGroups(searched, selected);
  const shown = searched.filter((b) => matches(b, selected));
  const sorted =
    sort === "name" ? [...shown].sort((a, b) => a.name.localeCompare(b.name)) : sort === "price" ? [...shown].sort((a, b) => a.price - b.price) : shown;
  const active = Object.values(selected).reduce((a, v) => a + v.length, 0);
  const toggle = (group: string, value: string) => setSelected((current) => toggleFilterValue(current, group, value));
  const filterProps = { groups, selected, onToggle: toggle, onClear: () => setSelected({}) };

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <Field
          label={f.searchLabel}
          hiddenLabel
          type="search"
          icon="search"
          placeholder={f.searchPlaceholder}
          value={term}
          onChange={(e) => setTerm(e.currentTarget.value)}
        />
        <Overlay>
          <OverlayTrigger>
            <Button variant="secondary">
              <ListFilter size={16} aria-hidden />
              {f.button}
              {active ? <Badge>{active}</Badge> : null}
            </Button>
          </OverlayTrigger>
          <OverlayContent
            title={f.button}
            actions={[
              { label: f.see(shown.length) },
              { label: f.clear, tone: "ghost", onSelect: () => setSelected({}) },
            ]}
          >
            <Filters {...filterProps} showActive={false} />
          </OverlayContent>
        </Overlay>
        <Select
          label={f.sortLabel}
          hiddenLabel
          value={sort}
          onValueChange={(v) => setSort(String(v))}
          options={[
            { value: "relevance", label: f.sorts[0]! },
            { value: "name", label: f.sorts[1]! },
            { value: "price", label: f.sorts[2]! },
          ]}
          className="col-span-2 sm:col-span-1 sm:w-48"
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p role="status" className="text-sm font-medium text-primary">
          {f.results(shown.length)}
        </p>
        <ActiveFilters {...filterProps} />
      </div>

      {sorted.length ? (
        <ul className="divide-y divide-border rounded-md border border-border">
          {sorted.map((bag) => (
            <li key={bag.name} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <span className="text-primary">{bag.name}</span>
              <span className="tabular-nums text-secondary">{formatDollars(bag.price)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <Empty title={f.noneTitle} description={f.noneHint} />
      )}
    </div>
  );
}

/** The piece alone, as it renders in a sheet or a side column. */
export function FiltersDemo({ initial }: { initial: FilterSelection }) {
  const [selected, setSelected] = useState<FilterSelection>(initial);
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

/**
 * One option at zero, checked: it stays only because it is checked. Uncheck it
 * and it leaves the list — the sentence under it says which case is showing.
 */
export function ZeroFilterDemo() {
  const f = t.filters;
  const category = f.groups[0]!;
  const [selected, setSelected] = useState<FilterSelection>({ category: ["wallets"] });
  const checked = (selected.category ?? []).includes("wallets");
  return (
    <div className="flex w-full flex-col gap-3">
      <Filters
        groups={[category]}
        selected={selected}
        onToggle={(group, value) => setSelected((current) => toggleFilterValue(current, group, value))}
        onClear={() => setSelected({})}
        className="w-full"
      />
      <p role="status" className="text-sm text-secondary">
        {checked ? f.zeroChecked : f.zeroGone}
      </p>
      {checked ? null : (
        <div>
          <Button variant="secondary" size="sm" onClick={() => setSelected({ category: ["wallets"] })}>
            {f.zeroReset}
          </Button>
        </div>
      )}
    </div>
  );
}
