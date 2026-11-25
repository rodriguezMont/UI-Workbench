import { useEffect, useState } from "react";
import { FolderPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { ErrorState } from "@/components/ui/error";
import { Loading, SkeletonCard } from "@/components/ui/loading";
import { PageSpinner, ProgressBar, RouteProgress, Spinner } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast";
import { messages } from "@/messages";

import { Sample, Section } from "./Section";

const t = messages.workbench.states;

function Skeletons() {
  return (
    <Sample title={t.skeleton.title} note={t.skeleton.note}>
      <Loading label={t.skeleton.label} className="max-w-lg">
        <SkeletonCard />
        <SkeletonCard />
      </Loading>
    </Sample>
  );
}

function Empties() {
  return (
    <Sample title={t.empty.title}>
      <div className="grid gap-4 lg:grid-cols-2">
        <Empty
          title={t.empty.withSuggestions}
          description={t.empty.withSuggestionsHint}
          suggestions={t.empty.suggestions}
          onSuggestion={(term) => toast(`${t.empty.searching} “${term}”`)}
        />
        <Empty icon={FolderPlus} title={t.empty.withAction} description={t.empty.withActionHint}>
          <Button>{t.empty.create}</Button>
        </Empty>
      </div>
    </Sample>
  );
}

function Errors() {
  return (
    <Sample title={t.error.title} note={t.error.note}>
      <ErrorState
        alive={false}
        description={t.error.description}
        onRetry={() => toast(t.error.retrying)}
        code="req_8f3a21c7"
        className="max-w-lg"
      />
    </Sample>
  );
}

function Toasts() {
  const kinds = ["info", "success", "warning", "error"] as const;
  return (
    <Sample title={t.toast.title} note={t.toast.note}>
      <div className="flex flex-wrap gap-3">
        {kinds.map((kind) => (
          <Button
            key={kind}
            variant="secondary"
            onClick={() =>
              kind === "error"
                ? toast.error(t.toast.messages.error, { description: t.toast.errorDescription })
                : toast[kind](t.toast.messages[kind])
            }
          >
            {t.toast[kind]}
          </Button>
        ))}
      </div>
    </Sample>
  );
}

function Progress() {
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    if (!navigating) return;
    const done = setTimeout(() => setNavigating(false), 1800);
    return () => clearTimeout(done);
  }, [navigating]);

  return (
    <Sample title={t.progress.title}>
      <div className="flex max-w-md flex-col gap-4">
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

      <div className="flex flex-wrap items-center gap-6">
        <Button disabled>
          <Spinner size={16} />
          {t.progress.saving}
        </Button>
        <PageSpinner label={t.progress.page} />
        <PageSpinner size={24} label={t.progress.pageSmall} />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs text-subtle">{t.progress.route}</span>
        <div className="relative h-12 overflow-hidden rounded-md border border-border bg-surface-sunken">
          <RouteProgress active={navigating} embedded />
        </div>
        <div>
          <Button variant="secondary" size="sm" onClick={() => setNavigating(true)} disabled={navigating}>
            {t.progress.simulate}
          </Button>
        </div>
      </div>
    </Sample>
  );
}

export function StatesSection() {
  return (
    <Section id="states" heading={t.heading} intro={t.intro}>
      <div className="flex flex-col gap-8">
        <Skeletons />
        <Separator />
        <Empties />
        <Separator />
        <Errors />
        <Separator />
        <Toasts />
        <Separator />
        <Progress />
      </div>
    </Section>
  );
}
