import { SearchX } from "lucide-react";

import { cn } from "@/lib/cn";
import { messages } from "@/messages";

import { Button } from "./button";

/**
 * The empty state — **an empty list is a defect, not a state**.
 *
 * Someone who finds nothing does not refine the search: they leave, and often
 * do not come back. So the empty state always offers a way forward — closer
 * terms to try, or an action passed in as children.
 *
 * ## The rule this component exists to protect
 *
 * **A suggestion never broadens the search on its own.** It offers "did you
 * mean" and **waits for the click**. Broadening silently would return results
 * nobody asked for, presented as if they were the answer.
 *
 * That is why `suggestions` are **actions**, never text: each one is a button
 * the person chooses.
 */
type EmptyBase = {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ size?: number; "aria-hidden"?: boolean }>;
  className?: string;
  children?: React.ReactNode;
};

/**
 * Suggestions and their handler **always travel together**, and the type
 * enforces it. A suggestion without a handler renders a button that ignores
 * the click — a visibly active control that does nothing is worse than the
 * empty list this component exists to avoid.
 */
type EmptyProps =
  | (EmptyBase & { suggestions?: undefined; onSuggestion?: undefined })
  | (EmptyBase & {
      /** Terms close to what was typed. Each becomes a new search, by choice. */
      suggestions: readonly string[];
      onSuggestion: (term: string) => void;
    });

export function Empty({
  title,
  description,
  suggestions,
  onSuggestion,
  icon: Icon = SearchX,
  className,
  children,
}: EmptyProps) {
  return (
    <div
      className={cn(
        // `w-full` because this is a PANEL that takes the place of a whole
        // list. Without it, as a flex child, it shrinks to its content and
        // sits against one edge with half the screen empty beside it.
        "flex w-full flex-col items-center justify-center rounded-lg border border-dashed border-border-strong bg-surface px-6 py-10 text-center text-secondary",
        className,
      )}
    >
      <Icon size={32} aria-hidden />
      <p className="mt-3 text-base font-medium text-primary">{title}</p>
      {description ? <p className="mt-1 max-w-[48ch] text-sm text-secondary">{description}</p> : null}

      {suggestions?.length ? (
        <div className="mt-5 w-full">
          <p className="text-sm text-secondary">{messages.ui.empty.didYouMean}</p>
          <ul className="mt-2 flex flex-wrap justify-center gap-2">
            {suggestions.map((term) => (
              <li key={term}>
                <Button variant="secondary" size="sm" onClick={() => onSuggestion(term)}>
                  {term}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {children ? <div className="mt-5">{children}</div> : null}
    </div>
  );
}
