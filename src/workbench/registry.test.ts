import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { PAGES } from "./pages";
import { COMPONENTS, SECTIONS, componentsOf, findComponent } from "./registry";

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url));

describe("the workbench registry", () => {
  it("points every piece at a section that exists", () => {
    const ids = new Set(SECTIONS.map((s) => s.id));
    for (const c of COMPONENTS) expect(ids, `${c.id} → ${c.section}`).toContain(c.section);
  });

  it("never repeats an id", () => {
    const ids = COMPONENTS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses ids that work as anchors and file names", () => {
    for (const c of COMPONENTS) expect(c.id, c.id).toMatch(/^[a-z0-9-]+$/);
  });

  it("gives every section at least one piece", () => {
    for (const s of SECTIONS) expect(componentsOf(s.id).length, s.id).toBeGreaterThan(0);
  });

  it("finds what exists and invents nothing", () => {
    expect(findComponent("button")?.section).toBe("primitives");
    expect(findComponent("no-such-piece")).toBeUndefined();
  });
});

describe("sections and pages agree", () => {
  it("every built section has a page, and no page exists for a section to build", () => {
    const built = SECTIONS.filter((s) => s.built).map((s) => s.id).sort();
    expect(Object.keys(PAGES).sort()).toEqual(built);
  });

  it("every built piece is shown on its section page, and nothing else is", () => {
    const shown = new Set(
      readdirSync(here("./pages"))
        .filter((f) => f.endsWith("Page.tsx"))
        .flatMap((f) => [...readFileSync(here(`./pages/${f}`), "utf8").matchAll(/<Piece id="([a-z0-9-]+)"/g)].map((m) => m[1]!)),
    );
    const builtInBuiltSections = COMPONENTS.filter(
      (c) => c.built !== false && SECTIONS.find((s) => s.id === c.section)?.built,
    ).map((c) => c.id);

    expect([...shown].sort()).toEqual([...builtInBuiltSections].sort());
  });
});

describe("no component escapes the registry", () => {
  const files = readdirSync(here("../components/ui"))
    .filter((f) => f.endsWith(".tsx") && !f.endsWith(".test.tsx"))
    .map((f) => f.replace(/\.tsx$/, ""));

  it("finds the component files — otherwise this would test nothing", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)("%s has a registry entry", (name) => {
    expect(COMPONENTS.map((c) => c.id)).toContain(name);
  });

  it("a component that exists on disk is not marked 'to build'", () => {
    for (const name of files) expect(findComponent(name)?.built, name).not.toBe(false);
  });
});
