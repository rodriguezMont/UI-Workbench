/**
 * The workbench registry — the single source of what exists and where.
 *
 * It lists the whole map from day one, on purpose: what has no shape yet is
 * marked `built: false`. A workbench that only lists what already exists hides
 * what is missing.
 *
 * **The registry does not say whether a piece is approved.** Approval lives
 * in `approvals.json`; the state shown on screen is **derived** from both
 * (`approvals.ts`). Two places saying the same thing is how counts start to
 * disagree.
 *
 * Names and summaries come from the messages module, like every other string
 * on screen. This file is pure data, so the dev-server plugin that writes
 * approvals can import it to validate ids.
 */
import { messages } from "../messages";

const m = messages.workbench;

export type SectionId = keyof typeof m.sections;

export type Section = {
  /** Also the URL segment: `/primitives`. */
  id: SectionId;
  name: string;
  /** One line, for the map. */
  summary: string;
  /** The paragraph that opens the section's page: the rule it protects. */
  intro: string;
  /** `false` while the section has no page. */
  built: boolean;
};

/** Registry order is display order, in the panel and on the map. */
const SECTION_ORDER: readonly { id: SectionId; built: boolean }[] = [
  { id: "foundation", built: true },
  { id: "primitives", built: true },
  { id: "forms", built: true },
  { id: "data", built: true },
  { id: "states", built: true },
  { id: "navigation", built: true },
  { id: "content", built: true },
  { id: "overlay", built: true },
];

export const SECTIONS: readonly Section[] = SECTION_ORDER.map((s) => ({ ...s, ...m.sections[s.id] }));

export type ComponentId = keyof typeof m.components;

export type ComponentEntry = {
  /**
   * Also the element `id` on the page, so it is an anchor (`/primitives#button`)
   * and, for library components, the file name in `src/components/ui/`.
   * Renaming one breaks links and the registry test.
   */
  id: ComponentId;
  name: string;
  section: SectionId;
  summary: string;
  /**
   * `false` while the piece has no shape: it shows on the map as "to build"
   * and **stays out of the counts**, approved or pending. What is missing to
   * build and what is missing to review are two different lists.
   *
   * Absent means built: the exception is what gets declared.
   */
  built?: false;
};

type Row = { id: ComponentId; section: SectionId; built?: false };

const ROWS: readonly Row[] = [
  // foundation — the layer under the components: tokens, logo, type, grid
  { id: "logo", section: "foundation" },
  { id: "roles", section: "foundation" },
  { id: "typography", section: "foundation" },
  { id: "grid", section: "foundation" },
  { id: "motion", section: "foundation" },
  { id: "icons", section: "foundation" },

  // primitives
  { id: "button", section: "primitives" },
  { id: "link", section: "primitives" },
  { id: "badge", section: "primitives" },
  { id: "avatar", section: "primitives" },
  { id: "tabs", section: "primitives" },
  { id: "tooltip", section: "primitives" },
  { id: "separator", section: "primitives" },
  { id: "action-menu", section: "primitives" },
  { id: "rating", section: "primitives" },

  // forms
  { id: "field", section: "forms" },
  { id: "password-field", section: "forms" },
  { id: "masked-field", section: "forms" },
  { id: "select", section: "forms" },
  { id: "select-search", section: "forms" },
  { id: "select-multiple", section: "forms" },
  { id: "fieldset", section: "forms" },
  { id: "checkbox", section: "forms" },
  { id: "checkbox-card", section: "forms" },
  { id: "checkbox-list", section: "forms" },
  { id: "radio-group", section: "forms" },
  { id: "switch", section: "forms" },
  { id: "rating-input", section: "forms" },
  { id: "segmented-control", section: "forms" },
  { id: "slider", section: "forms" },
  { id: "date-picker", section: "forms" },
  { id: "time-picker", section: "forms" },
  { id: "date-time-picker", section: "forms" },
  { id: "file-upload", section: "forms" },
  { id: "photo-upload", section: "forms" },
  { id: "image-cropper", section: "forms" },
  { id: "profile-cover", section: "forms" },
  { id: "photo-gallery", section: "forms" },
  { id: "card-form", section: "forms" },

  // data
  { id: "table", section: "data" },
  { id: "data-table", section: "data" },
  { id: "stat", section: "data" },
  { id: "stat-group", section: "data" },
  { id: "time-series", section: "data" },
  { id: "columns", section: "data" },
  { id: "comparison", section: "data" },
  { id: "ranking", section: "data" },
  { id: "period", section: "data" },
  { id: "meter", section: "data" },
  { id: "radial-kpi", section: "data" },
  { id: "chart-states", section: "data" },

  // states
  { id: "empty", section: "states" },
  { id: "loading", section: "states" },
  { id: "error", section: "states" },
  { id: "progress", section: "states" },

  // navigation
  { id: "app-shell", section: "navigation" },
  { id: "side-menu", section: "navigation" },
  { id: "header", section: "navigation" },
  { id: "breadcrumb", section: "navigation" },
  { id: "footer", section: "navigation" },
  { id: "search", section: "navigation" },
  { id: "filters", section: "navigation" },
  { id: "account-switcher", section: "navigation" },

  // content
  { id: "carousel", section: "content" },
  { id: "map-placeholder", section: "content" },

  // overlay
  { id: "overlay", section: "overlay" },
  { id: "sheet", section: "overlay" },
  { id: "dialog", section: "overlay" },
  { id: "full-screen-panel", section: "overlay" },
  { id: "toast", section: "overlay" },
];

export const COMPONENTS: readonly ComponentEntry[] = ROWS.map((row) => ({ ...row, ...m.components[row.id] }));

export function componentsOf(section: SectionId): readonly ComponentEntry[] {
  return COMPONENTS.filter((c) => c.section === section);
}

/** Does the piece exist in the registry? Checked before anything is written. */
export function findComponent(id: string): ComponentEntry | undefined {
  return COMPONENTS.find((c) => c.id === id);
}

export function findSection(id: string): Section | undefined {
  return SECTIONS.find((s) => s.id === id);
}
