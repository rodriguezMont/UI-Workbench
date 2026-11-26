import { useEffect, useId, useRef, useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  type UniqueIdentifier,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ImagePlus, MoreVertical, Star, Trash2, XCircle } from "lucide-react";

import { cn } from "@/lib/cn";
import { IMAGE_FORMATS } from "@/lib/image-formats";
import { messages } from "@/messages";

import { ActionMenu, ActionMenuContent, ActionMenuItem, ActionMenuSeparator, ActionMenuTrigger, usePendingFocus } from "./action-menu";
import { Badge } from "./badge";
import { Button } from "./button";
import { useImagePicker } from "./image-cropper";

const m = messages.ui.photoGallery;

/**
 * A photo gallery, in the order its owner chooses.
 *
 * **The first photo is the main one.** There is no separate "main" field apart
 * from the order: the photo that opens the gallery is the one that represents
 * it. "Make main" is only a shortcut that takes a photo to the front.
 *
 * **Reordering is @dnd-kit's, with three paths:** dragging with a mouse,
 * dragging with a finger, and the keyboard — Space picks up, the arrows move,
 * Space drops, Escape cancels. A screen reader hears every step.
 *
 * **Drag by the handle, never by the photo.** On a phone, a photo that drags
 * as a whole would steal the gesture that scrolls the page; the handle is
 * small, clear, and the only thing that holds the finger.
 *
 * **Every new photo goes through the [cropper](./image-cropper.tsx)**, in 4:3.
 *
 * **Each photo has two buttons**: the handle and an
 * [action menu](./action-menu.tsx) — make main and, separated and in the error
 * color, remove. Three 44px buttons do not fit on a 136px photo on a phone;
 * two do.
 *
 * **`max` only applies the number it is given** — how many photos are allowed
 * is the product's rule, not the gallery's.
 *
 * **An empty gallery does not show to someone who can only look**: where
 * absence is normal, showing a zero says something is wrong. For whoever
 * edits, the empty gallery is the invitation.
 */

export type GalleryPhoto = {
  id: string;
  url: string;
  /** What the photo shows. Without it: "Photo 2 of {label}". */
  alt?: string;
  /** The cropped file, for photos added in this visit. */
  file?: Blob;
};

type PhotoGalleryProps = {
  /** The gallery's heading — also what each photo's default text names. */
  label: string;
  /** Controlled: the photos, in order. */
  photos?: GalleryPhoto[];
  /** Uncontrolled: the photos it starts with. */
  defaultPhotos?: GalleryPhoto[];
  onPhotosChange?: (photos: GalleryPhoto[]) => void;
  max?: number;
  editable?: boolean;
  headingLevel?: 2 | 3;
  className?: string;
};

