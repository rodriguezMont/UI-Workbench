# Progress

Where the library stands, how the work is done, and what comes next. Update
this file at the end of every work session.

_Last updated: 2026-11-26._

## Plan

The work runs in five blocks, one at a time, each reviewed before the next:

1. **Inventory** of the components to port — done.
2. **Repository skeleton**, neutral tokens and the blocklist guard — done.
3. **Components, group by group** — done: every registry piece is built.
4. **Workbench and approval flow** — done: live contrast (#26), the
   Playwright layout and touch rulers (#32), and approvals on the published
   workbench, kept in each visitor's browser (#40).
5. **Brand guide** — how to rebrand the tokens and the logo.

## Merged so far

| PR | What it delivered |
| --- | --- |
| #1 | Primitives: Button, TextLink, Badge, Avatar, Separator, Tabs, Tooltip, `cn` |
| #2 | CI: type-check, lint, tests and build on every PR (the guard stays local) |
| #3 | States: Skeleton, Empty, ErrorState, Toast, ProgressBar, Spinner, PageSpinner, RouteProgress |
| #4 | Overlay: Dialog, AlertDialog, Sheet, Overlay, FullScreenPanel, SideMenu, ActionMenu |
| #5 | Workbench: shell, provisional logo, map, section pages, registry, approval flow, `vercel.json` |
| #6 | Forms 1: Field, Fieldset, PasswordField, MaskedField (US), PhoneField, Select |
| #7 | This progress file and the working rules |
| #8 | Forms 2: Checkbox, CheckboxCard, CheckboxList, RadioGroup, Switch, SegmentedControl, Slider, Rating, RatingInput; `lib/format.ts`; demo placeholders and their test |
| #9 | Dependencies for the remaining groups: react-day-picker, react-easy-crop, @dnd-kit |
| #10 | Content: Carousel, MapPlaceholder, and the Content page |
| #11 | Foundation: typography, grid and rhythm, motion and icons pages, every figure measured from the screen |
| #12 | Forms 3: DatePicker, TimePicker, DateTimePicker; `lib/date-time.ts` (en-US) |
| #15 | Forms 4: FileUpload, PhotoUpload, ImageCropper, ProfileCover, PhotoGallery, CardForm; file, image and card helpers |
| #13 | Navigation: Header, Breadcrumb, Footer, Search, Filters, AccountSwitcher; approval tests no longer assume a piece is left to build |
| #14 | Data: Table, DataTable, Stat, TimeSeries, Columns, Comparison, Ranking, Meter, Period, ChartStates, RadialKpi; chart parts; `lib/chart.ts`, `lib/table.ts`, `lib/report-period.ts`; shared `lib/iso-date.ts` |
| #16 | README and this file record the finished map |
| #17 | Polish 1: broken workbench demos and three component defects |
| #18 | Polish 2: the frame — section intros, explanation boxes with bold leads, stage light and glass in dark |
| #19 | Polish 3: Primitives — every piece with its states and explanation |
| #20 | Polish 4: Forms, fields and choices — states and explanations for 13 pieces; `select` split into single, search and multiple |
| #21 | Polish 5: Forms, dates, files and images — states and explanations for 9 pieces; one cropper demo with a slot per format; numbered gallery samples |
| #22 | Polish 6: Data — states and explanations for 12 pieces; `stat-group` split from `stat`; a Dashboard sector; one demo world in `data-demo.ts`, with "today" pinned and totals that agree |
| #23 | Polish 7: States and Overlay — states and explanations for 9 pieces; live demos in `state-demos.tsx` and `overlay-demos.tsx` |
| #24 | Tests for Escape in the overlay's sheet frame; a false sheet bug from #23 withdrawn, and the rule that caught it |
| #25 | Polish 8: Navigation — states and explanations for 8 pieces; shell sketches, a sticky header, filters in context with live counts; live demos in `nav-demos.tsx` |
| #26 | Polish 9: Foundation — a State colors piece; a contrast table on Roles measured from the painted page; logo heights measured; the WCAG math moved to `lib/contrast.ts` |
| #27 | `usePendingFocus` keeps the target while a surviving menu closes; the photo gallery drops its local workaround |
| #28 | Review: the Logo piece laid out by forms, sizes in use, measured grounds, one ink, minimum, clear space and don'ts; a stacked form and a one-ink version of the logo; Button states paired |
| #29 | Review: form data validated by its kind — date, ZIP, card and expiry masks refuse impossible input; a name rule and tighter ceilings; live error demos; a wider country list |
| #30 | Review: the route bar shown between sections (section imports tracked); equal heights for paired cards (`State` `fill` and `action`); a stat with no data keeps its shape; aligned search, filters, header frames and map |
| #31 | This file records the general review and what is left |
| #32 | The Playwright rulers: `npm run measure` (every section at 375, 768, 1280 and 1920, the side panel, drawer, route bar, contrast and a 44px touch probe) and `npm run measure:touch` (simulated iPhone and Pixel taps) |
| #33 | The frame in dark: header, side panel and page share one deep blue (`--accent-950`), and the panel's edge and the header's foot are each one gradient end to end, with a glow (`--frame-rule-from/via/to`); no rule under the panel logo |
| #34 | The README becomes the project's home page — what, why, how, what's inside, screenshots — with a Portuguese twin, `README.pt-BR.md`; the reference material moves to `docs/GUIDE.md` |
| #35 | `server.js`, a dependency-free production entry for Hostinger's managed Node.js (client routes fall back to `index.html`, `noindex` header, cached assets), `npm start`, and `docs/DEPLOY.md` |
| #36 | The first approvals in the ledger: Logo, Roles and State colors |
| #37 | The live workbench linked from both READMEs; the blocklist moves from the run steps to a note on committing |
| #38 | `server.js` listens on load: Hostinger's runner never passed the "run directly" check, and the site answered 503 |
| #39 | The logo's mark as the favicon, following the browser's color scheme |
| #40 | Approving on the published workbench: each visitor's review in their browser's `localStorage`, starting from the committed ledger, with a reset on the map; the dev server still writes `approvals.json` |
| #41 | The favicon made valid XML (a `--` in a comment broke it), with a test |

#10 to #15 were built in parallel by six builder agents, one per group, each
in its own git worktree. Each group was then integrated one at a time: the
diff read for leftovers from the source, a rebase onto `main`, the workbench
checked in the browser, and a draft PR. They were merged in the order listed.

Health on `main`: 703 tests passing (one skipped: it only runs while some
piece is still to build), type-check, lint and build clean, guard clean.

## Published

The workbench is live at
**https://glad-bisque-gnu-01.hostingersite.com/** (a temporary Hostinger
domain), on Hostinger's managed Node.js: app type **Express**, entry
`server.js`, Node 24, build `npm run build`, output `dist`. Every merge to
`main` builds and publishes on its own, in about two minutes. Settings,
checks and the pitfalls already met are in [DEPLOY.md](DEPLOY.md).

## Component status

All 71 registry pieces are built, in all eight sections. The registry
(`src/workbench/registry.ts`) is the source of truth.

**3 of 71 approved** in the project's ledger (#36): Logo, Roles and State
colors. Approving is the reviewer's act: on the dev server it writes
`src/workbench/approvals.json`, which is then committed. On the published
workbench, visitors approve on their own copy in their browser, which never
changes the project's ledger.

## Next steps

1. **Polish pass** against the source library — done: bugs (#17), the frame
   (#18), and one PR per section (#19–#26), with the states the review found
   missing, a note on every state and an explanation on every piece.
2. **General review in the workbench** — the review rounds are done: Logo and
   Button (#28), form data rules (#29), Data, States, Navigation and Content
   (#30). The first approvals are in (#36); the rest of the pieces wait for
   the reviewer, on the dev server. Still open for
   a decision: the footer's thick gradient edge from the source became a plain
   top border — restore it or keep it plain. Two small component touches wait
   too: the map drawing's rounded blocks and a pin on the plaza, and the logo's
   final usage rules, which come with the brand guide.
3. **Block 5**: the brand guide — how to rebrand the tokens, the logo and the
   favicon (`public/favicon.svg` copies two pairs of scale colors, since a
   favicon cannot read CSS tokens).
4. **A real domain** for the published workbench, when there is one: attach it
   to the Hostinger app and update the link in both READMEs and here.

Optional, waiting for a decision: require the CI `Check` status in the `main`
ruleset so a red PR cannot be merged.

## How a group is done

- **One branch per group, from `main`**, named `feat/<group>`; one draft PR.
  Never stack PRs: merges are squash-only, so a stacked branch always
  conflicts after the one below it merges.
- **Port, do not paste.** Comments rewritten in English and free of anything
  from the source project; every on-screen string in `src/messages/en-US/`
  (`ui.ts` for components, `workbench.ts` for the workbench); role tokens only
  (`conventions.test.ts` fails on literal colors, scale tokens, text roles as
  backgrounds, or router imports); keyframes prefixed `ui-`.
- **US adaptation**: formats follow `locale` from `src/messages`; dates
  MM/DD/YYYY, 12-hour time on screen, dollars, ZIP codes, phone defaults to
  the US. Region-specific pieces with no US equivalent are left behind.
- **Register and show it**: a registry row per component (the file name is the
  id), the section marked `built: true` once it has a page, and each built
  piece rendered with `<Piece id>` on its section page. The registry test
  enforces all three. Tests about the "to build" state make up their own
  piece instead of relying on the registry having one left.
- **Every piece explains itself.** A note under every state label (what to
  look at), and a `PieceNote` closing every piece (`paragraphs`, each opening
  with its claim in bold — `**…**` and `` `code` `` are rendered by
  `workbench/rich.tsx`). Each section opens with its `intro`: the rule it
  protects, not a list of its pieces.
- **Every demo text input has a placeholder** — an example of what goes in
  (dots for passwords). `pages/placeholders.test.tsx` renders every section
  page and fails on a text input without one (file inputs excepted).
- **Tests**: behavior tests per component (Testing Library + jsdom; use
  `installDomStubs()` from `src/test/dom.ts` for popovers and lists).
- **Verify before the PR**: `npm run check`, `npm run build`, and the
  workbench in the browser at 375 and 1280 in both color schemes.
- **Check open and close in a foreground page.** A background tab or a hidden
  browser pane freezes CSS animations, and the sheet only unmounts when its
  closing animation ends — so there it looks stuck open. #23 recorded a sheet
  "Escape bug" that was only this; a Playwright page showed Escape closing
  every sheet and returning focus. Before reporting an open, close or focus
  defect, reproduce it where animations run.
- **The blocklist guard runs locally**: hooks check commits; run
  `node scripts/guard.ts --message <file>` on every PR title and body before
  publishing. The term list never leaves the local `.blocklist`.
- **Approvals are never made on someone's behalf.** The seal is the
  reviewer's. Testing the seal on the published build is fine — it only
  touches that browser — and ends with a reset to the project's approvals.
- **Both READMEs change together.** `README.pt-BR.md` says the same as
  `README.md`, section by section.
- **Deploys are checked live.** After a merge, wait for the Hostinger build
  and check the published site: a section opened directly, the `noindex`
  header, and whatever the change touched.

## When groups are built in parallel

- **Dependencies first**, in one PR of their own, so no group branch touches
  `package.json` or the lockfile.
- **One git worktree per group.** A worktree has no `.blocklist`, so the
  hooks there read the terms through the `BLOCKLIST` environment variable,
  filled from the main checkout's file in the local shell only.
- **Shared files are appended at the end**: `ui.ts`, `workbench.ts`, the
  section page and the registry. Each merge then leaves only an
  "appended at the same end" conflict on the next branch: keep both blocks,
  close the first one.
- **Integrate one at a time**: read the diff, rebase onto `main`, run the
  checks, look at the workbench, then open the PR; after each merge, rebase
  the next. A helper both groups need is ported by one group, and any
  duplicate is folded into one shared module when the second group lands.
