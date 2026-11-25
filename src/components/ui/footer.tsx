import { cloneElement, useId, useSyncExternalStore } from "react";

import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/cn";
import { HONEYPOT_FIELD } from "@/lib/honeypot";
import { messages } from "@/messages";

import { Button } from "./button";
import { Field } from "./field";
import { TextLink } from "./link";

const m = messages.ui.footer;

/**
 * The page footer: the brand and an optional newsletter on the left, columns
 * of links on the right; below a thin rule, the legal links, the copyright and
 * the contacts.
 *
 * **Every link, contact and line of copy comes through props.** The footer
 * draws; what it says belongs to the app.
 *
 * **Links, not buttons** — each item goes to an address. While a destination
 * does not exist yet, the screen can intercept the click (`onAction`) and say
 * "coming soon"; the `href` is already the final one, and crawlers follow it.
 * The newsletter submission goes through the same hook (`id` "newsletter"):
 * the footer draws the field and the error, the app sends.
 *
 * **No router here.** A link takes `href`, or `link` for a router's
 * (`<RouterLink to="/about" />`), which gets the label inside it.
 *
 * **The 44px floor is the touch area's**: each stacked link gets
 * `touch-area`, and the step between rows is 44px — 20 of text and 24 of gap —
 * so neighboring areas do not overlap.
 */

export type FooterLink = {
  id: string;
  label: string;
  href: string;
  /** New tab, glyph and notice, as in the text link. */
  external?: boolean;
  /** A router's link, without children. Wins over `href` for rendering. */
  link?: React.ReactElement;
};

export type FooterGroup = { title: string; links: readonly FooterLink[] };

export type FooterContact = {
  id: string;
  /** The accessible name — the icon is all that shows. */
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  external?: boolean;
  /** Added to `noopener noreferrer` on an external contact. */
  rel?: string;
};

export type FooterNewsletter = {
  /** Where the form posts. `post`: the address never goes into a URL. */
  action: string;
  /** The line above the field: "Get product updates by email." */
  title: string;
  /** Under the field: what subscribing agrees to, usually with a privacy link. */
  consent?: React.ReactNode;
  label?: string;
  placeholder?: string;
  submit?: string;
  /** The field's error, from whoever sends. */
  error?: string;
  /** While sending, the button is disabled. */
  sending?: boolean;
  /** The field changed — the moment to clear a stale error. */
  onEdit?: () => void;
  /** The person left the field, with its value — the moment to validate. */
  onLeave?: (value: string) => void;
};

const noChange = () => () => {};

/**
 * The copyright's last year. Before hydration it is `year` (or the clock's),
 * so server and client agree; afterwards the clock's, so a cached page does
 * not go stale in January. A clock running late never goes before `year`.
 */
function useCopyrightYear(year?: number): number {
  return useSyncExternalStore(
    noChange,
    () => Math.max(year ?? 0, new Date().getFullYear()),
    () => year ?? new Date().getFullYear(),
  );
}

/**
 * The bait field: off screen, out of the Tab order, hidden from screen
 * readers. Only a bot fills it. The `id` is unique on the page, so two forms
 * with one each can live together.
 */
export function Honeypot() {
  const id = useId();
  return (
    <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label htmlFor={id}>{m.honeypot}</label>
      <input id={id} name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" placeholder={m.honeypotPlaceholder} />
    </div>
  );
}

function FooterAnchor({ item, onClick }: { item: FooterLink; onClick?: (e: React.SyntheticEvent) => void }) {
  const classes = "relative touch-area";
  return item.link ? (
    <TextLink asChild tone="subtle" className={classes} onClick={onClick}>
      {cloneElement(item.link, undefined, item.label)}
    </TextLink>
  ) : (
    <TextLink href={item.href} external={item.external} tone="subtle" className={classes} onClick={onClick}>
      {item.label}
    </TextLink>
  );
}

