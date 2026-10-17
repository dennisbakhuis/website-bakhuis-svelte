# dennisbakhuis.nl — website spec

Personal website of Dennis Bakhuis: a visual "visitekaartje" on the front page,
an online dive log at `/dive` that Dennis maintains himself from the browser,
and a blog + TIL archive. Built on the same stack, repo layout and deploy path
as `website-voorvoet-svelte`, `website-stouwdamschilders-svelte` and
`operator-website`; the backend follows the `voetlink` pattern already
running on `operator-infra`.

This is a brief design contract, not an implementation plan. Sections marked
**TBD** are decisions still to be taken by Dennis (collected in §12).

---

## 1. Goals

1. **Profile** — one attractive, memorable front page that says who Dennis is,
   what he does (data science / ML / engineering, physics PhD) and what he
   likes (diving, open source, writing, …). Visitors: recruiters, clients,
   collaborators, fellow divers, readers arriving from an article.
2. **Dive log** — a public, fast, searchable log of every dive with global
   statistics, a world map and a gear page. Dennis adds and edits dives
   **online** (also from a phone on a dive trip): details, text, photos, maps,
   scans of the paper logbook and raw dive-computer exports.
3. **Writing** — blog posts and short TIL notes, written in Markdown in the
   repo, with tags, RSS and good code rendering.
4. **Same operational quality as the other sites** — CI, tests, strict CSP,
   privacy-friendly analytics, Docker images, `dev` → `main` release flow,
   backups.

Non-goals (for v1): multi-user accounts, comments, newsletter, multi-language
content, blog editing in the browser (blog stays in git).

---

## 2. Locked decisions

