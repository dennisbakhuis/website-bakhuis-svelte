# dennisbakhuis.nl — website spec

Personal website of Dennis Bakhuis: a visual "visitekaartje" on the front page,
an online dive log at `/dive` that Dennis maintains himself from the browser,
and a blog + TIL archive. Built on the same stack, repo layout and deploy path
as `website-voorvoet-svelte`, `website-stouwdamschilders-svelte` and
`operator-website`; the backend follows the `voetlink` pattern already
running on `operator-infra`.

This is a brief design contract, not an implementation plan. Sections marked
**TBD** are decisions still to be taken by Dennis (collected in §11).

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

| Decision        | Value                                                                                                      |
| --------------- | ---------------------------------------------------------------------------------------------------------- |
| Frontend        | SvelteKit 2 + Svelte 5 (runes) + TypeScript strict, `@sveltejs/adapter-node`, port 3000                    |
| Package manager | pnpm, Node 22 (`.nvmrc`), `VERSION` file + `scripts/sync-version.mjs`                                      |
| Backend         | Python 3.13 + FastAPI + Pydantic v2, uv, port 8000, `/api/*` and `/media/*`                                |
| Data            | Files in the private `divelog-data` git repo (Markdown + JSON), loaded into memory; git is the history     |
| Media           | Hetzner Object Storage (S3) buckets `bakhuis-{prod,dev}-media`; served via the backend under `/media/*`    |
| Auth            | Single owner. Passkey (WebAuthn) login + magic-link e-mail fallback, session cookie, rate-limited          |
| Content         | Blog/TIL as Markdown via mdsvex in `src/content/{blog,til}/` — git is the CMS for writing                  |
| Animation       | anime.js v4 (front page + a few tasteful touches elsewhere), `prefers-reduced-motion` honoured             |
| Public maps     | MapLibre globe + site locators from self-hosted PMTiles under `/media/tiles`; SVG (Natural Earth) fallback |
| Admin maps      | MapLibre GL + vector tiles from a single allow-listed origin, only under `/admin` (route-scoped CSP)       |
| Styling         | Plain CSS custom properties (`src/lib/styles/tokens.css`), self-hosted fonts via `@fontsource`             |
| Analytics       | Umami, server-side relay as in the other sites; no cookies for visitors, no consent banner                 |
| Site language   | English UI and content (**TBD** — see §11)                                                                 |
| Domain          | `dennisbakhuis.nl` (prod, from `main`), `dev.dennisbakhuis.nl` (from `dev`)                                |
| Infra           | `operator-infra` Hetzner box, Caddy vhost, compose stack `bakhuis` (frontend + backend + postgres)       |
| Backups         | wal-g for Postgres, S3 versioning on media buckets, restic of the raw exports to the Storage Box           |
| Quality gates   | eslint `--max-warnings 0`, prettier, svelte-check, vitest ≥70 %; backend ruff + mypy strict + pytest       |
| Commits         | No AI co-author trailers or footers, authored solely by Dennis                                             |

Why files and not Postgres (decided 2026-09-27, replacing the earlier
Postgres design): the log is ~700 records that change a few times a week, the
curated dataset already _is_ files, and git gives diffable history, backup and
a second copy for free. The backend keeps FastAPI for auth, uploads and imports
but reads and writes the data repository directly; every admin edit is one
commit. See `docs/RUNBOOK.md` for the layout.

---

## 3. Site map