export function PhotoGallery({
  label,
  photos,
  defaultPhotos = [],
  onPhotosChange,
  max = 12,
  editable = false,
  headingLevel = 2,
  className,
}: PhotoGalleryProps) {
  const base = useId();
  const headingId = `${base}-heading`;
  const Heading = `h${headingLevel}` as const;

  const [inner, setInner] = useState<GalleryPhoto[]>(defaultPhotos);
  const current = photos ?? inner;
  const [announcement, setAnnouncement] = useState("");
  // The addresses created here are ours and are given back on unmount; the
  // ones received from outside are not.
  const owned = useRef(new Set<string>());
  useEffect(() => {
    const live = owned.current;
    return () => live.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  // The handles, to place focus after a photo is removed or promoted.
  const handles = useRef(new Map<string, HTMLElement>());
  const addButton = useRef<HTMLButtonElement>(null);
  // A removal takes the photo's menu away: focus goes to the next photo.
  const focus = usePendingFocus();

  function change(next: GalleryPhoto[]) {
    if (photos === undefined) setInner(next);
    onPhotosChange?.(next);
  }

  // The photo that just came in: focus goes to it if the add tile disappears
  // — the gallery filled up with it.
  const latest = useRef<string | null>(null);
  const counter = useRef(0);
  const picker = useImagePicker({
    format: IMAGE_FORMATS.photo,
    onCropped: (file) => {
      const url = URL.createObjectURL(file);
      owned.current.add(url);
      counter.current += 1;
      const id = `${base}-new-${counter.current}`;
      latest.current = id;
      change([...current, { id, url, file }]);
      setAnnouncement(m.added(current.length + 1));
    },
    // With room left, focus returns to "Add photo", for the next one.
    returnFocusTo: () => addButton.current ?? (latest.current ? handles.current.get(latest.current) : null),
  });

  function remove(index: number) {
    const photo = current[index]!;
    if (owned.current.delete(photo.url)) URL.revokeObjectURL(photo.url);
    const next = current.filter((_, i) => i !== index);
    change(next);
    setAnnouncement(m.removed(index + 1, next.length, max));
    // The next one, or the previous one, or the add tile.
    const target = next[index]?.id ?? next[index - 1]?.id;
    focus.focusLater(() => (target ? handles.current.get(target) : addButton.current));
  }

  function makeMain(index: number) {
    const photo = current[index]!;
    change(arrayMove(current, index, 0));
    setAnnouncement(m.nowMain(index + 1));
    // The menu would return focus to its own button, which moved with the
    // photo; the handle is the more useful place to go on arranging from.
    focus.focusLater(() => handles.current.get(photo.id));
  }

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    // A short tap on the handle is not a drag: the finger must rest a moment.
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const position = (id: UniqueIdentifier | undefined) => current.findIndex((p) => p.id === id) + 1;

  function drop({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    change(arrayMove(current, position(active.id) - 1, position(over.id) - 1));
  }

  if (!editable && current.length === 0) return null;

  const full = current.length >= max;

  return (
    <section aria-labelledby={headingId} className={cn("w-full", className)}>
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3">
        <Heading id={headingId} className="text-base font-bold text-primary">
          {label}
        </Heading>
        {editable ? <p className="text-sm tabular-nums text-secondary">{m.count(current.length, max)}</p> : null}
      </div>
      {editable ? <p className="mb-3 text-sm text-secondary">{m.instructions}</p> : null}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={drop}
        accessibility={{
          screenReaderInstructions: { draggable: m.dragInstructions },
          announcements: {
            onDragStart: ({ active }) => m.pickedUp(position(active.id)),
            onDragOver: ({ active, over }) => (over ? m.over(position(active.id), position(over.id)) : m.outside(position(active.id))),
            onDragEnd: ({ active, over }) => (over ? m.dropped(position(over.id)) : m.stayed(position(active.id))),
            onDragCancel: ({ active }) => m.cancelled(position(active.id)),
          },
        }}
      >
        <SortableContext items={current.map((p) => p.id)} strategy={rectSortingStrategy}>
          {/* Two columns already on a 375px phone; more when they fit. */}
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(8.5rem,100%),1fr))] gap-3">
            {current.map((photo, i) => (
              <GalleryItem
                key={photo.id}
                photo={photo}
                index={i}
                label={label}
                editable={editable}
                handles={handles}
                onRemove={() => remove(i)}
                onMakeMain={() => makeMain(i)}
                onMenuClose={focus.onCloseAutoFocus}
              />
            ))}
            {editable && !full ? (
              <li>
                <button
                  ref={addButton}
                  type="button"
                  onClick={picker.pick}
                  className={cn(
                    "flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-border-strong",
                    "text-sm font-medium text-secondary transition-colors duration-[var(--motion-instant)] ease-[var(--motion-ease)]",
                    "hover:border-accent hover:text-accent",
                  )}
                >
                  <ImagePlus size={24} aria-hidden />
                  {m.add}
                </button>
              </li>
            ) : null}
          </ul>
        </SortableContext>
      </DndContext>

      {editable && full ? <p className="mt-2 text-sm text-secondary">{m.full(max)}</p> : null}
      {picker.error ? (
        <p role="alert" className="mt-2 flex items-start gap-1.5 text-sm font-medium text-error">
          <XCircle size={16} aria-hidden className="mt-0.5 shrink-0" />
          {picker.error}
        </p>
      ) : null}
      {/* What the buttons did, for whoever does not see the photo move. */}
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
      {picker.picker}
    </section>
  );
}

function GalleryItem({
  photo,
  index,
  label,
  editable,
  handles,
  onRemove,
  onMakeMain,
  onMenuClose,
}: {
  photo: GalleryPhoto;
  index: number;
  label: string;
  editable: boolean;
  handles: React.RefObject<Map<string, HTMLElement>>;
  onRemove: () => void;
  onMakeMain: () => void;
  onMenuClose: (event: Event) => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: photo.id,
    disabled: !editable,
  });
  const n = index + 1;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "relative aspect-[4/3] overflow-hidden rounded-md border border-border bg-surface-placeholder",
        isDragging && "z-10 shadow-lg ring-2 ring-accent",
      )}
    >
      <img src={photo.url} alt={photo.alt ?? m.photoOf(n, label)} draggable={false} className="size-full object-cover" />
      {index === 0 && editable ? (
        <Badge variant="solid" className="absolute right-2 top-2 shadow-md">
          <Star size={12} aria-hidden fill="currentColor" />
          {m.main}
        </Badge>
      ) : null}
      {editable ? (
        <>
          <Button
            ref={(el: HTMLButtonElement | null) => {
              setActivatorNodeRef(el);
              if (el) handles.current.set(photo.id, el);
              else handles.current.delete(photo.id);
            }}
            variant="overlay"
            size="icon"
            {...attributes}
            {...listeners}
            aria-label={m.move(n)}
            // The handle holds the finger: without this a touch on it would
            // scroll the page.
            className="absolute left-2 top-2 cursor-grab touch-none active:cursor-grabbing"
          >
            <GripVertical size={20} aria-hidden />
          </Button>
          <div className="absolute bottom-2 right-2">
            <ActionMenu>
              <ActionMenuTrigger asChild>
                <Button variant="overlay" size="icon" aria-label={m.actions(n)}>
                  <MoreVertical size={20} aria-hidden />
                </Button>
              </ActionMenuTrigger>
              <ActionMenuContent onCloseAutoFocus={onMenuClose}>
                {index > 0 ? (
                  <>
                    <ActionMenuItem icon={Star} onSelect={onMakeMain}>
                      {m.makeMain}
                    </ActionMenuItem>
                    <ActionMenuSeparator />
                  </>
                ) : null}
                <ActionMenuItem icon={Trash2} destructive onSelect={onRemove}>
                  {m.remove}
                </ActionMenuItem>
              </ActionMenuContent>
            </ActionMenu>
          </div>
        </>
      ) : null}
    </li>
  );
}
