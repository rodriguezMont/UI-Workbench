import { cloneElement } from "react";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/cn";
import { messages } from "@/messages";

import { TextLink } from "./link";

/**
 * The breadcrumb: where this page hangs from — Home › Docs › Guides › this
 * page.
 *
 * **A step without an address is text, not a link.** A level that has no page
 * yet still shows, so the person knows where they are, without promising a
 * place that does not exist. Give it an address and it becomes a link.
 *
 * **No router here.** A step takes `href` for a plain link, or `link` for a
 * router's: `{ label: "Docs", link: <RouterLink to="/docs" /> }`. The label
 * goes inside, and the link inherits the [text link](./link.tsx)'s styles
 * through `asChild`.
 *
 * **The current page is the last step** (`aria-current`), and **on phones it
 * hides**: the page title sits right below, and repeating it would spend the
 * line.
 *
 * **The 44px floor is the touch area's**: each link gets `touch-area`, and the
 * 16px separator plus the gaps keep neighboring areas from overlapping.
 */

export type Crumb = {
  label: string;
  /** A plain link. */
  href?: string;
  /** A router's link, without children: the label goes inside it. Wins over `href`. */
  link?: React.ReactElement;
};

export function Breadcrumb({ items, className }: { items: readonly Crumb[]; className?: string }) {
  return (
    <nav aria-label={messages.ui.breadcrumb.label} className={className}>
      <ol className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-secondary">
        {items.map((crumb, i) => {
          const current = i === items.length - 1;
          return (
            <li key={`${i}-${crumb.label}`} className={cn("flex min-w-0 items-center gap-1.5", current && "hidden sm:flex")}>
              {i > 0 ? <ChevronRight size={16} aria-hidden className="shrink-0 text-subtle" /> : null}
              {current ? (
                <span aria-current="page" className="truncate font-medium text-primary">
                  {crumb.label}
                </span>
              ) : crumb.link ? (
                <TextLink asChild tone="subtle" className="relative touch-area">
                  {cloneElement(crumb.link, undefined, crumb.label)}
                </TextLink>
              ) : crumb.href ? (
                <TextLink href={crumb.href} tone="subtle" className="relative touch-area">
                  {crumb.label}
                </TextLink>
              ) : (
                <span>{crumb.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
