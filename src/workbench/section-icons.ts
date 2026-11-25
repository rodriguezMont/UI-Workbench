import type { LucideIcon } from "lucide-react";
import { Blocks, CircleDashed, Compass, Layers, LayoutGrid, Palette, Table2, TextCursorInput } from "lucide-react";

import type { SectionId } from "./registry";

/**
 * One icon per section. The icon is what keeps the collapsed panel useful as
 * navigation instead of just giving width back: collapsed, it is all that
 * remains. Kept apart from the registry so the registry stays plain data.
 */
export const SECTION_ICONS: Record<SectionId, LucideIcon> = {
  foundation: Palette,
  primitives: Blocks,
  forms: TextCursorInput,
  data: Table2,
  states: CircleDashed,
  navigation: Compass,
  content: LayoutGrid,
  overlay: Layers,
};
