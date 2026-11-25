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
    empty: {
      didYouMean: "Did you mean",
    },
    error: {
      title: "Couldn't load this",
      retry: "Try again",
      copyCode: "Copy error code",
      copied: "Code copied.",
      copyFailed: "Couldn't copy. The code is right below.",
      /** Read before the revealed code, for people who do not see the layout. */
      codeForSupport: "Code for support:",
    },
    toast: {
      dismiss: "Dismiss notification",
    },
    dialog: {
      close: "Close",
    },
    fullScreenPanel: {
      back: "Back",
    },
    sideMenu: {
      close: "Close the menu",
      /** The invisible backdrop button; never focusable, but still named. */
      closeOutside: "Close the menu by tapping outside it",
    },
    progress: {
      /** Announced while the route bar is running. */
      loadingPage: "Loading the page",
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

    states: {
      heading: "States",
      intro: "Waiting, nothing found, something failed, something happened.",
      skeleton: {
        title: "Skeleton",
        label: "Loading your projects",
        note: "Screen readers hear the label of the waiting region, not the shapes.",
      },
      empty: {
        title: "Empty",
        withSuggestions: "No results for “dashbord”",
        withSuggestionsHint: "Check the spelling or try one of these.",
        suggestions: ["dashboard", "dashboards", "board"],
        searching: "Searching for",
        withAction: "No projects yet",
        withActionHint: "Projects you create or join show up here.",
        create: "Create a project",
      },
      error: {
        title: "Error",
        description: "The list of projects didn't load. Check your connection and try again.",
        retrying: "Trying again…",
        note: "The code is copied, never printed — unless copying fails.",
      },
      toast: {
        title: "Toast",
        info: "Info",
        success: "Success",
        warning: "Warning",
        error: "Error",
        messages: {
          info: "Your export is being prepared",
          success: "Changes saved",
          warning: "Your session expires in 5 minutes",
          error: "Couldn't save your changes",
        },
        errorDescription: "Check your connection and try again.",
        note: "Narrow the window below 768px: the toast becomes a banner under the header.",
      },
      progress: {
        title: "Progress",
        uploading: "Uploading report.pdf",
        uploaded: "Uploaded",
        failed: "Failed at 60%",
        saving: "Saving…",
        page: "Loading your dashboard",
        pageSmall: "Preparing the export",
        route: "Route bar",
        simulate: "Simulate a navigation",
      },
    },

    overlay: {
      heading: "Overlay",
      intro: "What opens on top of the page — and how it closes, traps focus and gives it back.",
      responsive: {
        title: "Overlay (responsive)",
        note: "The frame is picked by width when it opens: a dialog from 768px, a sheet below. Narrow the window and open it again.",
        open: "Filter results",
        heading: "Filter results",
        description: "Pick what to show. The actions stay pinned while the list scrolls.",
        options: ["Open", "In review", "Approved", "Archived", "Shared with me", "Created by me", "Starred", "Overdue"],
        apply: "Show 9 results",
        clear: "Clear filters",
        applied: "Filters applied",
      },
      alert: {
        title: "Overlay (alert)",
        note: "Not dismissable: no outside click, no drag, no handle. Focus starts on Cancel.",
        open: "Delete project",
        heading: "Delete this project?",
        description: "Its 12 files and history will be removed. This cannot be undone.",
        confirm: "Delete project",
        cancel: "Cancel",
        done: "Project deleted",
      },
      dialog: {
        title: "Dialog",
        open: "Rename",
        heading: "Rename project",
        description: "The new name shows up for everyone with access.",
        celebrate: "Celebration layout",
        celebrateHeading: "Request sent!",
        celebrateText: "We'll review it and reply by email as soon as possible.",
        celebrateDone: "Got it",
        save: "Save",
      },
      sheet: {
        title: "Sheet",
        open: "Open sheet",
        heading: "Share",
        description: "Drag the handle down or press Escape to close.",
        body: "A sheet rises from the bottom and closes with a drag. From 768px it stays 512px wide and centered.",
      },
      fullScreen: {
        title: "Full-screen panel",
        open: "Open full screen",
        heading: "Choose a city",
        body: "On a phone, this is where people type to pick from a long list: the panel follows the part of the screen the keyboard leaves free.",
      },
      sideMenu: {
        title: "Side menu",
        note: "Mobile only: narrow the window below 768px to open it. Widening the window closes it.",
        open: "Open menu",
        label: "Sections",
        items: ["Overview", "Projects", "Members", "Settings"],
      },
      actionMenu: {
        title: "Action menu",
        trigger: "Project actions",
        group: "Quarterly report",
        rename: "Rename",
        share: "Share",
        move: "Move to folder",
        moveDisabled: "Only owners can move it.",
        delete: "Delete",
        ran: "Ran",
      },
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
