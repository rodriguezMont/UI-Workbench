# Progress

Where the library stands, how the work is done, and what comes next. Update
this file at the end of every work session.

_Last updated: 2026-11-25._

## Plan

The work runs in five blocks, one at a time, each reviewed before the next:

1. **Inventory** of the components to port — done.
2. **Repository skeleton**, neutral tokens and the blocklist guard — done.
3. **Components, group by group** — in progress (see below).
4. **Workbench and approval flow** — done (moved ahead of the remaining
   groups, so new groups land directly in their section pages). Still to do
   here: the Playwright layout ruler and live contrast measurement.
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

Health on `main`: 263 tests passing, type-check and lint clean, guard clean.

## Component status

26 of 67 registry pieces are built. The registry
(`src/workbench/registry.ts`) is the source of truth; this table is a snapshot.

| Section | Built | To build |
| --- | --- | --- |
| Foundation | logo, roles | typography, grid, motion, icons |
| Primitives | button, link, badge, avatar, tabs, tooltip, separator, action-menu | rating |
| Forms | field, fieldset, password-field, masked-field, select | checkbox, checkbox-card, checkbox-list, radio-group, switch, rating-input, segmented-control, slider, date-picker, time-picker, date-time-picker, file-upload, photo-upload, image-cropper, profile-cover, photo-gallery, card-form |
| Data | — | table, data-table, stat, time-series, columns, comparison, ranking, meter, period, chart-states, radial-kpi |
| States | empty, loading, error, progress | — |
| Navigation | app-shell, side-menu | header, breadcrumb, footer, search, filters, account-switcher |
| Content | — | carousel, map-placeholder |
| Overlay | overlay, sheet, dialog, full-screen-panel, toast | — |

No piece is approved yet: approving is the reviewer's act, in the workbench.

## Next steps

1. **Forms 2 — choices**: checkbox, checkbox-card, checkbox-list, radio-group,
   switch, segmented-control, slider, rating-input (and `rating` in
   Primitives, which rating-input pairs with).
2. **Forms 3 — dates**: date-picker (MM/DD/YYYY, en-US calendar, week starts
   on Sunday), time-picker (12-hour display, `HH:mm` submitted),
   date-time-picker.
3. **Forms 4 — files and images**: file-upload, photo-upload, image-cropper,
   profile-cover, photo-gallery, card-form.
4. **Navigation**: header (provisional logo, no brand line), breadcrumb,
   footer (all links and contacts as props), search, filters,
   account-switcher (generic accounts, no domain roles).
5. **Content**: carousel, map-placeholder.
6. **Data**: tables, stat, charts, period (en-US month names and number
   formats), chart-states, radial-kpi.
7. **Foundation**: typography, grid, motion and icons pages.
8. **Block 4 leftovers**: the Playwright layout ruler (375 / 768 / 1280 /
   1920) and live contrast measurement on the Roles page.
9. **Block 5**: the brand guide.

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
  enforces all three.
- **Tests**: behavior tests per component (Testing Library + jsdom; use
  `installDomStubs()` from `src/test/dom.ts` for popovers and lists).
- **Verify before the PR**: `npm run check`, `npm run build`, and the
  workbench in the browser at 375 and 1280 in both color schemes.
- **The blocklist guard runs locally**: hooks check commits; run
  `node scripts/guard.ts --message <file>` on every PR title and body before
  publishing. The term list never leaves the local `.blocklist`.
- **Approvals are never made on someone's behalf.** The seal is the
  reviewer's.
