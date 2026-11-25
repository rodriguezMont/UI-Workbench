import { useRef, useState } from "react";
import { Copy, FolderInput, ImagePlus, MoreHorizontal, Pencil, Share2, Star, Trash2 } from "lucide-react";

import {
  ActionMenu,
  ActionMenuContent,
  ActionMenuItem,
  ActionMenuSeparator,
  ActionMenuTrigger,
} from "@/components/ui/action-menu";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent } from "@/components/ui/dialog";
import { messages } from "@/messages";

import { Outcome } from "../Outcome";
import { SAMPLE_LANDSCAPE } from "../samples";

const t = messages.workbench.demos.actionMenu;

/**
 * The action menu where it lives: at the end of a list row, next to what it
 * acts on. A bare "…" button in an empty cell would not show the one thing
 * the piece is about — which row the actions belong to.
 */
function Row({ title, meta, children }: { title: string; meta: string; children: React.ReactNode }) {
  return (
    <div className="flex w-full items-center gap-3 rounded-md border border-border bg-surface px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-primary">{title}</p>
        <p className="truncate text-xs text-secondary">{meta}</p>
      </div>
      {children}
    </div>
  );
}

function Trigger({ name }: { name: string }) {
  return (
    <ActionMenuTrigger asChild>
      <Button variant="ghost" size="icon" aria-label={t.trigger(name)}>
        <MoreHorizontal size={18} aria-hidden />
      </Button>
    </ActionMenuTrigger>
  );
}

export function DefaultMenuDemo() {
  const [last, setLast] = useState("");
  return (
    <div className="flex w-full flex-col gap-2">
      <Row title={t.file} meta={t.fileMeta}>
        <ActionMenu>
          <Trigger name={t.file} />
          <ActionMenuContent align="end">
            <ActionMenuItem icon={Pencil} onSelect={() => setLast(t.rename)}>
              {t.rename}
            </ActionMenuItem>
            <ActionMenuItem icon={Share2} onSelect={() => setLast(t.share)}>
              {t.share}
            </ActionMenuItem>
            <ActionMenuItem icon={Copy} onSelect={() => setLast(t.duplicate)}>
              {t.duplicate}
            </ActionMenuItem>
            <ActionMenuSeparator />
            <ActionMenuItem icon={Trash2} destructive onSelect={() => setLast(t.delete)}>
              {t.delete}
            </ActionMenuItem>
          </ActionMenuContent>
        </ActionMenu>
      </Row>
      <Outcome label={t.outcome} value={last} />
    </div>
  );
}

export function UnavailableMenuDemo() {
  const [last, setLast] = useState("");
  return (
    <div className="flex w-full flex-col gap-2">
      <Row title={t.file} meta={t.fileMeta}>
        <ActionMenu>
          <Trigger name={t.file} />
          <ActionMenuContent align="end">
            <ActionMenuItem icon={Pencil} onSelect={() => setLast(t.rename)}>
              {t.rename}
            </ActionMenuItem>
            <ActionMenuItem icon={FolderInput} disabled description={t.moveDisabled}>
              {t.move}
            </ActionMenuItem>
            <ActionMenuItem icon={Share2} onSelect={() => setLast(t.share)}>
              {t.share}
            </ActionMenuItem>
          </ActionMenuContent>
        </ActionMenu>
      </Row>
      <Outcome label={t.outcome} value={last} />
    </div>
  );
}

export function PhotoMenuDemo() {
  const [last, setLast] = useState("");
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="relative aspect-[4/3] w-full max-w-xs overflow-hidden rounded-md">
        <img src={SAMPLE_LANDSCAPE} alt={t.photo} className="size-full object-cover" />
        <div className="absolute right-2 top-2">
          <ActionMenu>
            <ActionMenuTrigger asChild>
              <Button variant="overlay" size="icon" aria-label={t.trigger(t.photo)}>
                <MoreHorizontal size={18} aria-hidden />
              </Button>
            </ActionMenuTrigger>
            <ActionMenuContent align="end">
              <ActionMenuItem icon={ImagePlus} onSelect={() => setLast(t.replace)}>
                {t.replace}
              </ActionMenuItem>
              <ActionMenuItem icon={Star} onSelect={() => setLast(t.makeCover)}>
                {t.makeCover}
              </ActionMenuItem>
              <ActionMenuSeparator />
              <ActionMenuItem icon={Trash2} destructive onSelect={() => setLast(t.remove)}>
                {t.remove}
              </ActionMenuItem>
            </ActionMenuContent>
          </ActionMenu>
        </div>
      </div>
      <Outcome label={t.outcome} value={last} />
    </div>
  );
}

/**
 * Deleting takes the row away — and with it the trigger that focus would go
 * back to. So focus moves to the button that restores the row, which still
 * exists, instead of falling to the top of the page.
 */
export function ConfirmMenuDemo() {
  const [asking, setAsking] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [last, setLast] = useState("");
  const restore = useRef<HTMLButtonElement>(null);

  return (
    <div className="flex w-full flex-col gap-2">
      {deleted ? (
        <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-dashed border-border px-3 py-2 text-sm text-secondary">
          <span className="min-w-0 flex-1">{t.deleted}</span>
          <Button
            ref={restore}
            variant="link"
            className="px-0"
            onClick={() => {
              setDeleted(false);
              setLast(t.restore);
            }}
          >
            {t.restore}
          </Button>
        </div>
      ) : (
        <Row title={t.file} meta={t.fileMeta}>
          <ActionMenu>
            <Trigger name={t.file} />
            <ActionMenuContent align="end">
              <ActionMenuItem icon={Pencil} onSelect={() => setLast(t.rename)}>
                {t.rename}
              </ActionMenuItem>
              <ActionMenuSeparator />
              <ActionMenuItem icon={Trash2} destructive onSelect={() => setAsking(true)}>
                {t.deleteConfirm}
              </ActionMenuItem>
            </ActionMenuContent>
          </ActionMenu>
        </Row>
      )}

      <AlertDialog open={asking} onOpenChange={setAsking}>
        <AlertDialogContent
          title={t.confirmTitle}
          description={t.confirmText}
          onCloseAutoFocus={(e) => {
            if (!deleted) return;
            e.preventDefault();
            restore.current?.focus();
          }}
        >
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel asChild>
              <Button variant="secondary">{t.cancel}</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                onClick={() => {
                  setDeleted(true);
                  setLast(t.delete);
                }}
              >
                <Trash2 size={16} aria-hidden />
                {t.delete}
              </Button>
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      <Outcome label={t.outcome} value={last} />
    </div>
  );
}
