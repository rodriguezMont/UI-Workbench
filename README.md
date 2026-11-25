# UI Workbench

A brand-neutral library of React components, with a workbench to review them.
Components are **distributed by copy**: an app takes the files it needs into
its own source tree and owns them from then on. There is no npm package.

> **Status:** repository skeleton, design tokens and the blocklist guard.
> Components, the workbench with its approval flow, and the layout ruler
> arrive in the next steps.

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
| `npm test` | Vitest: token contrast and guard tests |
| `npm run guard` | Scan the whole working tree against the blocklist |
| `npm run check` | All of the above except the build |

## Layout

```
src/
  styles/
    tokens.css      scales and roles, light and dark
    theme.css       roles → Tailwind utilities; default palette removed
    base.css        page defaults, focus ring, pointer cursor
    utilities.css   touch-area, field-glow, field-text, scrim, floating-edge
    index.css       entry: imports the four above after Tailwind
  messages/         every interface string (en-US)
  workbench/        the review app (not part of the library)
scripts/
  guard.ts          the blocklist guard
.githooks/          pre-commit and commit-msg hooks that run the guard
```

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
2. The components you want, plus `src/messages/`.
3. Map the `@/` alias to your source folder (Vite `resolve.alias` and
   `tsconfig` `paths`).

No component imports a router: links are passed in from outside.

## The blocklist guard

Some terms must never enter this repository — not in a file, a path, a commit
message or a branch name. The list of those terms is itself never committed.

- **Where the list lives:** `.blocklist` at the repository root (ignored by
  git), one term per line; or the `BLOCKLIST` environment variable,
  separated by newlines or commas, for CI. `.blocklist.example` shows the
  format.
- **When it runs:** on every commit (`.githooks/pre-commit` checks the staged
  content, paths and branch name; `.githooks/commit-msg` checks the message),
  and on demand with `npm run guard`. `npm install` sets
  `core.hooksPath` to `.githooks`.
- **Matching:** case- and accent-insensitive, inside longer words too; a space
  in a term also matches `-`, `_`, `.` or nothing.
- **Fails closed:** with no list, or with `.blocklist` tracked or not ignored,
  the guard exits with code 2 instead of passing.
- **Never leaks the list:** findings name the file, the line and the term's
  position in the list, not the term.

## Conventions

Everything written in the repository — code, comments, documentation, commit
messages, branch names — is in English. Commits follow Conventional Commits.
