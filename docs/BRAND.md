# Rebranding

How to put a brand on UI Workbench. It is written for people and for AI
coding agents alike: each section names the file, what to change, and how to
check it. Start from [AGENTS.md](../AGENTS.md) for which inputs to ask the
brand owner for.

The template is neutral on purpose — grays, one blue accent, the system font,
a placeholder logo, en-US formats — so **rebrand in your own copy, never in
the template**. Give the copy its own repository first, and stop it pushing
back to the template: [AGENTS.md › Point the copy at its own repository](../AGENTS.md#1-point-the-copy-at-its-own-repository).

## Every place a brand lives

| Decision | File | What to change |
| --- | --- | --- |
| Colors | `src/styles/tokens.css`, section 1 (Scales) | `--neutral-*` and `--accent-*` values |
| Which shade does what | `src/styles/tokens.css`, section 2 (Roles) | Rarely: the step a role points at |
| Status colors | `src/styles/tokens.css`, `--state-*` | Only if the brand defines its own error, success and warning |
| Logo | `src/components/brand/logo.tsx` | The drawing; keep the props |
| Tab icon | `public/favicon.svg` | The mark and its two color pairs |
| Name | `src/messages/en-US/ui.ts` (`brand.name`), `index.html` (`<title>`) | The product name |
| Typeface | `src/styles/tokens.css` (`--font-sans`, `--font-mono`, `--weight-*`) and the app that loads the font | The font stack |
| Shape | `src/styles/tokens.css` (`--radius-*`) | Corner radii |
| Motion | `src/styles/tokens.css` (`--motion-*`) | Durations and easing, if the brand has a motion style |
| Locale | `src/messages/`, `src/lib/` (see [Locale](#locale)) | Language, currency, dates, phones, addresses |
| Workbench copy | `src/messages/en-US/workbench.ts` | Only if the workbench itself is kept and renamed |

Components never change in a rebrand. If you find yourself editing one to
change a color, a size or a font, the change belongs in the tokens.

## Colors

### How the two layers work

1. **Scales** are raw values: `--neutral-0` … `--neutral-950` and
   `--accent-300` … `--accent-950`. They are the brand. Nothing outside
   `tokens.css` reads them.
2. **Roles** say what a color is for — `--text-primary`, `--surface-raised`,
   `--accent`, `--link`, `--focus-ring` — and hold a light and a dark value
   with `light-dark()`. Components read only roles, through Tailwind
   utilities (`bg-surface-raised`, `text-accent`).

So a rebrand is mostly **new values in the scales**. Every role, and every
component, follows.

### What each accent step does

| Step | Light theme | Dark theme |
| --- | --- | --- |
| `--accent-300` | — | links, focus ring, start of the frame rules |
| `--accent-400` | big figures, start of the frame rules | **the accent**: primary buttons, selection, chart line; big figures, middle of the frame rules |
| `--accent-600` | **the accent**: primary buttons, selection, focus ring, accent labels; middle of the frame rules | end of the frame rules |
| `--accent-700` | links, end of the frame rules | — |
| `--accent-950` | — | page background, header and side panel |

The stage light behind the workbench and the selected-option tint mix
`--accent-400`, `--accent-600` and `--accent-700` with transparency.

### Turning one brand color into the accent scale

1. Put the brand color at **`--accent-600`** if white text on it reaches
   4.5:1 and it reaches 4.5:1 as text on white. Most saturated brand blues,
   greens, purples and reds do; yellows, oranges and light colors do not —
   then use a darker shade of the brand color at 600 and keep the brand
   color itself for large surfaces or illustrations.
2. Derive the other steps from the same hue, changing lightness (OKLCH is the
   easiest space for this):
   - `--accent-700`: darker than 600 — links must reach 4.5:1 on white.
   - `--accent-400`: lighter — the accent in dark; it must reach 4.5:1 on the
     dark surfaces, with near-black text on it.
   - `--accent-300`: lighter still — links and focus in dark.
   - `--accent-950`: almost black with a trace of the hue — the dark page.
3. Run the contrast tests (below). A failing pair names the role and the
   theme: move that step lighter or darker and run them again.

### Neutrals

`--neutral-0` is the light surface, `--neutral-950` the darkest ink; the steps
between are text, borders, hovers and dark surfaces. A **warm or cool tint**
(a few percent of the brand hue mixed into each gray) usually fits a brand
better than pure gray. Keep the lightness of each step close to the current
one: the steps are uneven on purpose, each placed to clear a contrast target
on a specific surface.

### Status and chart colors

`--state-error`, `--state-success` and `--state-warning` (and their `-fill`
and `text-on-*` partners) are literal values in the roles section. Change
them only if the brand defines its own; they must stay distinguishable from
the accent. Charts use `--chart-1` (the accent) and `--chart-2` (a gray).

### Check the colors

```sh
npx vitest run src/styles/tokens.test.ts
```

It resolves every role in light and dark and checks WCAG 2.2 AA: 4.5:1 for
text, 3:1 for large text, UI boundaries and chart marks. **Fix a failure by
moving a scale step — never by lowering a target or removing the pair.**
Then look at the **Foundation › Roles** page in the workbench: its contrast
table is measured from the painted page.

## Logo

`src/components/brand/logo.tsx` is the only logo in the library. Header,
footer, profile cover and the workbench all render `<Logo>`. Replace the
drawing, **keep the props** so no caller changes:

| Prop | Meaning |
| --- | --- |
| `variant` | `full` (mark and name side by side), `stacked` (name under the mark), `mark` (the icon alone) |
| `ink` | `color` (brand colors) or `mono` (one ink, the surrounding text color — for photos, accent fills, print) |
| `height` | the mark's height in pixels; the name scales with it |
| `label` | the accessible name, or `null` when visible text next to it already says it |

How to draw it:

- **One- or two-color logo**: inline the SVG paths and paint them with role
  classes — `fill-accent`, `fill-on-accent`, `fill-current` — so the logo
  follows light and dark.
- **Multi-color logo**: add its colors to the scales and give each a role
  (for example `--logo-primary`, `--logo-secondary`) in `tokens.css`, map
  them in `theme.css`, and use `fill-logo-primary`. Or render the brand's SVG
  file with `<img>`, with a second file for `mono`.
- **No hex values in `logo.tsx`**: the conventions test scans
  `src/components/` and fails on literal colors.
- Keep the name text as `messages.ui.brand.name`, or draw a wordmark and keep
  `label` for the accessible name.

Then open **Foundation › Logo** in the workbench: forms, sizes in use, the
measured grounds, clear space and minimum size.

## Favicon

`public/favicon.svg` is a static copy of the mark: a favicon cannot read CSS
tokens, so its colors are written in it — one pair for light, one inside
`@media (prefers-color-scheme: dark)`. Replace the paths with the new mark
and the two pairs with the new `--accent` / `--text-on-accent` values.

It is XML: **no double hyphen inside a comment**, or the file fails to parse
and the tab shows no icon. `scripts/favicon.test.ts` checks it.

## Name

- `brand.name` in `src/messages/en-US/ui.ts` — the logo text and accessible
  labels such as "{name}, home".
- `<title>` in `index.html` — the browser tab (the workbench's own page).

## Typeface

1. Load the font in the app: a `<link>` to the font service in `index.html`,
   or `@font-face` rules pointing at files in the app.
2. Put it first in `--font-sans` in `tokens.css`, keeping the system fonts
   after it as fallbacks:
   `--font-sans: "Brand Sans", ui-sans-serif, system-ui, sans-serif;`
3. Map `--weight-regular`, `--weight-medium` and `--weight-bold` to weights
   the font actually ships.
4. Check **Foundation › Typography** in the workbench: the sizes there are
   measured from the screen, so a font with a different x-height shows up.

## Shape and motion

`--radius-sm`, `--radius-md`, `--radius-lg` (4 / 8 / 12px) set every corner.
`--motion-*` holds durations and easing; reduced-motion users already get
near-instant transitions. `--tap-target` (44px) is accessibility, not brand —
leave it.

## Locale

The shipped copy is en-US: English text, dollars, MM/DD/YYYY, 12-hour time,
US ZIP codes and US phone defaults. For another locale:

| What | Where |
| --- | --- |
| Interface text | add `src/messages/<locale>/` with the same shape as `en-US` (the `Messages` type enforces it) and point `messages` and `locale` at it in `src/messages/index.ts` |
| Numbers and currency | `src/lib/format.ts` (`currency: "USD"`) |
| Dates and times | `src/lib/date-time.ts`, `src/components/ui/date-picker.tsx` |
| Masks (date, ZIP, card expiry) | `src/lib/mask.ts`, `src/components/ui/masked-field.tsx` |
| Phones | `src/lib/phone.ts`, `src/components/ui/masked-field/phone-field.tsx` |
| Field hints and icons | `src/components/ui/field.tsx`, `src/components/ui/field-icons.ts` |

Each of these has tests; update them with the new formats.

## Verify

1. `npm run check` — type-check, lint, all tests (contrast and conventions
   included).
2. `npm run build`.
3. `npm run dev` and look at every section, in light and in dark, at phone and
   desktop width. `npm run measure` runs the layout ruler against it.
4. **Reset the approvals**: write `{}` to `src/workbench/approvals.json`. The
   pieces were approved in the neutral theme; the brand owner approves them
   again in theirs, one by one, on the dev server.
