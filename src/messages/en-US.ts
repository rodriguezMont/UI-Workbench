/**
 * Every string the interface shows, in one place — en-US.
 *
 * Components and pages never hard-code copy: they read it from here. A second
 * locale later is a second file of the same `Messages` shape, chosen in
 * `index.ts`; nothing else changes.
 */
export const enUS = {
  /** Copy that lives inside library components. */
  ui: {
    textLink: {
      /** Read after an external link, for people who do not see the glyph. */
      opensInNewTab: "(opens in a new tab)",
    },
  },

  /** Copy of the review workbench (not part of the library). */
  workbench: {
    title: "UI Workbench",
    intro: "A brand-neutral component library, reviewed piece by piece in both color schemes.",
    theme: {
      legend: "Color scheme",
      system: "System",
      light: "Light",
      dark: "Dark",
    },

    tokens: {
      heading: "Design tokens",
      intro:
        "Every role in both color schemes. Components read only these roles; the scales underneath are edited to rebrand.",
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

    foundation: {
      heading: "Foundation",
      intro: "The primitives every other component is built from.",
      buttons: {
        title: "Button",
        variants: "Variants",
        sizes: "Sizes",
        primary: "Save changes",
        alternate: "Compare plans",
        secondary: "Cancel",
        ghost: "Skip for now",
        link: "Show more",
        destructive: "Delete project",
        overlay: "Change photo",
        disabled: "Unavailable",
        small: "Small",
        medium: "Medium",
        large: "Large",
        add: "Add item",
      },
      links: {
        title: "Text link",
        before: "Read the ",
        internal: "setup guide",
        middle: " or the ",
        external: "Tailwind CSS documentation",
        after: ".",
        subtle: "Privacy policy",
      },
      badges: {
        title: "Badge",
        neutral: "Draft",
        accent: "In review",
        action: "New",
        solid: "3 unread",
      },
      avatars: {
        title: "Avatar",
        image: "Profile picture",
        fallbackNote: "The middle one has a broken image URL, so its initials stay.",
      },
      separator: {
        title: "Separator",
        above: "Account",
        below: "Notifications",
        inline: ["Docs", "Pricing", "Changelog"],
      },
      tabs: {
        title: "Tabs",
        scroll: "Scroll (default) — narrow the window: the list scrolls instead of hiding tabs",
        equal: "Equal columns",
        items: {
          overview: "Overview",
          activity: "Activity",
          members: "Members",
          billing: "Billing",
          integrations: "Integrations",
          archive: "Archive",
        },
        panel: "Content of the selected tab.",
        disabledNote: "The last tab is disabled.",
        equalItems: {
          details: "Details",
          contact: "Contact",
          hours: "Hours",
        },
      },
      tooltip: {
        title: "Tooltip",
        trigger: "Copy link",
        content: "Copies the page address",
        note: "Hover or tab to the button.",
      },
    },
  },
} as const;
