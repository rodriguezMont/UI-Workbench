# UI Workbench

A brand-neutral library of React components, with a workbench to review them.
Components are **distributed by copy**: an app takes the files it needs into
its own source tree and owns them from then on. There is no npm package.

> **Status:** every piece on the map is built — 71 of 71, across foundation,
> primitives, forms, data, states, navigation, content and overlay — polished
> against the source library and through a general review. Approvals are
> recorded on the dev server and committed with the ledger. Still to come: the
> Playwright layout ruler and the brand guide.
> Details, next steps and the working rules: [docs/PROGRESS.md](docs/PROGRESS.md).

## Stack

React 19 · TypeScript · Tailwind CSS v4 · Vite 7 · Vitest. Interface copy is
en-US only, centralized in `src/messages/`.

## Getting started

```sh
npm install                      # also points git at the versioned hooks
cp .blocklist.example .blocklist # then put the real terms in it (see below)
npm run dev
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Workbench dev server |
| `npm run build` | Type-check and production build (`dist/`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest: token contrast, component, convention and guard tests |
| `npm run guard` | Scan the whole working tree against the blocklist |
| `npm run check` | All of the above except the build |

**CI** (`.github/workflows/ci.yml`) runs type-check, lint, tests and the
build on every pull request and on every push to `main`. The blocklist guard
is not part of CI on purpose — see below.

## Layout

```
src/
  components/ui/    the components, one file each
  components/chart/ parts the charts share: legend, reading, "See the numbers"
  components/brand/ the provisional logo — the one file a rebrand replaces
  lib/              pure helpers, each with its tests: cn (class-name merging),
                    overlay breakpoints, masks and phones, number formats,
                    dates (iso-date, date-time, report-period), tables,
                    charts, files, images, cards, the slider's step
  styles/
    tokens.css      scales and roles, light and dark
    theme.css       roles → Tailwind utilities; default palette removed
    base.css        page defaults, focus ring, pointer cursor
    utilities.css   touch-area, field-glow, field-text, scrim, floating-edge
    index.css       entry: imports the four above after Tailwind
  messages/en-US/   every interface string: ui.ts (library), workbench.ts
  workbench/        the review app (not part of the library)
    registry.ts     every section and piece, built or still to build
    approvals.json  the approval ledger, versioned
    pages/          one page per built section
scripts/
  guard.ts          the blocklist guard
