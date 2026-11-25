import { lazy } from "react";

import type { SectionId } from "../registry";

/**
 * One page per built section, each loaded on first visit — the map and the
 * shell stay light while sections grow. The registry test checks this map
 * against the registry both ways: a built section without a page, or a page
 * for a section marked "to build", fails.
 */
export const PAGES: Partial<Record<SectionId, React.LazyExoticComponent<() => React.ReactNode>>> = {
  foundation: lazy(() => import("./FoundationPage").then((m) => ({ default: m.FoundationPage }))),
  primitives: lazy(() => import("./PrimitivesPage").then((m) => ({ default: m.PrimitivesPage }))),
  forms: lazy(() => import("./FormsPage").then((m) => ({ default: m.FormsPage }))),
  states: lazy(() => import("./StatesPage").then((m) => ({ default: m.StatesPage }))),
  navigation: lazy(() => import("./NavigationPage").then((m) => ({ default: m.NavigationPage }))),
  content: lazy(() => import("./ContentPage").then((m) => ({ default: m.ContentPage }))),
  overlay: lazy(() => import("./OverlayPage").then((m) => ({ default: m.OverlayPage }))),
};
