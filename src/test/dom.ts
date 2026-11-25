import { stubMatchMedia } from "./match-media";

/**
 * The browser APIs popovers and lists rely on that jsdom does not implement:
 * `matchMedia`, `ResizeObserver` and `scrollIntoView`. Call it before rendering
 * a component that opens a floating panel.
 */
export function installDomStubs({ wide = true }: { wide?: boolean } = {}) {
  stubMatchMedia(wide);
  const globals = globalThis as { ResizeObserver?: unknown };
  if (!globals.ResizeObserver) {
    globals.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
  if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};
}
