import { ExternalLink } from "lucide-react";
import { Slot } from "radix-ui";

import { cn } from "@/lib/cn";
import { messages } from "@/messages";

/**
 * The text link: it takes the person somewhere else.
 *
 * **A link goes, a button does.** If the click changes the address, it is
 * this; if it acts on the screen — undo, open, send — it is the
 * [`Button`](./button.tsx), including its `link` variant, which looks like a
 * link and behaves like a button. Swapping the two breaks what a screen reader
 * announces and what "open in new tab" does.
 *
 * **Always underlined.** The underline is the affordance and stays at rest: a
 * link that only reveals itself on hover does not exist on touch screens.
 * Hover thickens the line instead of changing color, so hover does not rely
 * on hue either. There is no visited color.
 *
 * **External says it is external.** It opens a new tab with `noopener`,
 * carries the glyph, and tells people who do not see the glyph. Switching
 * context without warning is how people lose their way back.
 *
 * **An inline link is exempt from the 44px floor** — the inline exception of
 * WCAG 2.5.8: its height is the line's. A standalone link, outside a sentence,
 * is a different thing: use `Button` with `asChild`, which has the area.
 *
 * **No router here.** Pass your router's link through `asChild` and it
 * inherits these styles without an `<a>` inside an `<a>`:
 * `<TextLink asChild><RouterLink to="/about">About</RouterLink></TextLink>`.
 */

type TextLinkProps = React.ComponentProps<"a"> & {
  /** New tab, glyph, and a notice for screen readers. */
  external?: boolean;
  /** A supporting tone, for footers and metadata. The underline stays. */
  tone?: "default" | "subtle";
  asChild?: boolean;
};

export function TextLink({
  external = false,
  tone = "default",
  asChild = false,
  className,
  children,
  ...rest
}: TextLinkProps) {
  const classes = cn(
    "rounded-sm underline decoration-1 underline-offset-2",
    "transition-[text-decoration-thickness] duration-[var(--motion-instant)] ease-[var(--motion-ease)]",
    "hover:decoration-2",
    tone === "subtle" ? "text-secondary" : "text-link",
    className,
  );

  // With `asChild` the child is the link and decides its own destination —
  // typically an in-app route, which is never external.
  if (asChild) {
    return (
      <Slot.Root className={classes} {...rest}>
        {children}
      </Slot.Root>
    );
  }

  return (
    <a
      {...rest}
      className={classes}
      // Adds to the caller's `rel`, never replaces it: a link to a
      // user-submitted site may need `nofollow ugc` as well.
      {...(external
        ? {
            target: "_blank",
            rel: [rest.rel, "noopener noreferrer"].filter(Boolean).join(" "),
          }
        : {})}
    >
      {children}
      {external ? (
        <>
          {/* A non-breaking space: the glyph never wraps alone onto the next
              line, away from the word it marks. */}
          {" "}
          <ExternalLink size={14} aria-hidden className="inline-block align-[-2px]" />
          <span className="sr-only"> {messages.ui.textLink.opensInNewTab}</span>
        </>
      ) : null}
    </a>
  );
}
