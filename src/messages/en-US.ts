/**
 * Every string the interface shows, in one place — en-US.
 *
 * Components and pages never hard-code copy: they read it from here. A second
 * locale later is a second file of the same `Messages` shape, chosen in
 * `index.ts`; nothing else changes.
 */
export const enUS = {
  workbench: {
    title: "UI Workbench",
    tokens: {
      heading: "Design tokens",
      intro:
        "Every role in both color schemes. Components read only these roles; the scales underneath are edited to rebrand.",
      theme: {
        legend: "Color scheme",
        system: "System",
        light: "Light",
        dark: "Dark",
      },
      groups: {
        surface: "Surfaces",
        text: "Text on surface",
        boundary: "Boundaries",
        accent: "Accent and action",
        state: "States",
        chart: "Charts",
        feature: "Feature panel (dark in both schemes)",
      },
      sample: "The quick brown fox",
      forcedDark: "This section forces the dark scheme with data-theme.",
    },
  },
} as const;
