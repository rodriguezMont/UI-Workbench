import { useState } from "react";

import { messages } from "@/messages";

import { FoundationSection } from "./FoundationPreview";
import { OverlaySection } from "./OverlayPreview";
import { StatesSection } from "./StatesPreview";
import { TokenSection } from "./TokenPreview";

/**
 * The review page, until the full workbench with its approval flow arrives:
 * a color-scheme switch, the tokens, and each component group as it lands.
 */

const t = messages.workbench;

type Scheme = "system" | "light" | "dark";

function applyScheme(scheme: Scheme) {
  const root = document.documentElement;
  if (scheme === "system") delete root.dataset.theme;
  else root.dataset.theme = scheme;
}

function SchemeSwitch() {
  const [scheme, setScheme] = useState<Scheme>("system");

  return (
    <fieldset className="flex flex-wrap items-center gap-2">
      <legend className="mb-2 text-sm font-medium text-secondary">{t.theme.legend}</legend>
      {(["system", "light", "dark"] as const).map((option) => (
        <label
          key={option}
          className="flex min-h-[var(--tap-target)] items-center gap-2 rounded-md border border-border-strong bg-surface px-3 text-sm has-checked:border-accent has-checked:text-accent-label"
        >
          <input
            type="radio"
            name="scheme"
            value={option}
            checked={scheme === option}
            onChange={() => {
              setScheme(option);
              applyScheme(option);
            }}
            className="accent-[var(--accent)]"
          />
          {t.theme[option]}
        </label>
      ))}
    </fieldset>
  );
}

export function Workbench() {
  return (
    <main className="mx-auto flex max-w-[var(--container)] flex-col gap-10 px-4 py-8 md:px-6">
      <header className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-primary">{t.title}</h1>
        <p className="max-w-[var(--measure)] text-secondary">{t.intro}</p>
        <SchemeSwitch />
      </header>
      <FoundationSection />
      <StatesSection />
      <OverlaySection />
      <TokenSection />
    </main>
  );
}
