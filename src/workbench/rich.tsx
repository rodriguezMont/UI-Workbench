import { Fragment } from "react";

/**
 * Workbench prose with two marks, so the copy can stay plain strings in the
 * messages module: `**bold**` for the sentence a reader should catch first,
 * and `` `code` `` for a token, a prop or a file. Nothing else is parsed —
 * prose about a design system does not need more, and a real markdown parser
 * would be a dependency the library never uses.
 */
const MARK = /(\*\*[^*]+\*\*|`[^`]+`)/g;

export function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(MARK).map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
          return (
            <strong key={i} className="font-semibold text-primary">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
          return (
            <code key={i} className="font-mono text-[0.92em] text-primary">
              {part.slice(1, -1)}
            </code>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