```
/                     Front page — profile / visitekaartje (§4)
/dive                 Dive log: stats + map + searchable list (§5)
/dive/[number]        Single dive: details, profile graph, text, photos, maps, logbook scan
/dive/sites/[slug]    Dive site: description, location, all dives there
/dive/sites           Site index by country, with map badges
/dive/gear            Gear page: current setups, item list, dives per item (§6)
/dive/trips/[slug]    (optional) Trip page grouping dives, e.g. "Mexico 2027"
/blog, /blog/[slug]   Blog
/til,  /til/[slug]    301 → /blog?kind=til and /blog/[slug] (TIL notes are a blog filter)
/projects             (optional) Selected work / open-source cards
/uses                 (optional) Dev setup — desk, editor, tools (dive gear lives under /dive/gear)
/contact              Contact form (Cap + rate limit + SMTP as in the other sites) — or mailto only
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
   science & ML engineering → what drives him now. Portrait photo. Skill tags.
   Source text: `personal-website/CONTENT.md`.
3. **Things I like** — the personal part. A bento-style grid of "tiles", each
   a small live widget rather than a static card:
   - **Diving** — live counters from the API (dives, hours underwater,
     countries, deepest, last dive), link to `/dive`.
   - **Writing** — three most recent posts / TILs.
   - **Open source** — pinned projects (pigeonXT, …) with stars pulled at
     build time.
   - **TBD** further hobby tiles (photography, music, travel, home automation…).
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
from the old `personal-website/DESIGN.md` — three bands slide in and together
form one B&W portrait, then the palette inverts. Fits an anime timeline well
and can be layered on top of the Descent hero if desired.

---

## 5. Dive log — `/dive`

### 5.1 Data model (files in `divelog-data`; the Pydantic records in `backend/app/store/models.py` are the schema)

```
dive          id, number, date, time_in, duration_min, max_depth_m, avg_depth_m,
              water_temp_c, air_temp_c, visibility_m, site_id, trip_id,
              tags[] (cave, cavern, mine, wreck, night, drift, deco, dpv, boat,
                      training — properties of the dive; water type and depth are
                      not tags: see site.water and max_depth_m), gas (air|nitrox|trimix), o2_pct, he_pct,
              mode (OC|CCR|sidemount), suit, weights_kg, rating 1–5,
              gear_setup_id, buddies[] (→ person), guide (→ person),
              body_md (free text, markdown), visibility (public|private),
              computer_import_id, created_at, updated_at
site          id, slug, name, country, region, lat, lon, type (sea|lake|quarry|cave|river|pool),
              description_md, max_depth_m, access_notes_md, visibility (exact|region_only),
site_map      id, site_id, sort — a drawn map; the drawing lives in immutable revisions
site_map_revision id, map_id, number, note, created_at,
              data {kind (stickmap|sitemap), title, nodes[], edges[], areas[], notes}
              — nodes are stations/objects in metres, edges the line between
              them, areas shore/shallows/wreck outlines; every save appends a
              revision, restore copies an old one forward
dive.map_annotation {map_id, revision, route[] (legs swum), turn (station),
              pins[] {x, y, note}, note} — pinned to the revision it was drawn on
trip          id, slug, name, start, end, description_md
person        id, name, display (full|first|initials|hidden)
gear_item     id, name, category (regulator|BCD|wing|computer|DPV|light|suit|cylinder|…),
              brand, model, acquired, retired, notes_md, photo_id
gear_setup    id, name (e.g. "sidemount cave"), items[] (→ gear_item), description_md
attachment    id, dive_id | site_id | gear_item_id, kind (photo|scan|map|export|video),
              s3_key, mime, bytes, width, height, caption, sort, taken_at, variants{}
profile       dive_id, samples[] {t_s, depth_m, temp_c?, ppo2?, ndl?} (downsampled), source
computer_import id, uploaded_at, format (subsurface-xml|uddf|fit|csv|shearwater),
              s3_key, status, dives_created[]
