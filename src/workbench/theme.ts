import { useSyncExternalStore } from "react";

/**
 * The workbench's light/dark switch — a convenience for whoever reviews, not
 * product state. The choice stays in the reviewer's browser.
 *
 * Without a stored choice the page follows the operating system (the token
 * layer's default). The attribute goes on `<html>`: dialogs, sheets and toasts
 * render at the end of `<body>` and would come out light from a dark section.
 *
 * `index.html` applies the stored choice before the first paint, so a dark
 * workbench does not flash white. It uses the same storage key.
 */

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "ui-workbench-theme";

const DARK_QUERY = "(prefers-color-scheme: dark)";

function read(): Theme {
  const forced = document.documentElement.dataset.theme;
  if (forced === "light" || forced === "dark") return forced;
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const system = window.matchMedia(DARK_QUERY);
  system.addEventListener("change", onChange);
  return () => {
    observer.disconnect();
    system.removeEventListener("change", onChange);
  };
}

/** The scheme the page is showing right now, forced or from the system. */
export function useWorkbenchTheme(): Theme {
  return useSyncExternalStore(subscribe, read, () => "light");
}

export function setWorkbenchTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  // Private browsing or blocked storage: the scheme still switches, it just
  // does not survive a reload.
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* no storage, no memory — that is all */
  }
}
