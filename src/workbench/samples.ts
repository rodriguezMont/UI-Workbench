/**
 * Sample pictures for the demos, drawn inline as SVG so the workbench loads
 * nothing from outside: one 160×100 scene, sliced to each picture's ratio.
 * Each one declares its pixel size, because the cropper reads the image's
 * natural size for the output and the small-image warning.
 *
 * Workbench only — these are demo content, not library tokens, so they carry
 * their own colors.
 */

const svg = (width: number, height: number, body: string) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice">${body}</svg>`);

type Palette = { sky: [string, string]; far: string; near: string; sun: string };

/** A landscape: a sky, a sun and two hills. */
function landscape(width: number, height: number, { sky, far, near, sun }: Palette, sunX = 118, sunY = 30) {
  return svg(
    width,
    height,
    `<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient></defs>` +
      `<rect width="160" height="100" fill="url(#s)"/>` +
      `<circle cx="${sunX}" cy="${sunY}" r="11" fill="${sun}"/>` +
      `<path d="M0 70 Q40 42 80 64 T160 56 V100 H0Z" fill="${far}"/>` +
      `<path d="M0 84 Q50 62 100 80 T160 76 V100 H0Z" fill="${near}"/>`,
  );
}

const DAY: Palette = { sky: ["#bfdbfe", "#eff6ff"], far: "#94a3b8", near: "#64748b", sun: "#fde68a" };
const DUSK: Palette = { sky: ["#fecaca", "#fef3c7"], far: "#a8a29e", near: "#78716c", sun: "#fdba74" };
const NIGHT: Palette = { sky: ["#1e293b", "#475569"], far: "#334155", near: "#0f172a", sun: "#e2e8f0" };
const MIST: Palette = { sky: ["#e2e8f0", "#f8fafc"], far: "#cbd5e1", near: "#94a3b8", sun: "#ffffff" };
/** Mid tones: reads as a photo on a white page and does not glare on a dark one. */
const HARBOR: Palette = { sky: ["#3b5b7a", "#9fb7cc"], far: "#4b6a63", near: "#2f4a44", sun: "#f6c768" };

/** Large enough for every format. */
export const SAMPLE_LANDSCAPE = landscape(2400, 1600, DAY);

/** Too small for a cover: the cropper warns. */
export const SAMPLE_SMALL = landscape(480, 320, DUSK, 40);

/** A wide band for a profile cover. */
export const SAMPLE_COVER = landscape(1600, 400, HARBOR, 120, 46);

/** A simple geometric mark for a logo. */
export const SAMPLE_LOGO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 64 64"><rect width="64" height="64" fill="#1f2937"/><circle cx="32" cy="27" r="13" fill="#fbbf24"/><path d="M14 50 L32 34 L50 50Z" fill="#f9fafb"/></svg>`,
  );

/**
 * A head-and-shoulders picture for avatars and "on a photo" demos. Mid tones,
 * so it neither glares on a dark page nor disappears on a white one.
 */
export const SAMPLE_PORTRAIT =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 80 80"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5b7a99"/><stop offset="1" stop-color="#8c6f8f"/></linearGradient></defs><rect width="80" height="80" fill="url(#g)"/><circle cx="40" cy="31" r="13" fill="#e8c9a9"/><path d="M14 80 Q14 52 40 52 Q66 52 66 80Z" fill="#2f3b4a"/></svg>`,
  );

/** Four 4:3 photos for the gallery. */
export const SAMPLE_PHOTOS = [
  landscape(1600, 1200, DAY),
  landscape(1600, 1200, DUSK, 36),
  landscape(1600, 1200, MIST, 80),
  landscape(1600, 1200, NIGHT, 128),
] as const;
