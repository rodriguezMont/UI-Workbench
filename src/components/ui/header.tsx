import { cloneElement, useSyncExternalStore } from "react";
import { Search as SearchIcon } from "lucide-react";
import { Slot } from "radix-ui";

import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/cn";
import { messages } from "@/messages";

import { Button } from "./button";
import { Search, type SearchProps } from "./search";

const m = messages.ui.header;

/** What the header passes on to its search: everything but the layout, which is the header's. */
export type HeaderSearch = Omit<SearchProps, "trigger" | "inline" | "showLabel" | "size" | "fullScreenOnTouch" | "className">;

/**
 * The page header: the logo on the left, the search and an account slot on
 * the right.
 *
 * **Phone first.** One 64px row: the logo, and a magnifier that opens the
 * [search](./search.tsx) straight in full screen, keyboard included — a sheet
 * with a field in it gets squeezed by the keyboard. From 768px, one 80px row
 * with the search field in it.
 *
 * **The logo is a link home, and the link comes from outside.** No router
 * here: pass `homeLink={<RouterLink to="/" />}` and the header puts the logo
 * inside it. Absent, it is a plain `<a href="/">`.
 *
 * **The account slot holds nothing about a person by itself.** It is a
 * `ReactNode` — the [account switcher](./account-switcher.tsx), a sign-in
 * button — so a cacheable page can render the header empty and fill the slot
 * on the client.
 *
 * **Over a dark panel (`overlay`)** the header is fixed and transparent at the
 * top of the page, reading in the dark scheme over the panel; once the page
 * scrolls, its background fades in and it follows the page's scheme again.
 * Whoever uses it offsets the content by the header's height.
 */
export function Header({
  homeLink = <a href="/" />,
  search,
  actions,
  account,
  sticky = false,
  overlay = false,
  forceDark = false,
  className,
}: {
  /** The link the logo sits in — a router's link, through `asChild`. */
  homeLink?: React.ReactElement;
  /** The search, as a field from 768px and a magnifier below. Absent, no search. */
  search?: HeaderSearch;
  /** Anything before the account: a help link, a notifications button. */
  actions?: React.ReactNode;
  /** The account slot, at the end of the row. */
  account?: React.ReactNode;
  /** Stuck to the top while the page scrolls — for long lists. */
  sticky?: boolean;
  /** Fixed and transparent over a dark panel at the top of the page. */
  overlay?: boolean;
  /** Dark in both color schemes, for a page whose frame always reads dark. */
  forceDark?: boolean;
  className?: string;
}) {
  const scrolled = useSyncExternalStore(overlay ? subscribeToScroll : noSubscription, pastTheTop, () => false);
  // At the top of a page that opens on a dark panel: transparent, dark scheme.
  const atTop = overlay && !scrolled;
  const name = m.home(messages.ui.brand.name);

  return (
    <header
      data-theme={forceDark || atTop ? "dark" : undefined}
      data-at-top={atTop ? "" : undefined}
      className={cn(
        overlay ? "fixed inset-x-0 top-0 z-40" : sticky ? "sticky top-0 z-40" : "relative",
        "transition-[background-color,box-shadow] duration-[var(--motion-base)] ease-[var(--motion-ease)]",
        // The text color is declared: inherited, it would come from the page
        // body, and the logo's name follows `currentColor`.
        atTop
          ? "bg-transparent text-primary"
          : overlay
            ? "bg-surface-chrome text-primary shadow-[var(--floating-shadow)]"
            : "border-b border-border bg-surface-chrome text-primary",
        className,
      )}
    >
      <div className="mx-auto flex h-16 max-w-[var(--container)] items-center gap-2 px-5 sm:gap-3 md:h-20 md:gap-6 md:px-6">
        <Slot.Root aria-label={name} className="flex shrink-0 items-center rounded-sm">
          {cloneElement(
            homeLink,
            undefined,
            // `flex`, not inline: as text, the logo aligns on the baseline and
            // sits above the row's center. 18px below 375 so the actions still
            // fit at 320; 22 on phones; 28 from 768.
            <>
              <span className="flex min-[375px]:hidden">
                <Logo height={18} label={null} />
              </span>
              <span className="hidden min-[375px]:flex md:hidden">
                <Logo height={22} label={null} />
              </span>
              <span className="hidden md:flex">
                <Logo height={28} label={null} />
              </span>
            </>,
          )}
        </Slot.Root>

        {search ? (
          <div className="hidden min-w-0 flex-1 md:block">
            <Search {...search} />
          </div>
        ) : null}

        {/* 8px between controls on phones: a 36px box plus 8 is the 44px a
            touch area needs, so two neighbors' areas never overlap. The actions
            keep their size; the logo is what gives way. */}
        <div className="ml-auto flex min-w-0 items-center gap-2 md:gap-4">
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
          {search ? (
            <Search
              {...search}
              trigger={
                // A 36px box with a 44px touch area. `-mr-2`: the 20px icon in
                // a 36px box — the inner gap goes, and the magnifier meets the
                // right margin like the rest of the page.
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={search.label ?? m.openSearch}
                  aria-haspopup="dialog"
                  className={cn("shrink-0 md:hidden", !account && "-mr-2")}
                >
                  <SearchIcon size={20} aria-hidden />
                </Button>
              }
            />
          ) : null}
          {account ? <div className="shrink-0">{account}</div> : null}
        </div>
      </div>
    </header>
  );
}

// Scroll as an external store: on the server the page is always at the top,
// and the browser corrects it on hydration without the two HTMLs disagreeing.
// 8px of slack: a touch that barely scrolls does not swap the header.
function subscribeToScroll(notify: () => void) {
  window.addEventListener("scroll", notify, { passive: true });
  return () => window.removeEventListener("scroll", notify);
}
const noSubscription = () => () => {};
const pastTheTop = () => window.scrollY > 8;
