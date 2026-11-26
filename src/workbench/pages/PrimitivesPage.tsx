import { Fragment } from "react";
import { Activity, Camera, Check, Clock, Info, LayoutGrid, Plus, Settings, Star, Trash2, Users } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TextLink } from "@/components/ui/link";
import { Rating } from "@/components/ui/rating";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipContent, TooltipRoot, TooltipTrigger } from "@/components/ui/tooltip";
import { messages } from "@/messages";

import { Piece, PieceNote, State } from "../Piece";
import { SAMPLE_LANDSCAPE, SAMPLE_PORTRAIT } from "../samples";
import { ConfirmMenuDemo, DefaultMenuDemo, PhotoMenuDemo, UnavailableMenuDemo } from "./menu-demos";
import { SectionPage } from "./SectionPage";

const t = messages.workbench.demos;

/** The same four tabs in both layouts, so the two read side by side. */
const TABS = [
  { key: "overview", icon: LayoutGrid },
  { key: "activity", icon: Activity },
  { key: "members", icon: Users },
  { key: "settings", icon: Settings },
] as const;

function TabsDemo({ layout }: { layout: "scroll" | "equal" }) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList variant={layout === "equal" ? "equal" : undefined}>
        {TABS.map(({ key, icon: Icon }) => (
          <TabsTrigger key={key} value={key} disabled={key === "settings"}>
            {layout === "equal" ? <Icon size={18} aria-hidden /> : null}
            {t.tabs.items[key]}
          </TabsTrigger>
        ))}
      </TabsList>
      {TABS.map(({ key }) => (
        <TabsContent key={key} value={key} className="pt-3 text-sm text-secondary">
          {t.tabs.panels[key]}
        </TabsContent>
      ))}
    </Tabs>
  );
}

