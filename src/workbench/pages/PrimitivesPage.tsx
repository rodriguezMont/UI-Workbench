import { Fragment } from "react";
import { Camera, Check, Clock, FolderInput, Info, Link2, MessageSquare, MoreHorizontal, Pencil, Phone, Plus, Share2, Sparkles, Trash2 } from "lucide-react";

import {
  ActionMenu,
  ActionMenuContent,
  ActionMenuItem,
  ActionMenuLabel,
  ActionMenuSeparator,
  ActionMenuTrigger,
} from "@/components/ui/action-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TextLink } from "@/components/ui/link";
import { Rating } from "@/components/ui/rating";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";
import { TooltipContent, TooltipRoot, TooltipTrigger } from "@/components/ui/tooltip";
import { messages } from "@/messages";

import { Piece, State } from "../Piece";
import { SectionPage } from "./SectionPage";

const t = messages.workbench.demos;

/** A sample picture drawn inline, so the workbench loads nothing from outside. */
const SAMPLE_PICTURE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#cbd5e1"/><circle cx="40" cy="32" r="14" fill="#64748b"/><rect x="16" y="52" width="48" height="28" rx="14" fill="#64748b"/></svg>`,
  );

const SCROLL_TABS = ["overview", "activity", "members", "billing", "integrations", "archive"] as const;

