import { Fragment } from "react";
import { Camera, Check, Clock, Info, Link2, MessageSquare, Phone, Plus, Sparkles } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TextLink } from "@/components/ui/link";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipContent, TooltipRoot, TooltipTrigger } from "@/components/ui/tooltip";
import { messages } from "@/messages";

import { Sample, Section } from "./Section";

const t = messages.workbench.foundation;

/** A sample picture drawn inline, so the workbench loads nothing from outside. */
const SAMPLE_PICTURE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#cbd5e1"/><circle cx="40" cy="32" r="14" fill="#64748b"/><rect x="16" y="52" width="48" height="28" rx="14" fill="#64748b"/></svg>`,
  );

const SCROLL_TABS = ["overview", "activity", "members", "billing", "integrations", "archive"] as const;

function Buttons() {
  return (
    <Sample title={t.buttons.title}>
      <p className="text-xs text-subtle">{t.buttons.variants}</p>
      <div className="flex flex-wrap items-center gap-3">
        <Button>{t.buttons.primary}</Button>
        <Button variant="alternate">{t.buttons.alternate}</Button>
        <Button variant="secondary">{t.buttons.secondary}</Button>
        <Button variant="ghost">{t.buttons.ghost}</Button>
        <Button variant="link">{t.buttons.link}</Button>
        <Button variant="destructive">{t.buttons.destructive}</Button>
        <Button disabled>{t.buttons.disabled}</Button>
        <div className="flex h-16 w-40 items-center justify-center rounded-md" style={{ background: "var(--ornament-gradient)" }}>
          <Button variant="overlay" size="sm">
            <Camera size={16} aria-hidden />
            {t.buttons.overlay}
          </Button>
        </div>
      </div>
      <p className="text-xs text-subtle">{t.buttons.sizes}</p>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" variant="secondary">
          {t.buttons.small}
        </Button>
        <Button size="md" variant="secondary">
          {t.buttons.medium}
        </Button>
        <Button size="lg" variant="secondary">
          {t.buttons.large}
        </Button>
        <Button size="icon" variant="secondary" aria-label={t.buttons.add}>
          <Plus size={18} aria-hidden />
        </Button>
        <Button size="icon-sm" variant="ghost" aria-label={t.buttons.add}>
          <Plus size={16} aria-hidden />
        </Button>
      </div>
    </Sample>
  );
}

function Links() {
  return (
    <Sample title={t.links.title}>
      <p className="text-sm text-primary">
        {t.links.before}
        <TextLink href="#foundation">{t.links.internal}</TextLink>
        {t.links.middle}
        <TextLink href="https://tailwindcss.com/docs" external>
          {t.links.external}
        </TextLink>
        {t.links.after}
      </p>
      <p className="text-xs">
        <TextLink href="#foundation" tone="subtle">
          {t.links.subtle}
        </TextLink>
      </p>
    </Sample>
  );
}

function Badges() {
  return (
    <Sample title={t.badges.title}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{t.badges.neutral}</Badge>
        <Badge variant="accent">
          <Clock size={12} aria-hidden />
          {t.badges.accent}
        </Badge>
        <Badge variant="action">
          <Sparkles size={12} aria-hidden />
          {t.badges.action}
        </Badge>
        <Badge variant="solid">
          <Check size={12} aria-hidden />
          {t.badges.solid}
        </Badge>
      </div>
    </Sample>
  );
}

function Avatars() {
  return (
    <Sample title={t.avatars.title} note={t.avatars.fallbackNote}>
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={SAMPLE_PICTURE} alt={t.avatars.image} />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarImage src="/missing-picture.png" alt={t.avatars.image} />
          <AvatarFallback>AK</AvatarFallback>
        </Avatar>
        <Avatar className="size-12">
          <AvatarFallback>MR</AvatarFallback>
        </Avatar>
      </div>
    </Sample>
  );
}

function Separators() {
  return (
    <Sample title={t.separator.title}>
      <div className="flex max-w-sm flex-col gap-3 text-sm text-primary">
        <span>{t.separator.above}</span>
        <Separator />
        <span>{t.separator.below}</span>
      </div>
      {/* A vertical separator takes the container's height, so it sits
          directly in the row that has one. */}
      <div className="flex h-5 items-center gap-3 text-sm text-secondary">
        {t.separator.inline.map((label, i) => (
          <Fragment key={label}>
            {i > 0 ? <Separator orientation="vertical" /> : null}
            <span>{label}</span>
          </Fragment>
        ))}
      </div>
    </Sample>
  );
}

function TabsSample() {
  return (
    <Sample title={t.tabs.title} note={t.tabs.disabledNote}>
      <p className="text-xs text-subtle">{t.tabs.scroll}</p>
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

      <p className="text-xs text-subtle">{t.tabs.equal}</p>
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
    </Sample>
  );
}

function TooltipSample() {
  return (
    <Sample title={t.tooltip.title} note={t.tooltip.note}>
      <div>
        <TooltipRoot>
          <TooltipTrigger asChild>
            <Button size="icon" variant="secondary" aria-label={t.tooltip.trigger}>
              <Link2 size={18} aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t.tooltip.content}</TooltipContent>
        </TooltipRoot>
      </div>
    </Sample>
  );
}

export function FoundationSection() {
  return (
    <Section id="foundation" heading={t.heading} intro={t.intro}>
      <div className="flex flex-col gap-8">
        <Buttons />
        <Separator />
        <Links />
        <Separator />
        <div className="grid gap-8 md:grid-cols-2">
          <Badges />
          <Avatars />
        </div>
        <Separator />
        <div className="grid gap-8 md:grid-cols-2">
          <Separators />
          <TooltipSample />
        </div>
        <Separator />
        <TabsSample />
      </div>
    </Section>
  );
}
