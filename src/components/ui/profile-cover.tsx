import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, Pencil, Trash2, XCircle } from "lucide-react";

import { cn } from "@/lib/cn";
import { IMAGE_FORMATS } from "@/lib/image-formats";
import { messages } from "@/messages";

import { ActionMenu, ActionMenuContent, ActionMenuItem, ActionMenuSeparator, ActionMenuTrigger, usePendingFocus } from "./action-menu";
import { Button } from "./button";
import { useImagePicker } from "./image-cropper";
import { Rating, type RatingSummary } from "./rating";

const m = messages.ui.profileCover;

/**
 * The top of a profile: a cover image, a logo and a name.
 *
 * **The formats come from [`image-formats.ts`](../../lib/image-formats.ts)**:
 * a 4:1 cover and a 1:1 logo shown in a circle. Replacing either goes through
 * the [cropper](./image-cropper.tsx), so what arrives here is already the
 * final file.
 *
 * **No cover is not a gray box.** The empty state is a light veil over the
 * ornament gradient: it says "an image goes here" in the theme's own colors.
 * No text sits straight on the gradient — it would fail contrast on its
 * strongest stretch — so the invitation is a button.
 *
 * **No logo, the initials** — never a hole where the profile's face should be.
 *
 * **With an image, editing is an [action menu](./action-menu.tsx)** — replace,
 * and, separated and in the error color, remove. **Without one, a direct
 * button**: a menu with a single action is a button. The buttons over the
 * image have their own background (the `overlay` variant), because the picture
 * underneath can be any color. After a removal, focus goes to the add button
 * that takes the menu's place.
 *
 * **Nothing is sent from here**: the caller receives each file through
 * `onCoverChange` and `onLogoChange`, and `null` when the person removes it.
 */

type ProfileCoverProps = {
  name: string;
  /** The supporting line under the name. */
  subtitle?: string;
  rating?: RatingSummary;
  coverUrl?: string;
  logoUrl?: string;
  /** With the edit buttons — the owner of the profile, on their own page. */
  editable?: boolean;
  onCoverChange?: (file: Blob | null) => void;
  onLogoChange?: (file: Blob | null) => void;
  /** The heading level on the caller's page. */
  headingLevel?: 2 | 3;
  className?: string;
};

/** "Jane Q Doe" → "JQ": the first letter of the first two words. */
export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join("");
}

/**
 * The image chosen during this visit: its address is ours, and it is given back
 * when replaced, removed, or when the piece leaves the screen.
 */
function useLocalImage(initial?: string) {
  const [url, setUrl] = useState(initial);
  const owned = useRef<string | null>(null);
  useEffect(
    () => () => {
      if (owned.current) URL.revokeObjectURL(owned.current);
    },
    [],
  );
  function replace(file: Blob | null) {
    if (owned.current) URL.revokeObjectURL(owned.current);
    owned.current = file ? URL.createObjectURL(file) : null;
    setUrl(owned.current ?? undefined);
  }
  return [url, replace] as const;
}