export function PrimitivesPage() {
  return (
    <SectionPage id="primitives">
      <Piece id="button">
        <State label={t.button.variants} note={t.button.variantsNote} wide>
          <Button>{t.button.primary}</Button>
          <Button variant="alternate">{t.button.alternate}</Button>
          <Button variant="secondary">{t.button.secondary}</Button>
          <Button variant="ghost">{t.button.ghost}</Button>
          <Button variant="link">{t.button.link}</Button>
        </State>
        <State label={t.button.sizes} note={t.button.sizesNote}>
          <Button size="sm" variant="secondary">
            {t.button.small}
          </Button>
          <Button size="md" variant="secondary">
            {t.button.medium}
          </Button>
          <Button size="lg" variant="secondary">
            {t.button.large}
          </Button>
          <Button size="icon" variant="secondary" aria-label={t.button.add}>
            <Plus size={18} aria-hidden />
          </Button>
          <Button size="icon-sm" variant="ghost" aria-label={t.button.add}>
            <Plus size={16} aria-hidden />
          </Button>
        </State>
        <State label={t.button.onPhoto} note={t.button.onPhotoNote}>
          <div className="flex h-16 w-44 items-center justify-center rounded-md" style={{ background: "var(--ornament-gradient)" }}>
            <Button variant="overlay" size="sm">
              <Camera size={16} aria-hidden />
              {t.button.overlay}
            </Button>
          </div>
        </State>
        <State label={t.button.disabledLabel} note={t.button.disabledNote}>
          <Button disabled>{t.button.disabled}</Button>
          <Button variant="secondary" disabled>
            {t.button.disabled}
          </Button>
        </State>
        <State label={t.button.destructiveLabel} note={t.button.destructiveNote}>
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
      </Piece>

      <Piece id="link">
        <State label={t.link.inline}>
          <p className="text-sm text-primary">
            {t.link.before}
            <TextLink href="#link">{t.link.internal}</TextLink>
            {t.link.middle}
            <TextLink href="https://tailwindcss.com/docs" external>
              {t.link.external}
            </TextLink>
            {t.link.after}
          </p>
        </State>
        <State label={t.link.subtle}>
          <p className="text-xs">
            <TextLink href="#link" tone="subtle">
              {t.link.subtleLink}
            </TextLink>
          </p>
        </State>
      </Piece>

      <Piece id="badge">
        <State label={t.badge.variants}>
          <Badge>{t.badge.neutral}</Badge>
          <Badge variant="accent">
            <Clock size={12} aria-hidden />
            {t.badge.accent}
          </Badge>
          <Badge variant="action">
            <Sparkles size={12} aria-hidden />
            {t.badge.action}
          </Badge>
          <Badge variant="solid">
            <Check size={12} aria-hidden />
            {t.badge.solid}
          </Badge>
        </State>
      </Piece>

      <Piece id="avatar">
        <State label={t.avatar.states} note={t.avatar.note}>
          <Avatar>
            <AvatarImage src={SAMPLE_PICTURE} alt={t.avatar.image} />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarImage src="/missing-picture.png" alt={t.avatar.image} />
            <AvatarFallback>AK</AvatarFallback>
          </Avatar>
          <Avatar className="size-12">
            <AvatarFallback>MR</AvatarFallback>
          </Avatar>
        </State>
      </Piece>

      <Piece id="tabs">
        <State label={t.tabs.scroll} note={t.tabs.scrollNote} wide>
          <Tabs defaultValue="overview">
            <TabsList>
              {SCROLL_TABS.map((key) => (
                <TabsTrigger key={key} value={key} disabled={key === "archive"}>
                  {t.tabs.items[key]}
                </TabsTrigger>
              ))}
            </TabsList>
            {SCROLL_TABS.map((key) => (
              <TabsContent key={key} value={key} className="text-sm text-secondary">
                {t.tabs.items[key]} — {t.tabs.panel}
              </TabsContent>
            ))}
          </Tabs>
        </State>
        <State label={t.tabs.equal} note={t.tabs.equalNote} wide>
          <Tabs defaultValue="details" className="max-w-md">
            <TabsList variant="equal">
              <TabsTrigger value="details">
                <Info size={18} aria-hidden />
                {t.tabs.equalItems.details}
              </TabsTrigger>
              <TabsTrigger value="contact">
                <Phone size={18} aria-hidden />
                {t.tabs.equalItems.contact}
              </TabsTrigger>
              <TabsTrigger value="hours">
                <MessageSquare size={18} aria-hidden />
                {t.tabs.equalItems.hours}
              </TabsTrigger>
            </TabsList>
            {(["details", "contact", "hours"] as const).map((key) => (
              <TabsContent key={key} value={key} className="text-sm text-secondary">
                {t.tabs.equalItems[key]} — {t.tabs.panel}
              </TabsContent>
            ))}
          </Tabs>
        </State>
      </Piece>

      <Piece id="tooltip">
        <State label={t.tooltip.label} note={t.tooltip.note}>
          <TooltipRoot>
            <TooltipTrigger asChild>
              <Button size="icon" variant="secondary" aria-label={t.tooltip.trigger}>
                <Link2 size={18} aria-hidden />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t.tooltip.content}</TooltipContent>
          </TooltipRoot>
        </State>
      </Piece>

      <Piece id="separator">
        <State label={t.separator.horizontal}>
          <div className="flex w-full max-w-sm flex-col gap-3 text-sm text-primary">
            <span>{t.separator.above}</span>
            <Separator />
            <span>{t.separator.below}</span>
          </div>
        </State>
        <State label={t.separator.vertical}>
          {/* A vertical separator takes the row's height, so it sits directly
              in a row that has one. */}
          <div className="flex h-5 items-center gap-3 text-sm text-secondary">
            {t.separator.inline.map((label, i) => (
              <Fragment key={label}>
                {i > 0 ? <Separator orientation="vertical" /> : null}
                <span>{label}</span>
              </Fragment>
            ))}
          </div>
        </State>
      </Piece>

      <Piece id="action-menu">
        <State label={t.actionMenu.label} note={t.actionMenu.note}>
          <ActionMenu>
            <ActionMenuTrigger asChild>
              <Button variant="secondary" size="icon" aria-label={t.actionMenu.trigger}>
                <MoreHorizontal size={18} aria-hidden />
              </Button>
            </ActionMenuTrigger>
            <ActionMenuContent align="start">
              <ActionMenuLabel>{t.actionMenu.group}</ActionMenuLabel>
              <ActionMenuItem icon={Pencil} onSelect={() => toast(`${t.actionMenu.ran}: ${t.actionMenu.rename}`)}>
                {t.actionMenu.rename}
              </ActionMenuItem>
              <ActionMenuItem icon={Share2} onSelect={() => toast(`${t.actionMenu.ran}: ${t.actionMenu.share}`)}>
                {t.actionMenu.share}
              </ActionMenuItem>
              <ActionMenuItem icon={FolderInput} disabled description={t.actionMenu.moveDisabled}>
                {t.actionMenu.move}
              </ActionMenuItem>
              <ActionMenuSeparator />
              <ActionMenuItem icon={Trash2} destructive onSelect={() => toast(`${t.actionMenu.ran}: ${t.actionMenu.delete}`)}>
                {t.actionMenu.delete}
              </ActionMenuItem>
            </ActionMenuContent>
          </ActionMenu>
        </State>
      </Piece>

      <Piece id="rating">
        <State label={t.rating.full} note={t.rating.fullNote}>
          <div className="flex flex-col gap-2">
            <Rating value={4.3} count={1280} />
            <Rating value={3.5} count={12} size="sm" />
          </div>
        </State>
        <State label={t.rating.compact} note={t.rating.compactNote}>
          <Rating value={4.3} count={128} variant="compact" />
        </State>
        <State label={t.rating.none} note={t.rating.noneNote}>
          <Rating value={0} count={0} />
          <span className="text-sm text-subtle">{t.rating.nothing}</span>
        </State>
      </Piece>
    </SectionPage>
  );
}