export function Footer({
  brand = <Logo height={24} />,
  groups = [],
  legal = [],
  contacts = [],
  copyright,
  newsletter,
  onAction,
  forceDark = false,
  className,
}: {
  /** The top-left mark. Defaults to the logo. */
  brand?: React.ReactNode;
  /** The link columns. */
  groups?: readonly FooterGroup[];
  /** The bottom row: terms, privacy. */
  legal?: readonly FooterLink[];
  /** Icon links at the bottom right: email, phone, social. */
  contacts?: readonly FooterContact[];
  /**
   * "© 2020–2026 Example Inc. All rights reserved." `since` opens the range;
   * `year` pins the last year for server rendering.
   */
  copyright?: { holder: string; since?: number; year?: number };
  newsletter?: FooterNewsletter;
  /** Intercepts a link (by `id`) or the newsletter (`"newsletter"`). Absent, links navigate. */
  onAction?: (id: string, event: React.SyntheticEvent) => void;
  /** Dark in both color schemes. */
  forceDark?: boolean;
  className?: string;
}) {
  const year = useCopyrightYear(copyright?.year);
  // **Before hydration, the newsletter does not submit**: a native post could
  // land on a route that only handles it from script. With the button
  // disabled nothing leaves, not even through Enter.
  const ready = useSyncExternalStore(noChange, () => true, () => false);
  const intercept = (id: string) => (onAction ? (e: React.SyntheticEvent) => onAction(id, e) : undefined);
  const years = copyright?.since && copyright.since < year ? `${copyright.since}–${year}` : String(year);

  return (
    // `text-primary` declared: inherited, it would come from the page body,
    // and the logo's name follows `currentColor`.
    <footer data-theme={forceDark ? "dark" : undefined} className={cn("border-t border-border bg-surface-chrome text-primary", className)}>
      <div className="mx-auto max-w-[var(--container)] px-5 md:px-6">
        <div className="grid gap-10 py-10 md:grid-cols-[minmax(0,1fr)_auto] md:gap-16 lg:py-14">
          <div className="space-y-5">
            {brand}
            {newsletter ? (
              <form
                method="post"
                action={newsletter.action}
                noValidate
                onSubmit={intercept("newsletter")}
                onChange={newsletter.onEdit}
                className="relative max-w-sm space-y-3"
              >
                <p className="text-sm font-bold">{newsletter.title}</p>
                <div className="flex items-start gap-2">
                  <Field
                    label={newsletter.label ?? m.email}
                    hiddenLabel
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder={newsletter.placeholder ?? m.emailPlaceholder}
                    required
                    error={newsletter.error}
                    onBlur={(e) => newsletter.onLeave?.(e.currentTarget.value)}
                    className="min-w-0 flex-1"
                  />
                  <Button type="submit" disabled={!ready || newsletter.sending}>
                    {newsletter.submit ?? m.subscribe}
                  </Button>
                </div>
                <Honeypot />
                {newsletter.consent ? <p className="text-xs text-secondary">{newsletter.consent}</p> : null}
              </form>
            ) : null}
          </div>

          {groups.length ? (
            <div className="grid grid-cols-2 gap-8 md:gap-16">
              {groups.map((group) => (
                <nav key={group.title} aria-label={group.title} className="space-y-4">
                  <p className="text-sm font-bold">{group.title}</p>
                  <ul className="space-y-6 text-sm">
                    {group.links.map((item) => (
                      <li key={item.id}>
                        <FooterAnchor item={item} onClick={intercept(item.id)} />
                      </li>
                    ))}
                  </ul>
                </nav>
              ))}
            </div>
          ) : null}
        </div>

        {/* A thin rule as wide as the content, not edge to edge. Below it, the
            same breathing room as above, so the footer does not stick to the
            bottom of the screen. */}
        <div className="flex flex-col gap-6 border-t border-border pt-6 pb-10 md:flex-row md:items-end md:justify-between lg:pb-14">
          <div className="space-y-4">
            {legal.length ? (
              <nav aria-label={m.legal}>
                <ul className="flex flex-wrap gap-6 text-sm">
                  {legal.map((item) => (
                    <li key={item.id}>
                      <FooterAnchor item={item} onClick={intercept(item.id)} />
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}
            {copyright ? <p className="text-xs text-secondary">{m.copyright(years, copyright.holder)}</p> : null}
          </div>

          {contacts.length ? (
            <ul aria-label={m.contacts} className="-ml-3 flex gap-1 md:ml-0 md:-mr-3">
              {contacts.map(({ icon: Icon, ...contact }) => (
                <li key={contact.id}>
                  <a
                    href={contact.href}
                    aria-label={contact.external ? `${contact.label} ${messages.ui.textLink.opensInNewTab}` : contact.label}
                    target={contact.external ? "_blank" : undefined}
                    rel={contact.external ? [contact.rel, "noopener noreferrer"].filter(Boolean).join(" ") : contact.rel}
                    className="flex size-[var(--tap-target)] items-center justify-center rounded-md text-secondary transition-colors duration-[var(--motion-instant)] hover:bg-surface-hover hover:text-primary"
                  >
                    {/* The name is on the link; the icon is decoration. */}
                    <span aria-hidden className="flex">
                      <Icon className="size-5" />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
