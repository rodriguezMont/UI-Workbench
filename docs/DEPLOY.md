# Deploy

The workbench is published on **Hostinger's managed Node.js** hosting, built
from this repository's `main` branch. Every push to `main` builds and
publishes again on its own.

The published workbench is **read-only**: the approval endpoint exists only
under `vite dev`, so the seals show what is committed in
`src/workbench/approvals.json`. To change an approval, approve on your machine
and merge the ledger.

## What runs there

| | |
| --- | --- |
| **Source** | `rodriguezMont/UI-Workbench`, branch `main` |
| **Node.js** | 24 (the project needs `>=22.18`: `npm install` runs a `.ts` script) |
| **Build** | `npm run build` — type-check, then `vite build` into `dist/` |
| **What gets published** | `server.js`, the `dist/` folder and `package.json` — nothing else from the repository |
| **Entry** | `server.js` at the root: serves `dist/` on the `PORT` the platform gives it (3000 without one) |
| **Routes** | a path with no file extension (`/primitives`) gets `index.html`, so a reload on any section works; a missing file gets 404 |
| **Headers** | `X-Robots-Tag: noindex, nofollow` on every response (the page also carries the meta tag); hashed files under `/assets/` cached for a year, `index.html` never |
| **Variables** | `NPM_CONFIG_PRODUCTION=false` only — there are no secrets |

`server.js` is plain JavaScript with no dependencies, so it runs on the
platform as is; `scripts/server.test.ts` covers it. `vercel.json` stays for a
Vercel deploy, with the same rewrites and header.

## The first deploy

Each step creates something outside this machine, so each one is done by the
repository owner in hPanel.

1. **Create the app:** hPanel → **Websites → Add website → Node.js (Web App)**.
   Choose **import from GitHub**, allow Hostinger on GitHub **only for the
   `UI-Workbench` repository**, and pick the **`main`** branch.
2. **Build settings:**

   | Field | Value |
   | --- | --- |
   | Framework preset | **Express** — not Vite: the entry is `server.js` |
   | Node.js version | **24** |
   | Root directory | `./` |
   | Build command | `npm run build` |
   | Output directory | `dist` |
   | Entry file | `server.js` |

3. **Environment variables:** add `NPM_CONFIG_PRODUCTION` = `false`. Without
   it the platform may install production dependencies only, and the build
   fails: TypeScript, Vite and Tailwind are development dependencies.
   hPanel detects **Vite** from `package.json` and, with that preset, shows no
   entry field: the site is then published as static files, `server.js`
   never runs, and a section opened directly answers 404. Pick Express so the
   entry field appears. If the app was already created as Vite, change it in
   the app's build settings (or through Hostinger's API: `app_type` `express`,
   `entry_file` `server.js`) and build again.
4. **Deploy** and wait for the build to finish. The app gets a temporary
   domain; it is fine to keep it.

## Check after a deploy

- The temporary domain opens the map, in light and dark.
- A section opened directly (`/forms`) and reloaded still shows the section.
- The response headers carry `X-Robots-Tag: noindex, nofollow`.
- The header badge reads "read-only build" and the seals have no approve
  button.

## Redeploy

Merge to `main`. Changing an environment variable in hPanel needs a new
deploy to take effect.

## Known pitfalls

- **503, and the runtime log says "App did not call listen() within 3
  seconds":** the platform loads the entry through its own runner, so an entry
  that only listens when it is run directly (`require.main === module`, or
  comparing `process.argv[1]` with the file) never starts. `server.js`
  listens on load; only Vitest imports it without a server.

- **Build fails on `tsc` or `vite` not found:** development dependencies were
  not installed — check `NPM_CONFIG_PRODUCTION=false`.
- **`npm install` fails on `scripts/setup-hooks.ts`:** the Node.js version is
  below 22.18, which cannot run TypeScript directly. Pick 24. Outside a git
  work tree the script does nothing, so the missing `.git` there is fine.
- **The site answers 404 or a blank page:** the entry file is not `server.js`
  or the output directory is not `dist`. The platform only publishes the entry
  and the output folder, so the server must sit at the root and read `dist/`
  next to it.

## Run it like production, locally

```sh
npm run build
npm start                 # http://localhost:3000
```

`PORT=5182 npm start` picks another port.