| Decision        | Value                                                                                                                       |
| --------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Frontend        | SvelteKit 2 + Svelte 5 (runes) + TypeScript strict, `@sveltejs/adapter-node`, port 3000                                     |
| Package manager | pnpm, Node 22 (`.nvmrc`), `VERSION` file + `scripts/sync-version.mjs`                                                       |
| Backend         | `divelog-server` (Python 3.13 + FastAPI + Pydantic v2) from the divelog monorepo, port 8000, `/api/*`, `/media/*`           |
| Data            | Files in the private `website-bakhuis-content` git repo (Markdown + JSON), loaded into memory; git is the history           |
| Media           | S3 (Hetzner Object Storage) in prod, a local directory in dev; served via the backend under `/media/*`                      |
| Auth            | Single owner. Magic-link e-mail → session cookie; link requests rate-limited                                                |
| Content         | Blog/TIL as Markdown in the content repo's `posts/{blog,til}/` (`CONTENT_DIR`), compiled by `@blog/kit` at build time       |
| Animation       | anime.js v4 (front page + a few tasteful touches elsewhere), `prefers-reduced-motion` honoured                              |
| Maps            | MapLibre globe, site locators and the admin location picker from self-hosted PMTiles under `/media/tiles`; SVG fallback     |
| Styling         | Plain CSS custom properties (`src/lib/styles/theme.css`, the kits' tokens map onto it), self-hosted fonts via `@fontsource` |
| Analytics       | Umami, server-side relay as in the other sites; no cookies for visitors, no consent banner                                  |
| Site language   | English UI and content                                                                                                      |
| Domain          | `dennisbakhuis.nl` (prod, from `main`), `dev.dennisbakhuis.nl` (from `dev`)                                                 |
| Infra           | `operator-infra` Hetzner box, Caddy vhost, compose stack `bakhuis` (frontend + backend, no database)                      |
| Backups         | The data repo is the backup (git, pushed after every edit), S3 versioning on the media bucket                               |
| Quality gates   | eslint `--max-warnings 0`, prettier, svelte-check, vitest with coverage; server gates run in the monorepo                   |
| Commits         | No AI co-author trailers or footers, authored solely by Dennis                                                              |

Why files and not Postgres (decided 2026-09-27, replacing the earlier
Postgres design): the log is ~700 records that change a few times a week, the
curated dataset already _is_ files, and git gives diffable history, backup and
a second copy for free. The backend keeps FastAPI for auth, uploads and imports
but reads and writes the data repository directly; every admin edit is one
commit. See `docs/RUNBOOK.md` for the layout.

The dive log is a module (decided 2026-10-09): its pages are `@divelog/kit` and
its backend is `divelog-server`, both from the divelog monorepo (`../divelog`).
Dive sites can come from a shared site **commons** (`divelog-sites`) layered
under the personal log; dives, people, trips, gear, profiles, scans and
reference maps stay personal. This site supplies only the personal config
(`src/lib/divelog-config.ts`), the theme and two catch-all routes. The file
format, the commons with its overlays and forks, and mounting the kit are
documented in the divelog repo: [FORMAT.md](../../divelog/docs/FORMAT.md),
[KIT.md](../../divelog/docs/KIT.md) and
[DEPLOY.md](../../divelog/docs/DEPLOY.md).

---

## 3. Site map

```
/                     Front page — profile / visitekaartje (§4)
/dive                 Dive log: stats + map + searchable list (§5)
/dive/[number]        Single dive: details, profile graph, text, photos, route on the site map, logbook scan
/dive/sites           Site index by country, with map badges
/dive/sites/[id]      Dive site: description, location, drawn maps, all dives there
/dive/regions/[id]    Region: shared context for a group of sites
/dive/trips[/slug]    Trips grouping dives, e.g. "Mexico 2027"
/dive/people[/slug]   Buddies (first name or alias on the public site)
/dive/gear            Gear page: current setups, item list, dives per item (§6)
/blog, /blog/[slug]   Blog
/til,  /til/[slug]    301 → /blog?kind=til and /blog/[slug] (TIL notes are a blog filter)
/projects             (optional) Selected work / open-source cards
/uses                 (optional) Dev setup — desk, editor, tools (dive gear lives under /dive/gear)
/contact              Contact form (Cap + rate limit + SMTP as in the other sites)
/admin/**             Owner-only editing UI (§7). Not linked from the public site, `noindex`
/api/**               FastAPI (proxied by Caddy to the backend container)
/media/**             Media delivery (resized image variants, PDFs), backend-served with long cache headers
/feed.xml, /sitemap.xml, /robots.txt, /health, /privacy, /go/[slug]
```

Global chrome: minimal sticky nav (name left, links right), footer with
socials, version, RSS. Dark-first design; light mode supported via tokens.

---

## 4. Front page — the visitekaartje

### 4.1 Content sections (in order)

1. **Intro / hero** — name, one-line role, location + live local time, current
   availability. Full-viewport, animated (§4.2).
2. **About** — short bio in three beats: physics PhD (turbulence) → data
   science & ML engineering → what drives him now. Skill tags; a portrait
   photo is **TBD** (§12).
3. **Things I like** — the personal part. A bento-style grid of "tiles", each
   a small live widget rather than a static card:
   - **Diving** — live counters from the API (dives, hours underwater,
     countries, deepest, last dive), link to `/dive`.
   - **Writing** — three most recent posts / TILs.
   - **Open source** — link to GitHub (later: pinned projects with stars
     pulled at build time).
   - **Home automation** (a static tile, no live data).
4. **Work** — 3–4 selected projects or roles (cards, optional link).
5. **Contact** — email, LinkedIn, GitHub, other; optional form.

### 4.2 anime.js concept — "Descent"

One coherent metaphor that ties the data-scientist and diver halves together:
scrolling the front page is a dive. The page starts at the surface and gets
deeper the further you scroll; each section is a "stop" at a depth.

- **Surface (hero)** — bright, near-white. Name reveals with a staggered
  per-letter animation (anime timeline). Behind it a subtle animated surface:
  light caustics or a slow wave line drawn with SVG path animation.
- **Descent on scroll** — anime.js v4 scroll observer drives:
  - background colour interpolating from surface-white → deep navy → near
    black as you scroll (CSS variable tweened, so it costs nothing);
  - a thin **depth gauge** fixed at the page edge that reads `0 m`, `5 m`,
    `12 m`, … as the sections pass — the numbers are real max depths from the
    log (first dive, first cave dive, deepest), a nice easter egg;
  - occasional bubbles rising (a handful of SVG circles, staggered, looping)
    that get sparser the deeper you go.
- **Section reveals** — each section's content enters with a small staggered
  fade/translate as it scrolls into view (anime `onScroll` with `sync`).
- **Counters** — the dive/writing numbers count up from 0 when their tile
  becomes visible.
- **Ascent** — the footer is the "safety stop": a slow ascent line back to the
  surface colour and a final "Surface interval — get in touch" CTA.

Guard rails:

- With `prefers-reduced-motion: reduce` every animation is replaced by its
  final state; the depth gauge still works (it's scroll-linked, not timed).
- The intro must not block: content is SSR'd and readable at 0 ms; the name
  animation is ≤ 1.2 s and never replays on in-site navigation (session flag).
- Total front-page JS budget including anime.js: ≤ 60 kB gzipped.

Alternative considered (kept as a fallback): the **three-stripe photo intro**
from the old site's design — three bands slide in and together
form one B&W portrait, then the palette inverts. Fits an anime timeline well
and can be layered on top of the Descent hero if desired.

---

## 5. Dive log — `/dive`

### 5.1 Data model

The log is files in the private `website-bakhuis-content` repository: one Markdown file per
dive (`dives/<nnnnn>.md`, frontmatter for the numbers, body for the story),
site, region, person and trip override, and JSON for gear, dive-computer
profiles, import records and drawn maps (stick maps for caves, site maps for
open water, each with its own `revision` and changelog). A dive's
`map_annotation` records the route swum on one of its site's maps, pinned to the
map revision. Photos and scans live in the media store and are referenced by key
from each record's `media` list. The format is specified in
[FORMAT.md](../../divelog/docs/FORMAT.md) in the divelog repo; the Pydantic
records in `divelog_server/store/models.py` are the schema.

`visibility: private` dives are hidden from lists, detail and map but still
count in stats ("dives: 412 (3 private)"); `draft` dives (from an import) are
not counted until published. People show by first name or alias on the public
site; sites can be set to `location_visibility: region_only` to hide sensitive
spots.

### 5.2 Public page layout

1. **Stats band** (top): total dives, total bottom time (h), max depth, avg
   depth, countries, sites, first dive year, and one tile per notable tag:
   cave dives, scooter dives, wreck dives, night dives, deepest, longest,
   coldest. Computed by the API (`GET /api/v1/dive/stats`), cached; numbers
   animate on entry (shared counter component with the front page).
2. **World map**: MapLibre globe on the self-hosted `world.pmtiles` with a
   dot per site; a static SVG world map until that archive exists. Region
   insets for dense areas (NL/Belgium quarries, Red Sea, …) — v2.
3. **Charts**: dives per year, depth histogram, dives by tag. Static SVG,
   tokens-driven colours.
4. **Search & filter** — the list index (all public dives, ~100 bytes each) is
   fetched once and filtered client-side; server search only if the log grows
   past a few thousand dives:
   - free-text over site, country, buddies, notes, tags;
   - facets: country, site, year, tag, gas/mode, depth range, duration range,
     gear setup;
   - sort by date / depth / duration; URL-synced query (`?tag=cave&country=FR`)
     so a filter is shareable;
   - dense table on desktop, cards on mobile.
5. **Dive detail** `/dive/[number]`: header (number, date, site, country
   flag), key numbers, depth + temperature profile chart (SVG line drawn in
   with anime on load, only if a computer export exists), gas/mode/suit/gear
   setup, buddies, the markdown body, photo gallery (lightbox), the site's
   drawn map with the dive's route, **logbook tab** showing the scanned
   paper page, prev/next dive, "other dives at this site", trip link.

### 5.3 Dive-computer imports

- Upload a Subsurface XML or Shearwater (Perdix) XML export in
  `/admin/import`; a dry run shows what would happen. The backend matches
  dives to existing ones by start time or dive number (Shearwater: within ten
  minutes) and either attaches the profile or creates **draft** dives with the
  numeric fields filled in; a Subsurface import also matches or creates its
  sites. Dennis then enriches drafts (site, buddies, text, photos) and
  publishes.
- The raw file is kept in the media store under `imports/` and every run is
  recorded in `imports/<id>.json` in the data repo, so re-parsing is possible
  when the parser improves.
- The paper years were backfilled once from the retired workbook (kept in the
  data repo under `archive/`); logbook scans are attached per dive.

### 5.4 Later ideas (not v1)

- DPV distance/runtime tracking.
- GPX/KML export; public read-only JSON API documented at `/api/docs`.
- OCR of logbook scans to pre-fill drafts (Claude vision) — nice to have.

---

## 6. Gear — `/dive/gear`

- **Setups**: named configurations ("single tank recreational", "sidemount
  cave", "CCR + DPV") each listing its items.
  A dive references one setup, so the page can show _dives with this setup_.
- **Items**: card per item — photo, brand/model, category, since/retired,
  notes ("why I chose it"), and a computed _dives with this item_ count.
- Retired gear stays visible in a "past gear" section: it's part of the story.
- Everything here is edited in `/admin/gear`; item photos go through the
  same upload flow.

---

## 7. Admin — `/admin`

Owner-only UI: the kit's admin pages, mounted through the `admin/[...path]`
catch-all, talking to the backend through `/api/v1/admin/*`. Must work well on
a phone: adding a dive the same evening on a boat with bad Wi-Fi is the
primary use case. The pages are described in
[KIT.md](../../divelog/docs/KIT.md) in the divelog repo.

- **Login**: magic-link e-mail via the existing SMTP setup to the configured
  owner address only (`/admin/login`). Session cookie `HttpOnly; SameSite=Lax`
  (`Secure` in prod), 30 days, extended on use past halfway. Link requests are
  rate-limited.
- **Dive editor**: one form; _Same as previous dive_ fills site, buddies,
  tanks and trip; explicit _Save_; drafts from an import are published from
  the list.
- **Attachments**: photos and scans upload through the backend, which strips
  metadata (the date taken is kept), caps the original and renders WebP
  variants (480 / 800 / 1600). Scans are private by default. Reorder, mark one
  photo as cover.
- **Site editor** with a MapLibre location picker on the self-hosted tiles,
  country and region derived from the pin offline and editable; a map editor
  for stick maps and site maps.
- **Import** page (§5.3) with a review list of drafts.
- **Gear**, **People**, **Trips** and **Regions** editors.
- Everything the admin can do is also available through the API with the same
  session; the `divelog` CLI's `push` subcommands use it with a cookie jar.

---

## 8. Blog and TIL

- Served by the blog module `@blog/kit` (repo `../blog`, vendored in `vendor/`); the markdown
  and the personal config (`src/lib/blog-config.ts`) stay in this site.
- Markdown with frontmatter (`title, date, updated, tags, summary, words, draft,
external`; dates `YYYY-MM-DD`), compiled by the kit's `blogPreprocess` (mdsvex). TIL notes
  use the compact list layout: title, date, tags — no summary or reading time.
- Syntax highlighting at build time (Shiki). Later: copy button, math
  (KaTeX), footnotes, callouts.
- Index pages: reverse-chronological, tag filter, year grouping, reading time.
- RSS feed (blog + TIL), OG image per post (build-time template — v2).
- Existing Towards Data Science articles listed on `/blog` as external
  entries with canonical links (**TBD**: which).
- TIL is deliberately low-friction: one file, five lines, ship it. Adding a
  post = PR to `dev`, same as code; no online editor for writing in v1.

---

## 9. Non-functional requirements

- **Performance**: Lighthouse ≥ 95 on all categories for `/`, `/dive`,
  `/blog`. LCP < 1.5 s on 4G. Public dive pages SSR'd from the API with
  short server-side caching (stale-while-revalidate, purged on publish);
  images via responsive variants from `/media`, fonts self-hosted and subset.
- **Accessibility**: keyboard-navigable filters and map (list is the
  accessible fallback for the map), visible focus, AA contrast, reduced-motion
  aware; admin forms fully labelled.
- **SEO**: per-page meta + OG, JSON-LD `Person` on `/`, `Article` on posts,
  sitemap including public dives/sites, canonical URLs; `/admin` `noindex`.
- **Security/privacy**: strict CSP (`mode: 'auto'`, no third-party
  origins), security headers in `hooks.server.ts` + Caddy, HSTS, Umami
  server-side, no visitor cookies, contact form behind Cap + rate limiter.
  Uploads: size limits, image metadata (GPS included) stripped, private
  bucket — nothing served straight from S3.
- **Backups/DR**: the data repo is the backup (pushed after every admin
  write; `git checkout <sha> -- dives/00457.md` restores a record), media
  bucket versioning; documented restore procedure in `docs/RUNBOOK.md`.
- **Operations**: `/health` on both services, JSON logs on the backend,
  read-only containers, non-root, same compose hardening as the other sites,
  one uvicorn worker (the store is in-process), `prune-images.yml`.

---

## 10. Repository layout

The site is a consumer of the divelog module: the dive log's frontend is
the `@divelog/kit` package and the backend is the `divelog-server` package, both from the
divelog monorepo (`../divelog` in dev). The data lives in two more repositories.

```
docs/                SPEC.md (this), RUNBOOK.md (kit, server, data, commands)
src/                 SvelteKit
  lib/divelog-config.ts   the log's personal config: names, site URL, title suffix, page copy, home tile
  lib/divelog.server.ts   createDivelog bound to BACKEND_URL
  lib/blog-config.ts      the blog's personal config: names, site URL, copy, kinds
  lib/blog.ts        createBlog over the lazily globbed $content (CONTENT_DIR, @blog/kit)
  lib/components/    home/ (Hero, Bubbles, Fish, DepthGauge), ContactForm
  lib/anim/          site-only anime.js helpers: descent scroll, fish
  lib/server/        email, cap, umami, rate limiter
  lib/styles/        theme.css (the site's tokens; the kit's tokens.css + divelog.css map --dl-* onto them)
  lib/seo.ts, site.ts, go-targets.ts, cap-widget-loader.ts, forms/
  routes/            +layout (kit styles, setMapWorkerUrl), / (DiveTile and WritingTile from the kits' widgets),
                     dive/[...path] + dive/og (kit routes and diveOg), admin/[...path] + admin/login,
                     blog/ (thin @blog/kit wrappers), til/ (redirects), contact, privacy, api/cap/,
                     feed.xml, sitemap.xml, robots.txt, go/, health
vendor/              divelog-kit-<version>.tgz (make kit-vendor) and blog-kit-<version>.tgz (make blog-vendor)
scripts/             sync-version.mjs (VERSION → package.json)
static/              favicons, og default
.github/workflows/   ci.yml (frontend gates), docker-publish.yml (frontend image; deploy names the
                     divelog-server tag), pr-source-gate.yml, prune-images.yml
Dockerfile           frontend image only
docker-compose.yml   dev: divelog-server built from ../divelog/packages/server + mailpit
Makefile, VERSION, svelte.config.js, vite.config.ts
content.config.js    CONTENT_DIR: the posts, default ../website-bakhuis-content/posts
pyproject.toml, uv.lock  uv project that installs divelog-server for the `divelog` CLI
data/                raw dive-log sources (git-ignored; the curated set lives in ../website-bakhuis-content)
```

Elsewhere: `../divelog/packages/kit` (components, page routes, server helpers, OG cards, styles;
its tests and the API-type drift check), `../divelog/packages/server` (FastAPI app, store, CLI,
tests, `Dockerfile`, published as `ghcr.io/<owner>/divelog-server`), `../website-bakhuis-content`
(the log and the posts), `../divelog-sites` (the sites commons), `../blog` (`@blog/kit` and its
reference app).

---

## 11. Phases

| Phase | Deliverable                                                                                            |
| ----- | ------------------------------------------------------------------------------------------------------ |
| 0     | Repo scaffold from the sibling template: CI, Docker, tokens, nav/footer, `/health`, `/privacy`         |
| 1     | Front page with content and the Descent animation; contact                                             |
| 2     | Backend: `divelog-server` over the data files, magic-link auth, `/admin` login                         |
| 3     | Dive model + admin editor + attachments (S3, variants); public `/dive`, `/dive/[number]`, sites, stats |
| 4     | World map, charts, search/filter; gear pages; dive-computer import + draft review; backfill of the log |
| 5     | Blog + TIL + RSS; migrate/link existing articles                                                       |
| 6     | Infra change set for `operator-infra` (Caddy, compose, bucket, DNS, backups), first deploy to `dev`  |
| 7     | Polish: OG images, `/projects`, `/uses`, region map insets, Lighthouse pass                            |

---

## 12. Open questions for Dennis

1. **Domain** — `dennisbakhuis.nl` only, or also `dennisbakhuis.com`
   redirecting (the old Reflex site targeted `.com`)?
2. **Hero photo(s)** — portrait and/or underwater photo for the hero; do you
   want the three-stripe B&W intro layered on the Descent concept?
3. **Existing writing** — list of TDS/Medium articles to import as external
   entries; any existing TIL collection?