```

`visibility=private` dives are hidden from lists, detail and map but still
count in stats ("dives: 412 (3 private)"). Persons default to first name only
on the public site; sites can be set to region-only to hide sensitive spots.

### 5.2 Public page layout

1. **Stats band** (top): total dives, total bottom time (h), max depth, avg
   depth, countries, sites, first dive year, and one tile per notable tag:
   cave dives, scooter dives, wreck dives, night dives, deepest, longest,
   coldest. Computed by the API (`GET /api/v1/dive/stats`), cached; numbers
   animate on entry (shared counter component with the front page).
2. **World map**: self-hosted SVG world (Natural Earth 110m → TopoJSON), dots
   sized by dive count per site, colour by dominant type. Hover = tooltip
   with site + count, click = filters the list to that site. Region insets
   for dense areas (NL/Belgium quarries, Red Sea, …) — v2.
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
   setup, buddies, the markdown body, photo gallery (lightbox), maps
   (uploaded site/cave maps as images), **logbook tab** showing the scanned
   paper page, prev/next dive, "other dives at this site", trip link.

### 5.3 Dive-computer imports

- Upload a Subsurface XML / UDDF / Garmin FIT / Shearwater CSV export in
  `/admin/dive/import`. The backend parses it (Python is the right tool here),
  matches dives to existing ones by date+time (±10 min) and either attaches
  the profile to a matching dive or creates **draft** dives with the numeric
  fields pre-filled. Dennis then enriches drafts (site, buddies, text, photos)
  and publishes.
- The raw file is kept as an `attachment(kind=export)` so re-parsing is always
  possible when the parser improves.
- A **bulk backfill** of the historic log uses the same import endpoint plus a
  CSV/Excel for the paper years; scans of the paper pages are attached per
  dive afterwards (drag-and-drop, one page can be linked to several dives).

### 5.4 Later ideas (not v1)

- Per-site auto-generated map images for social sharing; trip pages.
- Cave dives: line-map overlays; DPV distance/runtime tracking.
- GPX/KML export; public read-only JSON API documented at `/api/docs`.
- OCR of logbook scans to pre-fill drafts (Claude vision) — nice to have.

---

## 6. Gear — `/dive/gear`

- **Setups**: named configurations ("single tank recreational", "sidemount
  cave", "CCR + DPV") each listing its items with a photo of the rigged kit.
  A dive references one setup, so the page can show _dives with this setup_.
- **Items**: card per item — photo, brand/model, category, since/retired,
  notes ("why I chose it"), and a computed _dives with this item_ count.
- Retired gear stays visible in a "past gear" section: it's part of the story.
- Everything here is edited in `/admin/dive/gear`; item photos go through the
  same attachment flow.

---

## 7. Admin — `/admin`

Owner-only UI, built in SvelteKit (superforms + zod, same as the contact
forms on the other sites), talking to the backend through `/api/v1/admin/*`.
Must work well on a phone: adding a dive the same evening on a boat with bad
Wi-Fi is the primary use case.

- **Login**: passkey (WebAuthn, Face ID on the phone) with magic-link e-mail
  as fallback via the existing SMTP setup; only the configured owner e-mail
  can log in. Session cookie `HttpOnly; Secure; SameSite=Lax`, 30 days,
  rotated on use. Login endpoints rate-limited; failed attempts logged.
- **Dive editor**: one form, sections collapsible: numbers → site (search
  existing / create new with map pin) → people/gear → text (markdown with
  preview) → attachments. Autosave draft every few seconds; explicit
  _Publish_. Duplicate-from-previous-dive to speed up repetitive entry.
- **Attachments**: drag-and-drop or camera; direct-to-S3 upload with a
  presigned URL, then the backend generates image variants (thumb / 800 /
  1600 / original, WebP + original format, EXIF stripped except date). PDFs
  and scans are kept as-is plus a preview image. Reorder by drag, caption
  inline, mark one photo as cover.
- **Site editor** with a MapLibre map for placing the pin (tiles from one
  allow-listed origin, CSP relaxed for `/admin` only), country/region derived
  from the pin offline (Natural Earth polygons) and editable.
- **Import** page (§5.3) with a review list of drafts.
- **Gear** editor (§6). **People** list with display preference.
- Everything the admin can do is also available through the API with the same
  session, so a future CLI/bulk script (`uv run bakhuis-cli import …`) needs no
  extra work.

---

## 8. Blog and TIL

- Markdown with frontmatter (`title, date, updated, tags, summary, draft,
cover`), mdsvex with a `BlogPostLayout.svelte` as in voorvoet. TIL uses a
  lighter layout: title, date, tags, body — no cover, no summary required.
- Syntax highlighting at build time (Shiki), copy button, dark/light themes
  from tokens. Math via KaTeX. Footnotes, callouts, image captions.
- Index pages: reverse-chronological, tag filter, year grouping, reading time.
- RSS/Atom feed (blog + TIL), OG image per post (build-time template — v2).
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
  aware, axe checks in Playwright; admin forms fully labelled.
- **SEO**: per-page meta + OG, JSON-LD `Person` on `/`, `Article` on posts,
  sitemap including public dives/sites, canonical URLs; `/admin` `noindex`.
- **Security/privacy**: strict CSP (`mode: 'auto'`, no third-party origins
  outside `/admin`), security headers in `hooks.server.ts` + Caddy, HSTS,
  Umami server-side, no visitor cookies, contact form behind Cap + rate
  limiter, `/csp-report`. Uploads: type sniffing, size limits, EXIF GPS
  stripped from public variants, private buckets — nothing served straight
  from S3.
- **Backups/DR**: Postgres wal-g to `bakhuis-wal` bucket (14-day retention as
  voetlink), media bucket versioning, restic snapshot of raw exports to the
  Storage Box; documented restore procedure in `docs/RUNBOOK.md`.
- **Operations**: `/health` on both services, JSON logs (pino / structlog),
  read-only containers, non-root, same compose hardening as the other sites,
  Alembic migrations run on backend start, `prune-images.yml`.

---

## 10. Repository layout (target)

```
docs/                SPEC.md (this), DEPLOY.md, RUNBOOK.md (add a post, add dives, restore)
backend/             FastAPI app (uv): app/{api,models,services,importers,media}, alembic/, tests/
  Dockerfile
src/                 SvelteKit
  content/blog/      *.md
  content/til/       *.md
  lib/dive/          types (generated from the OpenAPI schema), client, search/filter, stats helpers
  lib/anim/          anime.js helpers: reveal, counter, descent scroll, reduced-motion guard
  lib/blog/          mdsvex layouts, remark plugins
  lib/map/           TopoJSON projection + world map component (public), MapLibre picker (admin)
  lib/server/        email, cap, umami, logger, session/auth helpers
  lib/styles/        tokens.css
  routes/            +layout, /, dive/, blog/, til/ (redirects), admin/, contact, feed.xml, go/, health
static/              fonts, favicons, og default, world-110m.json
infra/               Change set for operator-infra: Caddy vhost, compose.prod.yml, env example, tofu buckets
.github/workflows/   ci.yml (frontend + backend), docker-publish.yml (two images), pr-source-gate.yml, prune-images.yml
Dockerfile, docker-compose.yml (frontend + backend + postgres for local dev), Makefile, VERSION
```

---

## 11. Phases

| Phase | Deliverable                                                                                            |
| ----- | ------------------------------------------------------------------------------------------------------ |
| 0     | Repo scaffold from the sibling template: CI, Docker, tokens, nav/footer, `/health`, `/privacy`         |
| 1     | Front page with content and the Descent animation; contact                                             |
| 2     | Backend skeleton: FastAPI, Postgres, Alembic, auth (passkey + magic link), `/admin` login              |
| 3     | Dive model + admin editor + attachments (S3, variants); public `/dive`, `/dive/[number]`, sites, stats |
| 4     | World map, charts, search/filter; gear pages; dive-computer import + draft review; backfill of the log |
| 5     | Blog + TIL + RSS; migrate/link existing articles                                                       |
| 6     | Infra change set for `operator-infra` (Caddy, compose, buckets, DNS, backups), first deploy to `dev` |
| 7     | Polish: OG images, `/projects`, `/uses`, region map insets, Lighthouse pass                            |

---

## 12. Open questions for Dennis

1. **Dive computer / app** — which one(s) do you export from (Subsurface,
   Shearwater Cloud, Garmin, …)? One sample export in `backend/tests/fixtures/`
   lets the importer be designed against real data.
2. **Historic log** — roughly how many dives, and how far back does the paper
   logbook go? Do you want to backfill everything before launch, or launch
   with recent dives and add the paper years over time?
3. **Privacy defaults** — buddies shown by first name? Exact GPS for all
   sites, or region-only for some (private cave systems)? Any dives private?
4. **Login** — passkey + magic-link OK, or would you rather put `/admin`
   behind the NetBird mesh (zero auth code, but needs NetBird on the phone)?
5. **Language** — English only, or English + Dutch UI (Paraglide available
   from the template but doubles the content work)?
6. **Hobby tiles** — which "things I like" get a tile besides diving, writing
   and open source?
7. **Contact** — full form with Cap/SMTP like the other sites, or mailto +
   socials only?
8. **Domain** — `dennisbakhuis.nl` only, or also `dennisbakhuis.com`
   redirecting (the old Reflex site targeted `.com`)?
9. **Hero photo(s)** — portrait and/or underwater photo for the hero; do you
   want the three-stripe B&W intro layered on the Descent concept?
10. **Existing writing** — list of TDS/Medium articles to import as external
    entries; any existing TIL collection?
