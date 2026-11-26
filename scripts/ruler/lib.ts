/**
 * What the workbench rulers share: the report, the approval-ledger lock, the
 * page opener and the touch probe. Used by `measure-workbench.ts` and
 * `measure-touch.ts`.
 *
 * **Why rulers exist.** Front-end work is measured, not estimated — and it is
 * measured in a browser that really draws. An embedded or background browser
 * pauses layout and animations: `requestAnimationFrame` stops, and a sheet
 * that closes fine looks stuck open. That once produced an invented defect
 * here (#23, withdrawn in #24). These scripts drive a real, foreground
 * Chromium (and WebKit for touch) against the dev server.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { Page } from "playwright";

/** The dev server to measure. `TARGET=http://localhost:5181 npm run measure`. */
export const BASE = process.env.TARGET ?? "http://localhost:5180";

/** The widths every page is measured at: phone, tablet, laptop, wide desktop. */
export const WIDTHS = [375, 768, 1280, 1920] as const;

export type Check = (name: string, passed: boolean, detail?: string) => void;

/**
 * The report: `check(name, passed, detail)` notes a line; `close()` prints
 * everything and exits with code 1 if any ruler failed.
 */
export function createReport() {
  const failures: string[] = [];
  const lines: string[] = [];
  const check: Check = (name, passed, detail) => {
    lines.push(`  ${passed ? "ok    " : "FAILED"}  ${name}${detail ? `  ${detail}` : ""}`);
    if (!passed) failures.push(name);
  };
  const close = () => {
    console.log(lines.join("\n"));
    if (failures.length > 0) {
      console.error(`\n${failures.length} ruler(s) failed:\n- ${failures.join("\n- ")}`);
      process.exit(1);
    }
    console.log("\nevery ruler passed");
  };
  return { check, lines, close };
}

/**
 * **A ruler can never approve anything.**
 *
 * It drives a real browser against the dev server, and every piece has an
 * approval button that writes to disk. In the source project a selector once
 * clicked the seal instead of the component, and a piece nobody reviewed came
 * out approved. Better selectors fix the known case; this lock closes the
 * class: a stray click on any seal turns into a red ruler, not a silent
 * approval.
 *
 * Call it at the start of the run; the returned function checks at the end.
 */
export function lockLedger(check: Check) {
  const ledger = join(process.cwd(), "src", "workbench", "approvals.json");
  const read = () => {
    try {
      return readFileSync(ledger, "utf8");
    } catch {
      return "";
    }
  };
  const before = read();
  return (lines: string[]) => {
    lines.push("", "WHAT THE RULER MUST NOT DO");
    check("no piece was approved by the ruler", read() === before, "approvals.json untouched");
  };
}

/**
 * Opens a page and waits until it is really there: the network settled and
 * the section's pieces rendered (sections load their code on first visit).
 */
export async function open(page: Page, path: string) {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  if (path !== "/") await page.waitForSelector("main section[id] [data-demo]", { timeout: 30_000 });
}

/** The section pages, read from the shell's own navigation — no list kept here. */
export async function sectionPaths(page: Page): Promise<string[]> {
  await open(page, "/");
  const hrefs = await page.$$eval("aside nav a[href], nav a[href]", (links) =>
    links.map((a) => new URL((a as HTMLAnchorElement).href).pathname),
  );
  return [...new Set(hrefs)].filter((p) => p !== "/" && /^\/[a-z-]+$/.test(p));
}

/** Horizontal overflow of the document, in pixels. Zero is the only pass. */
export const horizontalOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

/**
 * **The touch probe: it measures the finger, not the box.**
 *
 * A box may be smaller than 44px; the touch area may not. For every control,
 * nine points of a **44px circle** centered on it — the center and eight on
 * the edge, every 45° — must land **on it**.
 *
 * **A circle, not a square.** The browser honors `border-radius` when it
 * decides what was hit, so the corner of a rounded button is not touchable,
 * and a round 44px avatar would fail a square while having no defect. A
 * finger misses by distance from the center, the same in every direction —
 * the model WCAG 2.5.8 uses for spacing.
 *
 * `elementFromPoint` answers who would get the touch there, with everything
 * the screen really does: the `touch-area` pseudo-element, an ancestor with
 * `overflow: hidden` that clips it, a neighbor painted on top. **A point that
 * lands on another control is an invasion** — the fear of tapping the right
 * button and triggering its neighbor — and is reported apart from a point
 * that lands on nothing, which is a short area.
 *
 * The points sit 21px from the center, not 22: 22 lands on the exact edge,
 * where sub-pixel rounding decides on its own.
 */
export const PROBE_RADIUS = 21;

export type TouchResult = { name: string; box: string; missed: string[]; pointsMissed: number };

export const probeTouch = (page: Page, scope = "main"): Promise<TouchResult[]> =>
  page.evaluate(
    ({ radius, scope }) => {
      const SELECTOR = ["button", '[role="tab"]', 'a[class*="inline-flex"]', 'input:not([type="hidden"])', "select", "textarea"].join(", ");
      const nameOf = (el: Element) =>
        (
          el.getAttribute("aria-label") ||
          (el as HTMLInputElement).labels?.[0]?.textContent ||
          el.textContent ||
          el.getAttribute("placeholder") ||
          el.tagName.toLowerCase()
        )
          .trim()
          .replace(/\s+/g, " ")
          .slice(0, 40);
      const controlOf = (node: Element | null) => node?.closest?.(SELECTOR) ?? null;

      const out: { name: string; box: string; missed: string[]; pointsMissed: number }[] = [];
      for (const el of document.querySelectorAll(`${scope} ${SELECTOR.split(", ").join(`, ${scope} `)}`)) {
        if ((el as HTMLButtonElement).disabled || el.closest("[inert], [aria-hidden='true']")) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === "hidden" || cs.display === "none") continue;
        // A box inside a label: the target is the label, which toggles the whole row.
        const label = el.matches('input[type="checkbox"], input[type="radio"]') ? el.closest("label") : null;
        const own = el.getBoundingClientRect();
        // Visually hidden inputs carry their touch on the label that dresses them.
        if ((own.width <= 2 || own.height <= 2) && !label) continue;
        if ((label ?? el).getClientRects().length === 0) continue;

        // Without bringing the control into view, elementFromPoint answers null
        // and the defect is invented.
        (label ?? el).scrollIntoView({ block: "center", inline: "center" });
        const r = (label ?? el).getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;

        const missed: string[] = [];
        const points: [number, number][] = [[0, 0]];
        for (let deg = 0; deg < 360; deg += 45) {
          const rad = (deg * Math.PI) / 180;
          points.push([radius * Math.cos(rad), radius * Math.sin(rad)]);
        }
        for (const [dx, dy] of points) {
          const hit = document.elementFromPoint(cx + dx, cy + dy);
          const ok = hit !== null && (el === hit || el.contains(hit) || [...((el as HTMLInputElement).labels ?? [])].some((l) => l.contains(hit)));
          if (ok) continue;
          const other = controlOf(hit);
          missed.push(other && other !== el ? `invaded by "${nameOf(other)}"` : "outside the area");
        }
        out.push({ name: nameOf(el), box: `${Math.round(r.width)}x${Math.round(r.height)}`, missed: [...new Set(missed)], pointsMissed: missed.length });
      }
      window.scrollTo(0, 0);
      return out;
    },
    { radius: PROBE_RADIUS, scope },
  );