export function ProfileCover({
  name,
  subtitle,
  rating,
  coverUrl,
  logoUrl,
  editable = false,
  onCoverChange,
  onLogoChange,
  headingLevel = 2,
  className,
}: ProfileCoverProps) {
  const [cover, setCover] = useLocalImage(coverUrl);
  const [logo, setLogo] = useLocalImage(logoUrl);
  const Heading = `h${headingLevel}` as const;

  const coverPicker = useImagePicker({
    format: IMAGE_FORMATS.cover,
    onCropped: (file) => {
      setCover(file);
      onCoverChange?.(file);
    },
  });
  const logoPicker = useImagePicker({
    format: IMAGE_FORMATS.logo,
    onCropped: (file) => {
      setLogo(file);
      onLogoChange?.(file);
    },
  });
  const error = coverPicker.error ?? logoPicker.error;
  // A refusal is about the last choice: choosing the other image clears it.
  const pickCover = () => {
    logoPicker.clearError();
    coverPicker.pick();
  };
  const pickLogo = () => {
    coverPicker.clearError();
    logoPicker.pick();
  };

  // A removal takes the menu's button away: focus goes to the add button.
  const focus = usePendingFocus();
  const addCover = useRef<HTMLButtonElement>(null);
  const addLogo = useRef<HTMLButtonElement>(null);

  return (
    <section aria-label={m.region(name)} className={cn("w-full", className)}>
      <div
        className="relative aspect-[4/1] w-full overflow-hidden rounded-lg border border-border"
        style={
          cover
            ? undefined
            : {
                // The light veil over the gradient: the theme shows, and what
                // sits on top stays legible.
                background:
                  "linear-gradient(color-mix(in srgb, var(--surface) 72%, transparent), color-mix(in srgb, var(--surface) 72%, transparent)), var(--ornament-gradient)",
              }
        }
      >
        {cover ? (
          // The cover is the profile's ornament: listeners get the name right below.
          <img src={cover} alt="" className="size-full object-cover" />
        ) : editable ? (
          // The logo rises over the cover's lower left corner, so the left
          // side is kept clear of it: on a short cover (a narrow column) a
          // centered button and hint ran under the logo.
          <div className="flex size-full flex-col items-center justify-center gap-1 pl-24 pr-4 text-center sm:pl-36">
            <Button ref={addCover} variant="secondary" onClick={pickCover}>
              <ImagePlus size={18} aria-hidden />
              {m.addCover}
            </Button>
            <p className="hidden text-xs text-secondary sm:block">{m.coverHint}</p>
          </div>
        ) : null}

        {editable && cover ? (
          <div className="absolute right-2 top-2">
            <ActionMenu>
              <ActionMenuTrigger asChild>
                <Button variant="overlay" size="icon" aria-label={m.editCover}>
                  <Pencil size={20} aria-hidden />
                </Button>
              </ActionMenuTrigger>
              <ActionMenuContent onCloseAutoFocus={focus.onCloseAutoFocus}>
                <ActionMenuItem icon={ImagePlus} onSelect={pickCover}>
                  {m.replaceCover}
                </ActionMenuItem>
                <ActionMenuSeparator />
                <ActionMenuItem
                  icon={Trash2}
                  destructive
                  onSelect={() => {
                    setCover(null);
                    onCoverChange?.(null);
                    focus.focusLater(() => addCover.current);
                  }}
                >
                  {m.removeCover}
                </ActionMenuItem>
              </ActionMenuContent>
            </ActionMenu>
          </div>
        ) : null}
      </div>

      {/* The logo and its button on one row; the name below, full width. With
          the name beside it, a name that wrapped pushed the logo off the
          cover on narrow screens. */}
      <div className="flex items-end justify-between gap-3 px-3 sm:px-5">
        {/* The logo rises half its own height over the cover. */}
        <div className="relative -mt-10 shrink-0 sm:-mt-14">
          <div className="flex size-20 items-center justify-center overflow-hidden rounded-full border-4 border-surface bg-surface-emblem shadow-sm sm:size-28">
            {logo ? (
              <img src={logo} alt={m.logoOf(name)} className="size-full object-cover" />
            ) : (
              <span aria-hidden className="text-xl font-bold text-secondary sm:text-2xl">
                {initialsOf(name)}
              </span>
            )}
          </div>
          {editable && logo ? (
            <ActionMenu>
              <ActionMenuTrigger asChild>
                <Button variant="overlay" size="icon-sm" aria-label={m.editLogo} className="absolute -bottom-1 -right-1 border border-border">
                  <Camera size={18} aria-hidden />
                </Button>
              </ActionMenuTrigger>
              <ActionMenuContent align="start" onCloseAutoFocus={focus.onCloseAutoFocus}>
                <ActionMenuItem icon={ImagePlus} onSelect={pickLogo}>
                  {m.replaceLogo}
                </ActionMenuItem>
                <ActionMenuSeparator />
                <ActionMenuItem
                  icon={Trash2}
                  destructive
                  onSelect={() => {
                    setLogo(null);
                    onLogoChange?.(null);
                    focus.focusLater(() => addLogo.current);
                  }}
                >
                  {m.removeLogo}
                </ActionMenuItem>
              </ActionMenuContent>
            </ActionMenu>
          ) : editable ? (
            <Button
              ref={addLogo}
              variant="overlay"
              size="icon-sm"
              aria-label={m.addLogo}
              className="absolute -bottom-1 -right-1 border border-border"
              onClick={pickLogo}
            >
              <Camera size={18} aria-hidden />
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-2 px-3 sm:px-5">
        {/* It wraps rather than truncates: the name is what people look for. */}
        <Heading className="text-lg font-bold text-primary [overflow-wrap:anywhere] sm:text-xl">{name}</Heading>
        {subtitle || rating ? (
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-secondary">
            {subtitle ? <span>{subtitle}</span> : null}
            {rating ? <Rating value={rating.value} count={rating.count} size="sm" /> : null}
          </div>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="mt-2 flex items-start gap-1.5 px-3 text-sm font-medium text-error sm:px-5">
          <XCircle size={16} aria-hidden className="mt-0.5 shrink-0" />
          {error}
        </p>
      ) : null}

      {coverPicker.picker}
      {logoPicker.picker}
    </section>
  );
}
