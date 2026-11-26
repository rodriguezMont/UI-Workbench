/**
 * The layout ruler: the workbench measured in a browser that really draws.
 *
 * **What it asks**: is every section the right size, in the right place, at
 * every width and in both schemes? It is not a unit test and does not run in
 * CI — it needs a dev server and a real browser. It is the check done before
 * calling a visual change done, and the numbers go in the report.
 *
 *   npm run dev        # in another terminal
 *   npm run measure    # or: TARGET=http://localhost:5181 npm run measure
 *
 * It exits with code 1 if any ruler fails.
 */
import { chromium, type Page } from "playwright";

import { WIDTHS, createReport, horizontalOverflow, lockLedger, open, probeTouch, sectionPaths } from "./ruler/lib.ts";

const { check, lines, close } = createReport();
const checkLedger = lockLedger(check);

/** The approval seal is the reviewer's: the touch probe skips it, and nothing here clicks it. */
const isSeal = (name: string) => /^Approve\b|^Approved on\b/.test(name);

const browser = await chromium.launch();

async function newPage(width: number, scheme: "light" | "dark" = "light"): Promise<{ page: Page; errors: string[] }> {
  const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: scheme });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  return { page, errors };
}

try {
  const first = await newPage(1280);
  const sections = await sectionPaths(first.page);
  await first.page.close();
  check("the shell lists the sections", sections.length >= 8, sections.join(" "));

  // ── Every section, every width ───────────────────────────────────────────
  lines.push("", `NO HORIZONTAL SCROLL, NO ERRORS — ${WIDTHS.join(" · ")}, light; 1280, dark`);
  const runs: [number, "light" | "dark"][] = [...WIDTHS.map((w) => [w, "light"] as [number, "light"]), [1280, "dark"]];
  for (const [width, scheme] of runs) {
    const { page, errors } = await newPage(width, scheme);
    const overflowing: string[] = [];
    let pieces = 0;
    for (const path of sections) {
      await open(page, path);
      const overflow = await horizontalOverflow(page);
      if (overflow > 0) overflowing.push(`${path} +${overflow}px`);
      pieces += await page.locator("main section[id] [data-demo]").count();
    }
    check(`${width}px ${scheme}: no section scrolls sideways`, overflowing.length === 0, overflowing.join(", ") || `${pieces} pieces`);
    check(`${width}px ${scheme}: no console or page errors`, errors.length === 0, errors.slice(0, 2).join(" | "));
    await page.close();
  }

  // ── The side panel, on a computer ────────────────────────────────────────
  lines.push("", "SIDE PANEL (1280px)");
  {
    const { page } = await newPage(1280);
    await open(page, sections[0]!);
    const aside = page.locator("aside").first();
    const expanded = (await aside.boundingBox())!.width;
    await page.getByRole("button", { name: "Collapse the panel" }).click();
    await page.waitForTimeout(500);
    const collapsed = (await aside.boundingBox())!.width;
    check("collapses", collapsed < expanded / 2, `${Math.round(expanded)}px -> ${Math.round(collapsed)}px`);
    const labels = await aside.locator('nav[aria-label="Workbench sections"] a').evaluateAll((links) => links.map((a) => a.getAttribute("aria-label")));
    check("collapsed, every section keeps an accessible name", labels.length >= 8 && labels.every(Boolean), `${labels.length} links`);
    await page.getByRole("button", { name: "Expand the panel" }).click();
    await page.waitForTimeout(500);
    check("expands back", Math.round((await aside.boundingBox())!.width) === Math.round(expanded));
    await page.close();
  }

  // ── The drawer, on a phone ───────────────────────────────────────────────
  lines.push("", "DRAWER (375px)");
  {
    const { page } = await newPage(375);
    await open(page, sections[0]!);
    const menu = page.getByRole("button", { name: "Open the menu" });
    await menu.click();
    await page.waitForTimeout(400);
    const drawer = page.getByRole("dialog", { name: "Workbench sections" });
    check("the menu opens the drawer", await drawer.isVisible());
    check("focus moves into the drawer", await drawer.evaluate((el) => el.contains(document.activeElement)));
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
    check("Escape closes it", (await page.getByRole("dialog").count()) === 0);
    check("focus returns to the menu button", await menu.evaluate((el) => document.activeElement === el));
    await page.close();
  }

  // ── The route bar ────────────────────────────────────────────────────────
  lines.push("", "ROUTE BAR (1280px)");
  {
    const { page } = await newPage(1280);
    await open(page, "/");
    const seen = page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          let frames = 0;
          const t0 = performance.now();
          const tick = () => {
            if (document.querySelector(".ui-route-bar")) frames++;
            if (performance.now() - t0 < 1500) requestAnimationFrame(tick);
            else resolve(frames);
          };
          tick();
        }),
    );
    await page.locator(`nav a[href="${sections[1]}"]`).first().click();
    const frames = await seen;
    check("a first visit to a section shows the bar while its code arrives", frames > 0, `${frames} frames`);
    await page.close();
  }

  // ── Contrast, measured on the page ───────────────────────────────────────
  lines.push("", "CONTRAST, MEASURED ON THE PAGE (Roles)");
  for (const scheme of ["light", "dark"] as const) {
    const { page } = await newPage(1280, scheme);
    await open(page, "/foundation");
    await page.waitForFunction(() => document.querySelectorAll("#roles tbody tr").length > 0 && !document.querySelector("#roles td")?.textContent?.includes("measuring"));
    const rows = await page.$$eval("#roles tbody tr", (trs) => trs.map((tr) => [...tr.querySelectorAll("td")].map((td) => td.textContent?.trim() ?? "")));
    const fails = rows.filter((cells) => cells.at(-1) === "Fails").map((cells) => cells[1]);
    check(`${scheme}: every measured pair passes`, rows.length > 0 && fails.length === 0, fails.join(", ") || `${rows.length} pairs`);
    await page.close();
  }

  // ── Touch, on a phone ────────────────────────────────────────────────────
  lines.push("", "TOUCH AREA — a 44px circle on every control (375px)");
  {
    const { page } = await newPage(375);
    for (const path of sections) {
      await open(page, path);
      const results = (await probeTouch(page)).filter((r) => !isSeal(r.name));
      const short = results.filter((r) => r.pointsMissed > 0);
      check(
        `${path}: every control takes a finger`,
        short.length === 0,
        short.length ? short.slice(0, 4).map((r) => `"${r.name}" ${r.box} ${r.missed.join(", ")}`).join(" · ") : `${results.length} controls`,
      );
    }
    await page.close();
  }
} finally {
  checkLedger(lines);
  await browser.close();
}

close();
