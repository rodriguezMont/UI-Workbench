import { lazy } from "react";

import type { SectionId } from "../registry";
import { trackRouteLoad } from "../route-loading";

/**
 * One page per built section, each loaded on first visit — the map and the
 * shell stay light while sections grow. The registry test checks this map
 * against the registry both ways: a built section without a page, or a page
 * for a section marked "to build", fails. Each import is tracked, so the route
 * bar shows while a section's code is on its way (`route-loading.ts`).
 */
export const PAGES: Partial<Record<SectionId, React.LazyExoticComponent<() => React.ReactNode>>> = {
  foundation: lazy(() => trackRouteLoad(import("./FoundationPage").then((m) => ({ default: m.FoundationPage })))),
  primitives: lazy(() => trackRouteLoad(import("./PrimitivesPage").then((m) => ({ default: m.PrimitivesPage })))),
  forms: lazy(() => trackRouteLoad(import("./FormsPage").then((m) => ({ default: m.FormsPage })))),
  data: lazy(() => trackRouteLoad(import("./DataPage").then((m) => ({ default: m.DataPage })))),
  states: lazy(() => trackRouteLoad(import("./StatesPage").then((m) => ({ default: m.StatesPage })))),
  navigation: lazy(() => trackRouteLoad(import("./NavigationPage").then((m) => ({ default: m.NavigationPage })))),
  content: lazy(() => trackRouteLoad(import("./ContentPage").then((m) => ({ default: m.ContentPage })))),
  overlay: lazy(() => trackRouteLoad(import("./OverlayPage").then((m) => ({ default: m.OverlayPage })))),
};
