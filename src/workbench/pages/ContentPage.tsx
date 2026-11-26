import { Carousel, type CarouselImage } from "@/components/ui/carousel";
import { MapPlaceholder } from "@/components/ui/map-placeholder";
import { messages } from "@/messages";

import { Piece, PieceNote, State } from "../Piece";
import { SectionPage } from "./SectionPage";

const t = messages.workbench.demos;

/**
 * A sample landscape drawn inline — hills under a sky whose hue shifts with
 * the number, and the number itself — so the workbench loads nothing from
 * outside and every change of image is visible.
 */
function sampleLandscape(n: number): string {
  const hue = (n * 47) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
<rect width="400" height="300" fill="hsl(${hue} 55% 78%)"/>
<circle cx="310" cy="80" r="34" fill="hsl(${(hue + 40) % 360} 80% 88%)"/>
<path d="M0 210 Q100 140 200 200 T400 180 V300 H0Z" fill="hsl(${hue} 30% 52%)"/>
<path d="M0 250 Q120 200 240 245 T400 235 V300 H0Z" fill="hsl(${hue} 32% 38%)"/>
<text x="32" y="92" font-family="system-ui, sans-serif" font-size="64" font-weight="700" fill="hsl(${hue} 40% 26%)">${n}</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const samples = (count: number): CarouselImage[] =>
  Array.from({ length: count }, (_, i) => ({ id: `sample-${i + 1}`, src: sampleLandscape(i + 1), alt: t.carousel.imageAlt(i + 1) }));

const FIVE = samples(5);
const TWELVE = samples(12);
const ONE = samples(1);

export function ContentPage() {
  return (
    <SectionPage id="content">
      <Piece id="carousel">
        <State label={t.carousel.five} note={t.carousel.fiveNote}>
          <Carousel images={FIVE} label={t.carousel.label} className="max-w-md" />
        </State>
        <State label={t.carousel.many} note={t.carousel.manyNote}>
          <Carousel images={TWELVE} label={t.carousel.label} className="max-w-md" />
        </State>
        <State label={t.carousel.one} note={t.carousel.oneNote}>
          <Carousel images={ONE} label={t.carousel.label} className="max-w-md" />
        </State>
        <State label={t.carousel.none} note={t.carousel.noneNote}>
          <Carousel images={[]} label={t.carousel.label} />
          <span data-note className="text-sm text-subtle">
            {t.carousel.nothingDrawn}
          </span>
        </State>
        <PieceNote paragraphs={t.carousel.explain} />
      </Piece>

      <Piece id="map-placeholder">
        <State label={t.mapPlaceholder.default} note={t.mapPlaceholder.defaultNote}>
          <MapPlaceholder className="max-w-sm" />
        </State>
        <State label={t.mapPlaceholder.custom} note={t.mapPlaceholder.customNote}>
          {/* The address as text is what informs; the drawing only sits beside
              it. Under the drawing here, so both maps start on the same line. */}
          <address className="flex w-full max-w-sm flex-col gap-3 not-italic">
            <MapPlaceholder label={t.mapPlaceholder.customLabel} caption={t.mapPlaceholder.customCaption} />
            <span className="text-sm text-primary">
              <span className="block font-medium">{t.mapPlaceholder.addressName}</span>
              <span className="block text-secondary">{t.mapPlaceholder.addressLine}</span>
            </span>
          </address>
        </State>
        <PieceNote paragraphs={t.mapPlaceholder.explain} />
      </Piece>
    </SectionPage>
  );
}
