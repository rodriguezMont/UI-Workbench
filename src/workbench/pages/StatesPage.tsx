import { FolderPlus, WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { ErrorState } from "@/components/ui/error";
import { PageSpinner, Spinner } from "@/components/ui/progress";
import { toast } from "@/components/ui/toast";
import { messages } from "@/messages";

import { Piece, PieceNote, State } from "../Piece";
import { SectionPage } from "./SectionPage";
import {
  CardSkeletonDemo,
  EmptySearchDemo,
  LoadedCardsDemo,
  LooseSkeletonDemo,
  RouteBarDemo,
  UploadBar,
  UploadMotionDemo,
} from "./state-demos";

const t = messages.workbench.demos;

export function StatesPage() {
  return (
    <SectionPage id="states">
      <Piece id="empty">
        <State label={t.empty.search} note={t.empty.searchNote}>
          <EmptySearchDemo />
        </State>
        <State label={t.empty.action} note={t.empty.actionNote}>
          <Empty icon={FolderPlus} title={t.empty.withAction} description={t.empty.withActionHint}>
            <div className="flex flex-wrap justify-center gap-2">
              <Button>{t.empty.create}</Button>
              <Button variant="secondary">{t.empty.importFile}</Button>
            </div>
          </Empty>
        </State>
        <PieceNote paragraphs={t.empty.explain} />
      </Piece>

      <Piece id="loading">
        <State label={t.loading.card} note={t.loading.cardNote}>
          <CardSkeletonDemo />
        </State>
        <State label={t.loading.data} note={t.loading.dataNote}>
          <LoadedCardsDemo />
        </State>
        <State label={t.loading.loose} note={t.loading.looseNote} wide>
          <LooseSkeletonDemo />
        </State>
        <PieceNote paragraphs={t.loading.explain} />
      </Piece>

      <Piece id="error">
        <State label={t.error.timeout} note={t.error.timeoutNote}>
          <ErrorState
            alive={false}
            title={t.error.timeoutTitle}
            description={t.error.timeoutDescription}
            onRetry={() => toast(t.error.retrying)}
            code="req_8f3a21c7"
          />
        </State>
        <State label={t.error.offline} note={t.error.offlineNote}>
          <ErrorState
            alive={false}
            icon={WifiOff}
            title={t.error.offlineTitle}
            description={t.error.offlineDescription}
            onRetry={() => toast(t.error.retrying)}
          />
        </State>
        <PieceNote paragraphs={t.error.explain} />
      </Piece>

      <Piece id="progress">
        <State label={t.progress.starting} note={t.progress.startingNote}>
          <UploadBar value={0.08} />
        </State>
        <State label={t.progress.halfway} note={t.progress.halfwayNote}>
          <UploadBar value={0.45} />
        </State>
        <State label={t.progress.done} note={t.progress.doneNote}>
          <UploadBar value={1} tone="success" />
        </State>
        <State label={t.progress.failed} note={t.progress.failedNote}>
          <UploadBar value={0.6} tone="error" />
        </State>
        <State label={t.progress.motion} note={t.progress.motionNote}>
          <UploadMotionDemo />
        </State>
        <State label={t.progress.spinner} note={t.progress.spinnerNote}>
          {/* Busy, not disabled: the action keeps its full strength while it
              runs, and says so — `aria-busy`, and no second click. */}
          <Button aria-busy aria-disabled onClick={(e) => e.preventDefault()}>
            <Spinner size={16} />
            {t.progress.saving}
          </Button>
        </State>
        <State label={t.progress.ring} note={t.progress.ringNote}>
          <div className="flex flex-col gap-4">
            <PageSpinner size={24} label={t.progress.ringSmall} />
            <PageSpinner label={t.progress.ringMedium} />
            <PageSpinner size={64} label={t.progress.ringLarge} />
          </div>
        </State>
        <State label={t.progress.route} note={t.progress.routeNote}>
          <RouteBarDemo />
        </State>
        <PieceNote paragraphs={t.progress.explain} />
      </Piece>
    </SectionPage>
  );
}