.githooks/          pre-commit and commit-msg hooks that run the guard
```

## The workbench

`npm run dev` opens the workbench: a header with the color-scheme switch, a
side panel with the sections (a drawer on phones), **the map** at `/` with
every section, its pieces and how many are approved, and one page per section
(`/primitives`, `/states`, …) where each piece sits in the same frame — name,
state, its real states side by side, and the approval seal.

- **The registry** (`src/workbench/registry.ts`) lists the whole map from day
  one; pieces without a shape are marked "to build" and stay out of the counts.
  Tests fail if a component file has no entry, if a built piece is missing from
  its section page, or if a page exists for a section still to build.
- **Approving** is a click on the seal, and it only works under the dev server:
  a dev-only endpoint writes one sorted line per piece to
  `src/workbench/approvals.json`, refusing cross-site requests and automated
  browsers. The file is versioned on purpose — a mass approval would show up
  in the pull request as one changed line per piece.
- **The deployed build is read-only**: the endpoint does not exist outside
  `vite dev`, so the seal shows the committed state without a button.
  `vercel.json` serves every route from `index.html` and marks the site
  `noindex`.

## Design tokens

Two layers, and components only ever touch the second:

1. **Scales** — raw values named by family and step (`--neutral-600`,
   `--accent-600`), never by hue.
2. **Roles** — what a component asks for (`--text-primary`,
   `--surface-raised`, `--border-strong`), exposed as Tailwind utilities
   (`text-primary`, `bg-surface-raised`, `border-border-strong`).

Tailwind's default palette is removed, so `bg-blue-500` or `text-white` do not
exist: a color name cannot slip into a component.

**Light and dark** sit side by side in each role through `light-dark()`. The
page follows the operating system by default; `data-theme="light"` or
`data-theme="dark"` on any element forces that scheme for its subtree — on
`<html>` for the whole page, or on one section that must always read dark.
No `dark:` variants are needed.

**Contrast** is enforced, not described: `src/styles/tokens.test.ts` resolves
every role in both schemes and checks WCAG 2.2 AA (4.5:1 text, 3:1 large text,
UI boundaries and chart marks). It also fails if a token is named after a
color or the theme maps a role that does not exist.

The default theme is deliberately plain — grays plus one accent, system font.
Rebranding means editing the scales in `tokens.css`; components do not change.

## Using the library in an app

Copy what you need and keep the paths:

1. `src/styles/` — import `index.css` once, or import `tokens.css`,
   `theme.css`, `base.css` and `utilities.css` right after
   `@import "tailwindcss"` in your own entry stylesheet. Requires
   **Tailwind CSS v4**.
2. The components you want from `src/components/ui/`, plus `src/lib/`,
   `src/components/brand/` and `src/messages/` (drop `en-US/workbench.ts` and
   its line in `en-US/index.ts` — that copy is the workbench's). The charts
   also need `src/components/chart/`. Runtime dependencies: `radix-ui`,
   `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`, and
   per component:

   | Component | Also needs |
   | --- | --- |
   | sheet, side menu | `vaul`, `@radix-ui/react-focus-scope`, `aria-hidden` |
   | phone field with a country picker | `libphonenumber-js` |
   | date picker, date-time picker | `react-day-picker` (brings `date-fns`) |
   | image cropper, profile cover | `react-easy-crop` (the cropper imports its stylesheet) |
   | photo gallery | `react-easy-crop`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` |

   The charts are hand-drawn SVG and HTML and need no chart library.
3. Map the `@/` alias to your source folder (Vite `resolve.alias` and
   `tsconfig` `paths`).
4. Mount `TooltipProvider` and `Toaster` once at the root of the app. On
   phones the toast becomes a banner under the header: set `--header-h` to
   your header's height (it defaults to `4rem`).

No component imports a router: links are passed in from outside, through
`asChild` — `<TextLink asChild><RouterLink to="/about">About</RouterLink></TextLink>`.
`RouteProgress` takes the navigation state as a prop (`active`) for the same
reason.
`src/components/ui/conventions.test.ts` fails if a component ever imports one.

## The blocklist guard

Some terms must never enter this repository — not in a file, a path, a commit
message or a branch name. The list of those terms is itself never committed.

- **Where the list lives:** `.blocklist` at the repository root (ignored by
  git), one term per line; or the `BLOCKLIST` environment variable,
  separated by newlines or commas, for a shell or git worktree without the
  file. `.blocklist.example` shows the format.
- **When it runs:** on every commit (`.githooks/pre-commit` checks the staged
  content, paths and branch name; `.githooks/commit-msg` checks the message),
  and on demand with `npm run guard`. `npm install` sets
  `core.hooksPath` to `.githooks`.
- **Local only, by design:** the list never leaves the machine where the work
  is done — not even as a CI secret. Everything is checked here, before it is
  committed or pushed, and CI does not run the guard. A commit made anywhere
  else (the GitHub web editor, another clone) is not checked, so review those
  by hand.
- **Matching:** case- and accent-insensitive, inside longer words too; a space
  in a term also matches `-`, `_`, `.` or nothing.
- **Fails closed:** with no list, or with `.blocklist` tracked or not ignored,
  the guard exits with code 2 instead of passing.
- **Never leaks the list:** findings name the file, the line and the term's
  position in the list, not the term.

## Conventions

Everything written in the repository — code, comments, documentation, commit
messages, branch names — is in English. Commits follow Conventional Commits.

## License

[MIT](LICENSE) © Silvio Monteiro