export function PrimitivesPage() {
  return (
    <SectionPage id="primitives">
      <Piece id="button">
        <State label={t.button.variants} note={t.button.variantsNote}>
          <Button>{t.button.primary}</Button>
          <Button variant="alternate">{t.button.alternate}</Button>
          <Button variant="secondary">{t.button.secondary}</Button>
          <Button variant="ghost">{t.button.ghost}</Button>
          <Button variant="link">{t.button.link}</Button>
        </State>
        <State label={t.button.sizes} note={t.button.sizesNote}>
          <Button size="sm">{t.button.small}</Button>
          <Button size="md">{t.button.medium}</Button>
          <Button size="lg">{t.button.large}</Button>
          <Button size="icon" variant="secondary" aria-label={t.button.add}>
            <Plus size={18} aria-hidden />
          </Button>
        </State>
        <State label={t.button.withIcon} note={t.button.withIconNote}>
          <Button>
            <Check size={16} aria-hidden />
            {t.button.confirm}
          </Button>
          <Button variant="secondary">
            <Star size={16} aria-hidden />
            {t.button.favorite}
          </Button>
        </State>
        <State label={t.button.disabledLabel} note={t.button.disabledNote}>
          <Button disabled>{t.button.disabled}</Button>
          <Button variant="secondary" disabled>
            {t.button.disabled}
          </Button>
        </State>
        <State label={t.button.asLink} note={t.button.asLinkNote}>
          <Button asChild variant="secondary">
            <a href="#button">{t.button.anchor}</a>
          </Button>
        </State>
        <State label={t.button.onPhoto} note={t.button.onPhotoNote}>
          <div className="relative flex h-24 w-56 items-center justify-center overflow-hidden rounded-md">
            <img src={SAMPLE_LANDSCAPE} alt="" className="absolute inset-0 size-full object-cover" />
            <Button variant="overlay" size="sm" className="relative">
              <Camera size={16} aria-hidden />
              {t.button.overlay}
            </Button>
          </div>
        </State>
        <State label={t.button.destructiveLabel} note={t.button.destructiveNote} wide>
          {/* The trigger offers; the red button only confirms, inside the
              alert dialog, where the person has read what they will lose. */}
          <Button variant="secondary">
            <Trash2 size={16} aria-hidden />
            {t.button.destructive}
          </Button>
          <Button variant="destructive">
            <Trash2 size={16} aria-hidden />
            {t.button.confirmDestructive}
          </Button>
        </State>
        <PieceNote paragraphs={t.button.explain} />
      </Piece>

      <Piece id="link">
        <State label={t.link.inline} note={t.link.inlineNote} wide>
          <p className="text-sm text-primary">
            {t.link.before}
            <TextLink href="#link">{t.link.internal}</TextLink>
            {t.link.middle}
            <TextLink href="#link">{t.link.changelog}</TextLink>
            {t.link.after}
          </p>
        </State>
        <State label={t.link.externalLabel} note={t.link.externalNote}>
          <p className="text-sm text-primary">
            {t.link.externalBefore}
            <TextLink href="https://lucide.dev" external>
              {t.link.external}
            </TextLink>
            {t.link.externalAfter}
          </p>
        </State>
        <State label={t.link.subtle} note={t.link.subtleNote}>
          <p className="flex items-center gap-2 text-xs text-secondary">
            <TextLink href="#link" tone="subtle">
              {t.link.privacy}
            </TextLink>
            <span aria-hidden>·</span>
            <TextLink href="#link" tone="subtle">
              {t.link.terms}
            </TextLink>
          </p>
        </State>
        <PieceNote paragraphs={t.link.explain} />
      </Piece>

      <Piece id="badge">
        <State label={t.badge.variants} note={t.badge.variantsNote}>
          <Badge>{t.badge.neutral}</Badge>
          <Badge variant="accent">{t.badge.accent}</Badge>
          <Badge variant="action">{t.badge.action}</Badge>
          <Badge variant="solid">{t.badge.solid}</Badge>
        </State>
        <State label={t.badge.withIcon} note={t.badge.withIconNote}>
          <Badge variant="action">
            <Check size={12} aria-hidden />
            {t.badge.verified}
          </Badge>
          <Badge variant="accent">
            <Clock size={12} aria-hidden />
            {t.badge.review}
          </Badge>
        </State>
        <PieceNote paragraphs={t.badge.explain} />
      </Piece>

      <Piece id="avatar">
        <State label={t.avatar.states} note={t.avatar.note}>
          <Avatar>
            <AvatarImage src={SAMPLE_PORTRAIT} alt={t.avatar.image} />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarImage src="/missing-picture.png" alt={t.avatar.image} />
            <AvatarFallback>AK</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>MR</AvatarFallback>
          </Avatar>
        </State>
        <State label={t.avatar.sizes} note={t.avatar.sizesNote}>
          <Avatar className="size-8">
            <AvatarFallback className="text-xs">JD</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <Avatar className="size-14">
            <AvatarFallback className="text-base">JD</AvatarFallback>
          </Avatar>
        </State>
        <PieceNote paragraphs={t.avatar.explain} />
      </Piece>

      <Piece id="tabs">
        <State label={t.tabs.scroll} note={t.tabs.scrollNote}>
          <TabsDemo layout="scroll" />
        </State>
        <State label={t.tabs.equal} note={t.tabs.equalNote}>
          <TabsDemo layout="equal" />
        </State>
        <PieceNote paragraphs={t.tabs.explain} />
      </Piece>

      <Piece id="tooltip">
        <State label={t.tooltip.label} note={t.tooltip.note} wide>
          <TooltipRoot>
            <TooltipTrigger asChild>
              <Button size="icon" variant="secondary" aria-label={t.tooltip.trigger}>
                <Info size={18} aria-hidden />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t.tooltip.content}</TooltipContent>
          </TooltipRoot>
          <TooltipRoot>
            <TooltipTrigger asChild>
              <Button variant="ghost">{t.tooltip.textTrigger}</Button>
            </TooltipTrigger>
            <TooltipContent>{t.tooltip.textContent}</TooltipContent>
          </TooltipRoot>
        </State>
        <PieceNote paragraphs={t.tooltip.explain} />
      </Piece>

      <Piece id="separator">
        <State label={t.separator.horizontal} note={t.separator.horizontalNote}>
          <div className="flex w-full max-w-sm flex-col text-sm text-secondary">
            <span>{t.separator.above}</span>
            <Separator className="my-3" />
            <span>{t.separator.below}</span>
          </div>
        </State>
        <State label={t.separator.vertical} note={t.separator.verticalNote}>
          {/* A vertical separator takes the row's height, so it sits directly
              in a row that has one. */}
          <div className="flex h-8 items-center gap-3 text-sm text-secondary">
            {t.separator.inline.map((label, i) => (
              <Fragment key={label}>
                {i > 0 ? <Separator orientation="vertical" /> : null}
                <span>{label}</span>
              </Fragment>
            ))}
          </div>
        </State>
        <PieceNote paragraphs={t.separator.explain} />
      </Piece>

      <Piece id="action-menu">
        <State label={t.actionMenu.defaultLabel} note={t.actionMenu.defaultNote}>
          <DefaultMenuDemo />
        </State>
        <State label={t.actionMenu.unavailableLabel} note={t.actionMenu.unavailableNote}>
          <UnavailableMenuDemo />
        </State>
        <State label={t.actionMenu.photoLabel} note={t.actionMenu.photoNote}>
          <PhotoMenuDemo />
        </State>
        <State label={t.actionMenu.confirmLabel} note={t.actionMenu.confirmNote}>
          <ConfirmMenuDemo />
        </State>
        <PieceNote paragraphs={t.actionMenu.explain} />
      </Piece>

      <Piece id="rating">
        <State label={t.rating.list} note={t.rating.listNote}>
          <div className="flex flex-col gap-2">
            <Rating value={4.3} count={128} size="sm" />
            <Rating value={5} count={1} size="sm" />
          </div>
        </State>
        <State label={t.rating.detail} note={t.rating.detailNote}>
          <Rating value={4.6} count={1280} />
        </State>
        <State label={t.rating.compact} note={t.rating.compactNote}>
          <Rating value={4.8} count={312} variant="compact" size="sm" />
          <Rating value={2.8} count={45} variant="compact" />
        </State>
        <State label={t.rating.fraction} note={t.rating.fractionNote}>
          <Rating value={2.25} count={9} />
        </State>
        <State label={t.rating.none} note={t.rating.noneNote} wide>
          <Rating value={0} count={0} />
          <p className="text-sm text-secondary">{t.rating.nothing}</p>
        </State>
        <PieceNote paragraphs={t.rating.explain} />
      </Piece>
    </SectionPage>
  );
}
