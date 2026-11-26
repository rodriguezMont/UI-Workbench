import { messages } from "@/messages";

import { Piece, PieceNote, State } from "../Piece";
import { SectionPage } from "./SectionPage";
import {
  AlertDialogDemo,
  AlertOverlayDemo,
  CelebrationDialogDemo,
  CitySheetDemo,
  FilterOverlayDemo,
  FullScreenDemo,
  RenameDialogDemo,
  SortSheetDemo,
  ToastKindsDemo,
  ToastThreeDemo,
} from "./overlay-demos";

const t = messages.workbench.demos;

export function OverlayPage() {
  return (
    <SectionPage id="overlay">
      <Piece id="overlay">
        <State label={t.overlay.default} note={t.overlay.defaultNote}>
          <FilterOverlayDemo />
        </State>
        <State label={t.overlay.alert} note={t.overlay.alertNote}>
          <AlertOverlayDemo />
        </State>
        <PieceNote paragraphs={t.overlay.explain} />
      </Piece>

      <Piece id="sheet">
        <State label={t.sheet.drag} note={t.sheet.dragNote}>
          <SortSheetDemo />
        </State>
        <State label={t.sheet.long} note={t.sheet.longNote}>
          <CitySheetDemo />
        </State>
        <PieceNote paragraphs={t.sheet.explain} />
      </Piece>

      <Piece id="dialog">
        <State label={t.dialog.plain} note={t.dialog.plainNote}>
          <RenameDialogDemo />
        </State>
        <State label={t.dialog.alert} note={t.dialog.alertNote}>
          <AlertDialogDemo />
        </State>
        <State label={t.dialog.celebrate} note={t.dialog.celebrateNote} wide>
          <CelebrationDialogDemo />
        </State>
        <PieceNote paragraphs={t.dialog.explain} />
      </Piece>

      <Piece id="full-screen-panel">
        <State label={t.fullScreen.label} note={t.fullScreen.note} wide>
          <FullScreenDemo />
        </State>
        <PieceNote paragraphs={t.fullScreen.explain} />
      </Piece>

      <Piece id="toast">
        <State label={t.toast.kinds} note={t.toast.kindsNote}>
          <ToastKindsDemo />
        </State>
        <State label={t.toast.three} note={t.toast.threeNote}>
          <ToastThreeDemo />
        </State>
        <PieceNote paragraphs={t.toast.explain} />
      </Piece>
    </SectionPage>
  );
}
