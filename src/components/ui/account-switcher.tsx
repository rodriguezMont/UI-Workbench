import { cloneElement } from "react";
import { Check, ChevronDown, LogOut, UserRound } from "lucide-react";
import { DropdownMenu } from "radix-ui";

import { cn } from "@/lib/cn";
import { messages } from "@/messages";

import { Avatar, AvatarFallback, AvatarImage } from "./avatar";

const m = messages.ui.accountSwitcher;

/**
 * The account switcher — **one avatar per account, one tap switches**.
 *
 * **One row per account, never grouped.** Two accounts are two rows, and no
 * third row sums them up: a "both at once" entry would invite a screen that
 * acts on both, and that screen does not exist.
 *
 * **The subtitle is what tells two accounts apart** — a workspace, a team, an
 * email. Two rows with the same name and no subtitle are a guess, and acting
 * on the wrong account is the kind of mistake that only shows later.
 *
 * **Never guess which account is active.** If `activeId` is not in the list —
 * the real case is an account removed between two loads — falling back to the
 * first would switch accounts silently: same face, same place on screen,
 * another account. The trigger asks for a choice instead, and the menu says
 * which access ended (`endedName`), when the caller knows.
 *
 * **Only accounts the person can use reach this list.** One that was removed
 * is absent, not faded: a visible dead row invites the click and produces an
 * error nobody understands.
 *
 * **Radix provides keyboard and focus**, as in the
 * [action menu](./action-menu.tsx). The account link and "Sign out" sit at the
 * end, apart from the accounts. "Sign out" is a callback: whoever owns the
 * session ends it on the server with a POST, never a GET link any page could
 * trigger.
 */

export type Account = {
  /** The account's id — what `onSwitch` receives. */
  id: string;
  name: string;
  /** What tells this account apart: a workspace, a team, an email. */
  subtitle?: string;
  avatarUrl?: string;
};

/**
 * The avatar's initials, from the name: one word gives its first two letters
 * ("Acme" → "AC"); two or more, the first letter of each of the first two
 * ("North Studio" → "NS").
 *
 * **Truthiness, not nullishness**: a database text column carries `""` as
 * easily as `NULL`, and an empty name must not make a silent avatar — it
 * falls back to the subtitle, then to "?".
 */
export function accountInitials(account: Pick<Account, "name" | "subtitle">): string {
  const source = account.name.trim() || account.subtitle?.trim() || "?";
  const words = source.split(/\s+/).filter(Boolean);
  const letters =
    words.length === 1
      ? [...words[0]!].slice(0, 2).join("")
      : words
          .slice(0, 2)
          .map((w) => [...w][0] ?? "")
          .join("");
  return letters.toUpperCase();
}

/** Decoration: the name next to it, or the trigger's hidden line, says who it is. */
function AccountAvatar({ account, className }: { account: Account; className?: string }) {
  return (
    <Avatar aria-hidden className={className}>
      {account.avatarUrl ? <AvatarImage src={account.avatarUrl} alt="" /> : null}
      <AvatarFallback className="text-xs">{accountInitials(account)}</AvatarFallback>
    </Avatar>
  );
}

// The highlight never relies on the background alone: a light highlight
// barely differs from the menu in light mode, so the global focus ring stays,
// pulled inside the menu.
const ITEM = cn(
  "flex cursor-pointer items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm focus-visible:outline-offset-[-2px]",
  "data-[highlighted]:bg-surface-highlight",
);

