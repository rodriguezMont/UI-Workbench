/**
 * The finger ruler: the workbench used by touch, on a simulated iPhone and a
 * simulated Android.
 *
 * **What it asks.** `measure-workbench.ts` asks "is it the right size, in the
 * right place?"; this one asks "does it work with a finger?". It taps — touch
 * events, not mouse clicks — on the pieces used by hand and checks the
 * result: the list that opens and chooses, the search that takes the
 * keyboard, the field that takes typing at 16px (below that, Safari zooms the
 * page on focus), the overlay that opens as a sheet.
 *
 *   iPhone 13 → WebKit, Safari's engine
 *   Pixel 7   → Chromium, Chrome's engine
 *
 * **What it does not prove.** Emulation is not a device: there is no virtual
 * keyboard, Safari's zoom does not happen (its cause, the font size, is
 * checked instead), and Android does not pull a touch to the nearest target.
 * A real device is still the last check.
 *
 *   npm run dev            # in another terminal
 *   npm run measure:touch  # or: TARGET=http://localhost:5181 npm run measure:touch
 *
 * Needs Playwright's WebKit once: `npx playwright install webkit`.
 * It exits with code 1 if any ruler fails.
 */
import { chromium, devices, webkit, type BrowserType, type Locator, type Page } from "playwright";

import { createReport, horizontalOverflow, lockLedger, open } from "./ruler/lib.ts";

const { check, lines, close } = createReport();
const checkLedger = lockLedger(check);

const DEVICES: [string, BrowserType][] = [
  ["iPhone 13", webkit],
  ["Pixel 7", chromium],
];

/**
 * Brings it into view and only then taps. Tapping during an automatic scroll
 * hits where the element WAS — a "field does not take typing" that was the
 * script's defect, not the piece's.
 */
async function tap(page: Page, target: Locator) {
  await target.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await target.tap();
}
const settle = (page: Page) => page.waitForTimeout(350);

async function measureDevice(name: string, engine: BrowserType) {
  let browser;
  try {
    browser = await engine.launch();
  } catch (error) {
    check(`${name}: the browser opens`, false, "run `npx playwright install webkit chromium`");
    console.error(String(error).split("\n")[0]);
    return;
  }

  try {
    const page = await (await browser.newContext({ ...devices[name] })).newPage();
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));

    await open(page, "/forms");
    const width = page.viewportSize()!.width;
    lines.push("", `${name.toUpperCase()} — ${engine.name()} ${browser.version()}, ${width}px, touch`);
    const n = (label: string) => `${name}: ${label}`;

    check(n("no sideways scroll"), (await horizontalOverflow(page)) === 0);

    // The select: a tap opens the list inside the screen; a tap on an option chooses and closes.
    const single = page.locator("#select").getByRole("combobox").first();
    await tap(page, single);
    await settle(page);
    const list = page.getByRole("listbox");
    const panel = await list.boundingBox();
    check(n("a tap opens the list, inside the screen"), panel !== null && panel.x >= 0 && panel.x + panel.width <= width + 0.5, panel ? `${Math.round(panel.width)}px of ${width}` : "the list did not open");
    const option = list.getByRole("option").nth(1);
    const chosen = (await option.textContent())?.trim() ?? "";
    await option.tap();
    await settle(page);
    check(n("a tap on an option chooses and closes"), ((await single.textContent()) ?? "").includes(chosen) && (await single.getAttribute("aria-expanded")) === "false", chosen);

    // The select with search: the search takes focus at 16px, and a tap on a result chooses.
    const searchable = page.locator("#select-search").getByRole("combobox").first();
    await tap(page, searchable);
    await settle(page);
    const search = page.getByRole("combobox", { name: /^Search / });
    check(
      n("the search takes focus, at 16px"),
      (await search.evaluate((el) => document.activeElement === el)) && (await search.evaluate((el) => getComputedStyle(el).fontSize)) === "16px",
    );
    await search.pressSequentially("lon");
    await page.waitForTimeout(150);
    await page.getByRole("listbox").getByRole("option", { name: /London/ }).tap();
    await settle(page);
    check(n("the search chooses by touch"), ((await searchable.textContent()) ?? "").includes("London"));

    // The multiple select: taps toggle, the list stays open, Clear empties, a tap outside closes.
    const multiple = page.locator("#select-multiple").getByRole("combobox").first();
    await tap(page, multiple);
    await settle(page);
    const options = page.getByRole("listbox").getByRole("option");
    await options.nth(0).tap();
    await options.nth(2).tap();
    await page.waitForTimeout(150);
    check(
      n("taps toggle, and the list stays open"),
      (await multiple.getAttribute("aria-expanded")) === "true" &&
        (await options.nth(0).getAttribute("aria-selected")) === "true" &&
        (await options.nth(2).getAttribute("aria-selected")) === "true",
    );
    await page.getByRole("button", { name: "Clear", exact: true }).tap();
    await page.waitForTimeout(150);
    check(n("Clear by touch empties the choice"), (await options.nth(0).getAttribute("aria-selected")) === "false");
    await page.locator("h1").tap();
    await settle(page);
    check(n("a tap outside closes"), (await multiple.getAttribute("aria-expanded")) === "false");

    // A field: it takes typing, at 16px.
    const fullName = page.getByLabel("Full name", { exact: true }).first();
    await tap(page, fullName);
    await fullName.pressSequentially("Maria");
    check(
      n("a field takes typing, at 16px"),
      (await fullName.inputValue()) === "Maria" && (await fullName.evaluate((el) => getComputedStyle(el).fontSize)) === "16px",
    );

    // The overlay: on a phone, the same content opens as a sheet.
    await open(page, "/overlay");
    await tap(page, page.getByRole("button", { name: "Filter projects" }));
    await page.waitForTimeout(700);
    check(n("the overlay opens as a sheet"), (await page.locator("[data-vaul-drawer]").count()) === 1);

    check(n("no page errors"), errors.length === 0, errors.slice(0, 2).join(" | "));
  } finally {
    await browser.close();
  }
}

try {
  for (const [name, engine] of DEVICES) await measureDevice(name, engine);
} finally {
  checkLedger(lines);
}
close();
