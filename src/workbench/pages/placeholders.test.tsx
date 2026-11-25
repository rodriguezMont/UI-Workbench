// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { TooltipProvider } from "@/components/ui/tooltip";
import { installDomStubs } from "@/test/dom";

/**
 * Every text input a demo shows carries a placeholder — an example of what
 * goes in. A field without one looks unfinished next to one that has it, and
 * the gap is easy to miss by eye, so it is checked here for every page.
 */

beforeEach(() => installDomStubs());
afterEach(cleanup);

const pages = import.meta.glob<Record<string, React.ComponentType>>("./*Page.tsx", { eager: true });

/** Inputs that take typed text; choices, ranges and hidden values do not. */
const TEXT_INPUTS = 'input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"]):not([type="range"]), textarea';

describe("demo inputs have placeholders", () => {
  for (const [file, module] of Object.entries(pages)) {
    const Page = Object.entries(module).find(([name]) => name.endsWith("Page") && name !== "SectionPage")?.[1];
    if (!Page) continue;

    it(file, () => {
      const { container } = render(
        <MemoryRouter>
          <TooltipProvider>
            <Page />
          </TooltipProvider>
        </MemoryRouter>,
      );
      const missing = [...container.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(TEXT_INPUTS)]
        .filter((el) => !el.placeholder.trim())
        .map((el) => el.labels?.[0]?.textContent?.trim() || el.getAttribute("aria-label") || el.name || "(unnamed)");
      expect(missing).toEqual([]);
    });
  }
});