export function AccountSwitcher({
  accounts,
  activeId,
  onSwitch,
  endedName,
  accountLink,
  onSignOut,
  className,
}: {
  /** Only accounts the person can use now. */
  accounts: readonly Account[];
  activeId: string;
  onSwitch: (accountId: string) => void;
  /**
   * The name of the active account that is gone — only the server knows it.
   * With it, the menu says which access ended; without it, it asks for a choice.
   */
  endedName?: string;
  /**
   * "Your account": a link without children, a router's or an `<a>`. The
   * label and icon go inside.
   */
  accountLink?: React.ReactElement;
  /** "Sign out". The caller ends the session on the server. */
  onSignOut?: () => void;
  className?: string;
}) {
  const active = accounts.find((a) => a.id === activeId);
  if (accounts.length === 0) return null;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className={cn(
          "inline-flex items-center gap-2 rounded-md px-2 text-sm",
          "transition-colors duration-[var(--motion-instant)] hover:bg-surface-hover",
          className,
        )}
        style={{ minHeight: "var(--tap-target)" }}
      >
        {active ? (
          <>
            <AccountAvatar account={active} className="size-8" />
            {/* The visible text hides below `sm`, so the `sr-only` line carries
                the account: it is the only source on phones. On desktop it
                does not repeat what is written — the visible copy is hidden
                from the accessible name, or it would be read twice. */}
            <span className="hidden text-left sm:block" aria-hidden>
              <span className="block max-w-48 truncate font-medium text-primary">{active.name}</span>
              {active.subtitle ? <span className="block max-w-48 truncate text-xs text-secondary">{active.subtitle}</span> : null}
            </span>
            <ChevronDown size={16} aria-hidden className="text-secondary" />
            <span className="sr-only">{m.current(active.subtitle ? `${active.name}, ${active.subtitle}` : active.name)}</span>
          </>
        ) : (
          <>
            <span
              aria-hidden
              className="flex size-8 shrink-0 items-center justify-center rounded-full border border-dashed border-border-strong text-xs text-subtle"
            >
              ?
            </span>
            <span className="font-medium text-accent">{m.choose}</span>
            <ChevronDown size={16} aria-hidden className="text-secondary" />
          </>
        )}
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          // Never against the screen edge: on phones the menu opens close to it.
          collisionPadding={8}
          className={cn(
            "z-50 min-w-64 max-w-[calc(100vw-1rem)] rounded-md border border-border bg-surface-raised p-1 floating-edge",
            "animate-[ui-fade-in_var(--motion-fast)_var(--motion-ease-out)]",
          )}
        >
          {/* The active account is gone: say which access ended, and only then
              ask for the choice. A state without an explanation is a dead
              screen. */}
          {!active ? (
            <p data-ended="" className="mx-1 mt-0.5 mb-1 max-w-72 rounded-sm bg-surface-sunken px-2 py-2 text-sm text-primary">
              {endedName ? m.ended(endedName) : m.unavailable}
            </p>
          ) : null}
          <DropdownMenu.Label className="px-2 py-1.5 text-xs tracking-wide text-subtle uppercase">{m.heading}</DropdownMenu.Label>

          {accounts.map((account) => {
            const current = account.id === active?.id;
            return (
              <DropdownMenu.Item
                key={account.id}
                data-account=""
                onSelect={() => onSwitch(account.id)}
                className={cn(ITEM, current ? "text-accent" : "text-primary")}
                style={{ minHeight: "var(--tap-target)" }}
              >
                <AccountAvatar account={account} className="size-8 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{account.name}</span>
                  {account.subtitle ? <span className="block truncate text-xs text-secondary">{account.subtitle}</span> : null}
                </span>
                {/* The check is the shape of "current"; color only reinforces it. */}
                {current ? <Check size={16} aria-hidden className="shrink-0" /> : null}
              </DropdownMenu.Item>
            );
          })}

          {accountLink || onSignOut ? (
            <>
              <DropdownMenu.Separator className="my-1 h-px bg-divider" />
              {/* The icon sits in a box as wide as the avatar, so the text
                  starts where the accounts' text starts. */}
              {accountLink ? (
                <DropdownMenu.Item asChild className={cn(ITEM, "text-primary")} style={{ minHeight: "var(--tap-target)" }}>
                  {cloneElement(
                    accountLink,
                    undefined,
                    <>
                      <span className="flex size-8 shrink-0 items-center justify-center text-secondary">
                        <UserRound size={18} aria-hidden />
                      </span>
                      {m.account}
                    </>,
                  )}
                </DropdownMenu.Item>
              ) : null}
              {onSignOut ? (
                <DropdownMenu.Item onSelect={onSignOut} className={cn(ITEM, "text-primary")} style={{ minHeight: "var(--tap-target)" }}>
                  <span className="flex size-8 shrink-0 items-center justify-center text-secondary">
                    <LogOut size={18} aria-hidden />
                  </span>
                  {m.signOut}
                </DropdownMenu.Item>
              ) : null}
            </>
          ) : null}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
