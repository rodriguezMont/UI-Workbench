import { Suspense, useEffect } from "react";
import { BrowserRouter, Link, Route, Routes, useLocation } from "react-router";

import { Loading, Skeleton } from "@/components/ui/loading";
import { RouteProgress } from "@/components/ui/progress";
import { TooltipProvider } from "@/components/ui/tooltip";
import { messages } from "@/messages";

import { LedgerProvider } from "./ledger";
import { Home } from "./pages/Home";
import { PAGES } from "./pages";
import { SECTIONS } from "./registry";
import { Shell } from "./Shell";

/**
 * The workbench app: the router lives here, never in a library component.
 * Routes are `/` for the map and `/<section>` for each built section.
 */

/** A new page starts at the top — unless the address points at a piece. */
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

/**
 * While a section's code arrives: the shape of a section page, and the route
 * bar at the top of the window — the one the Progress piece shows embedded.
 */
function SectionLoading() {
  return (
    <>
      <RouteProgress active />
      <Loading label={messages.workbench.loadingSection}>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-80 max-w-full" />
        <Skeleton className="mt-6 h-40 w-full" />
      </Loading>
    </>
  );
}

function NotFound() {
  const t = messages.workbench.notFound;
  return (
    <div className="space-y-3">
      <h1 className="text-3xl font-bold">{t.title}</h1>
      <p className="text-secondary">{t.text}</p>
      <p>
        <Link to="/" className="text-link underline underline-offset-2">
          {t.back}
        </Link>
      </p>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <LedgerProvider>
        <TooltipProvider delayDuration={200}>
          <Shell>
            <Suspense fallback={<SectionLoading />}>
              <Routes>
                <Route index element={<Home />} />
                {SECTIONS.filter((s) => s.built).map((section) => {
                  const Page = PAGES[section.id];
                  return Page ? <Route key={section.id} path={section.id} element={<Page />} /> : null;
                })}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </Shell>
        </TooltipProvider>
      </LedgerProvider>
    </BrowserRouter>
  );
}
