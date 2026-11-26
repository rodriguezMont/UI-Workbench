# AGENTS.md

Instructions for AI coding agents — Claude Code, Codex, Cursor, Copilot and
the like. Read this file first: it says what this project is, which of two
jobs you are doing, and what you must ask the person before you change
anything visual.

## What this project is

**UI Workbench** is a **generic, brand-neutral starter design system** for
React apps:

- **A component library** — 71 pieces in 8 sections (foundation, primitives,
  forms, data, states, navigation, content, overlay), in React 19 +
  TypeScript, styled only through design tokens, Tailwind CSS v4.
- **A workbench** — a small app that shows every piece with its real states
  and an approval seal, so a person reviews each piece before it is used.
- **Distributed by copy** (like shadcn/ui): an app copies the files it needs
  and owns them. There is no npm package.

It is **neutral on purpose**: gray scale, one blue accent, the system font, a
placeholder logo and en-US formats. Nothing in it belongs to a real brand.
The point is that anyone can fork or copy it and put a brand on top.

## First, know which job you are doing

**A. Maintaining the template itself** — the repository
`rodriguezMont/UI-Workbench`, or a clone that will send changes back to it.
Keep it generic: **never apply a real brand here** (no company name, logo,
colors or fonts). Fix bugs, add pieces, improve docs. See
[Working on the template](#working-on-the-template).

**B. Adopting it for a product** — a fork, a copy in another repository, or
files copied into an existing app, where someone wants it to look like *their*
brand. Follow [Adopting and rebranding](#adopting-and-rebranding).

If you cannot tell, ask: *"Is this the generic template, or a copy for a
specific product?"* A request to "customize", "apply our brand" or "use our
colors" means job B — and before any brand work, the copy gets its own
repository (step 1 below).

## Adopting and rebranding

### 1. Point the copy at its own repository

A clone remembers where it came from: its `origin` remote is the template,
`https://github.com/rodriguezMont/UI-Workbench.git`. Branded work must never
be pushed there — the template is public, and a client's brand, name or
assets would be visible to anyone. Check it first:

```sh
git remote -v
```

If `origin` points at `rodriguezMont/UI-Workbench`:

1. **Ask the person for the URL of the repository this version will live in.**
   Recommend a **new repository** — **private** if it carries a client's or
   employer's brand — or the existing app the pieces are going into. Not a
   GitHub fork of the template: a fork of a public repository is public and
   stays linked to it.
2. **Keep the template as `upstream`**, so its future fixes can still be
   pulled, and **point `origin` at the new repository**:

   ```sh
   git remote rename origin upstream
   git remote add origin <url-of-the-new-repository>
   ```

3. **Block pushes to the template from this copy.** It is a local git
   setting, only for this folder; it changes nothing on GitHub. For most
   people it changes nothing at all — they cannot push to the template anyway.
   It protects whoever is signed in to GitHub as the template's owner, for
   whom a push to `upstream` would succeed:

   ```sh
   git remote set-url --push upstream NO_PUSH
   ```

   Pulling still works: `git pull upstream main` brings template updates in.
   A push to `upstream` now fails on purpose.
4. **Push to the new `origin`** only after the person confirms the URL:
   `git push -u origin main`.

If the person has no repository yet, do the brand work locally and push
nothing until they create one.

### 2. Ask for the brand before touching anything visual

Do not invent a brand. Ask the person for what is missing, all at once, and
offer the default when they have no answer:

| Ask for | Why it is needed | If they have none |
| --- | --- | --- |
| **Product or company name** | The logo text, the page title, accessible labels | Keep "UI Workbench" for now |
| **Logo files** — full logo and the icon/mark alone, SVG preferred | `src/components/brand/logo.tsx` and the favicon | Keep the placeholder mark |
| **Main brand color** (hex), and a second one if the brand has it | The accent scale: buttons, links, focus, selection, charts | Keep the blue |
| **Neutral tone** — cool, warm or pure gray, or their own gray palette | The neutral scale: text, surfaces, borders | Keep the current cool gray |
| **Dark mode** — wanted? any brand rule for it? | Every role has a light and a dark value | Keep both, derived from the same scales |
| **Typeface** — name, where it is loaded from (Google Fonts, files), weights | `--font-sans` and how the host app loads it | Keep the system font |
| **Corner style** — sharp, soft or round | `--radius-*` | Keep 4 / 8 / 12px |
| **Locale** — language, currency, date, time, phone and address formats | en-US is built in: dollars, MM/DD/YYYY, 12-hour, US ZIP and phone | Keep en-US |
| **Target app** — React version, Tailwind version, router, `@/` alias | How the files are copied in | Ask; Tailwind v4 is required |

Show the person a short summary of what you will change and wait for an OK
before editing.

### 3. Apply it

The step-by-step is in **[docs/BRAND.md](docs/BRAND.md)**: which file holds
each brand decision, how to turn one brand color into the accent scale, what
the contrast tests check, how to replace the logo and the favicon, how to
change the font and the locale, and how to verify. In short:

1. **Colors**: edit the **scales** at the top of `src/styles/tokens.css`
   (`--neutral-*`, `--accent-*`). Components never change.
2. **Logo**: replace the drawing inside `src/components/brand/logo.tsx`,
   keeping its props. Update `public/favicon.svg` to match.
3. **Name**: `messages.ui.brand.name` in `src/messages/en-US/ui.ts`, and
   `<title>` in `index.html`.
4. **Font**: `--font-sans` in `tokens.css`, plus loading the font in the app.
5. **Locale**, if not en-US: the files listed in BRAND.md.
6. **Verify**: `npm run check`, `npm run build`, then look at every section
   in the workbench, light and dark.
7. **Reset the approvals**: set `src/workbench/approvals.json` to `{}` — the
   new brand has not been reviewed yet. The person approves again.

### 4. Copy into the app

When the pieces go into another codebase, follow
[docs/GUIDE.md › Using the library in an app](docs/GUIDE.md#using-the-library-in-an-app):
which folders to copy, the dependencies each component needs, the `@/` alias,
and the providers to mount.

## Rules that must hold, in any copy

These are enforced by tests; breaking one makes `npm test` fail.

- **Components read roles, never scales or literal colors.** A role says what
  something is for (`--text-primary`, `--surface-raised`, `--accent`); a
  scale is a raw value (`--accent-600`). Rebranding edits scales, and only
  occasionally which step a role points at.
- **No color names in tokens.** `--blue-500` does not exist on purpose; the
  scales are `--neutral-*` and `--accent-*`, so a rebrand never leaves a
  misleading name behind.
- **Contrast is measured.** `src/styles/tokens.test.ts` resolves every role
  in light and dark and checks WCAG 2.2 AA (4.5:1 text, 3:1 large text, UI
  boundaries, chart marks). When a new color fails, change the scale step —
  do not lower the target or delete the pair.
- **All interface text lives in `src/messages/`**, never inline in a
  component.
- **No component imports a router.** Links come in through `asChild`.
- **Touch targets stay 44px** (`--tap-target`), even when a control looks
  smaller.

## Where things are

```
src/styles/tokens.css        scales (brand values) and roles (what they are for)
src/styles/theme.css         roles → Tailwind utilities; default palette removed
src/components/ui/           the components, one file each, with tests
src/components/brand/logo.tsx the placeholder logo — the one file a rebrand replaces
public/favicon.svg           the tab icon, a copy of the logo's mark
src/messages/en-US/          every interface string (ui.ts: library, workbench.ts: workbench)
src/lib/                     pure helpers: formats, masks, dates, phones, tables, charts
src/workbench/               the review app (registry, pages, approvals) — not part of the library
docs/GUIDE.md                the full reference
docs/BRAND.md                the rebrand guide
docs/DEPLOY.md               how the workbench is published (Hostinger, Node.js)
```

## Commands

```sh
npm install          # also turns on the git hooks
npm run dev          # the workbench; approving here writes approvals.json
npm run check        # type-check, lint, tests and the blocklist guard
npm run build        # type-check and production build into dist/
npm start            # serve dist/ like production (server.js)
npm run measure      # layout ruler against a running dev server (TARGET=… for another port)
```

`npm run check` and every commit run a **blocklist guard** that refuses to
pass without a list of forbidden terms. In a copy, put your own terms in
`.blocklist` (copy `.blocklist.example`; keeping the examples is fine), or
remove the guard: the `prepare` script, `.githooks/` and `scripts/guard.ts`.

## Working on the template

For job A only:

- **Stay generic.** No real brand, no real customer data, no locale other
  than en-US in the shipped copy.
- **Git**: one branch per task from `main`, named `<type>/<kebab-description>`;
  Conventional Commits in English; a small draft pull request per task;
  `main` is protected and merges are squash-only.
- **Docs move with the code.** `README.md` and `README.pt-BR.md` say the same
  thing and change together; `docs/PROGRESS.md` records each merged pull
  request and what comes next.
- **Approvals are a person's act.** Never approve a piece on someone's behalf
  on the dev server.
- **Verify before calling it done**: `npm run check`, `npm run build`, and the
  change seen in the workbench at 375 and 1280px, light and dark.
- Merges to `main` publish the workbench automatically
  ([docs/DEPLOY.md](docs/DEPLOY.md)); check the live site after a merge.
