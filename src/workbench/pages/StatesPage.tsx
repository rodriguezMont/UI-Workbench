import { useEffect, useState } from "react";
import { FolderPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { ErrorState } from "@/components/ui/error";
import { Loading, SkeletonCard } from "@/components/ui/loading";
import { PageSpinner, ProgressBar, RouteProgress, Spinner } from "@/components/ui/progress";
import { toast } from "@/components/ui/toast";
import { messages } from "@/messages";

import { Piece, State } from "../Piece";
import { SectionPage } from "./SectionPage";

const t = messages.workbench.demos;

function RouteBarDemo() {
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    if (!navigating) return;
    const done = setTimeout(() => setNavigating(false), 1800);
    return () => clearTimeout(done);
  }, [navigating]);

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="relative h-12 overflow-hidden rounded-md border border-border bg-surface-sunken">
        <RouteProgress active={navigating} embedded />
      </div>
      <div>
        <Button variant="secondary" size="sm" onClick={() => setNavigating(true)} disabled={navigating}>
          {t.progress.simulate}
        </Button>
      </div>
    </div>
  );
}

export function StatesPage() {
  return (
    <SectionPage id="states">
      <Piece id="empty">
        <State label={t.empty.suggestions} note={t.empty.suggestionsNote}>
          <Empty
            title={t.empty.withSuggestions}
            description={t.empty.withSuggestionsHint}
            suggestions={t.empty.terms}
            onSuggestion={(term) => toast(`${t.empty.searching} “${term}”`)}
          />
        </State>
        <State label={t.empty.action}>
          <Empty icon={FolderPlus} title={t.empty.withAction} description={t.empty.withActionHint}>
            <Button>{t.empty.create}</Button>
          </Empty>
        </State>
      </Piece>

      <Piece id="loading">
        <State label={t.loading.label} note={t.loading.note} wide>
          <Loading label={t.loading.region} className="w-full max-w-lg">
            <SkeletonCard />
            <SkeletonCard />
          </Loading>
        </State>
      </Piece>

      <Piece id="error">
        <State label={t.error.label} note={t.error.note} wide>
          <ErrorState
            alive={false}
            description={t.error.description}
            onRetry={() => toast(t.error.retrying)}
            code="req_8f3a21c7"
            className="max-w-lg"
          />
        </State>
      </Piece>

      <Piece id="progress">
        <State label={t.progress.bar} note={t.progress.barNote}>
          <div className="flex w-full flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-sm text-primary">{t.progress.uploading}</span>
              <ProgressBar value={0.45} label={t.progress.uploading} />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm text-success">{t.progress.uploaded}</span>
              <ProgressBar value={1} tone="success" label={t.progress.uploading} valueText={t.progress.uploaded} />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm text-error">{t.progress.failed}</span>
              <ProgressBar value={0.6} tone="error" label={t.progress.uploading} valueText={t.progress.failed} />
            </div>
          </div>
        </State>
        <State label={t.progress.spinners} note={t.progress.spinnersNote}>
          <Button disabled>
            <Spinner size={16} />
            {t.progress.saving}
          </Button>
          <PageSpinner label={t.progress.page} />
          <PageSpinner size={24} label={t.progress.pageSmall} />
        </State>
        <State label={t.progress.route} note={t.progress.routeNote} wide>
          <RouteBarDemo />
        </State>
      </Piece>
    </SectionPage>
  );
}
