# Split the dive log into a reusable module with a shared dive-site commons

## Context

The dive log (public pages, admin, FastAPI backend, map tooling) is the most developed part
of `website-bakhuis-svelte`, but it is welded to the personal site: hard-coded `/dive`,
`/admin`, `/api/v1`, `/media/tiles` URLs, the site's theme tokens and utility classes, the
anim helpers, the owner/session plumbing, and branding literals in the backend. The data is
one private git repo (`divelog-data`) where objective site knowledge (coordinates, type,
water, 203 drawn maps, CC photos) sits in the same files as personal material (first-person
stories, owner notes, private reference maps, logbook scans).

Goal: turn the dive log into a **module other divers can add to their own website**, and
inside it a **system to share dive sites**: sites become community data, logs stay personal.

Decisions taken with Dennis (2026-10-09):

| Decision        | Choice                                                                                                                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Packaging       | Monorepo with a Python server package (GHCR image), one npm kit package, and a reference SvelteKit app that doubles as the standalone deployment. The personal site becomes an ordinary consumer. |
| Site sharing v1 | Public git **commons** repo (`divelog-sites`), PR-based with CI validation. Instances clone it read-only and layer personal data on top.                                                          |
| Licence         | Code Apache-2.0. Commons database ODbL 1.0, prose and drawn-map artwork CC BY-SA 4.0, photos keep their own CC licence.                                                                           |
| Scope now       | **Phase A only**: decouple in place inside this repo. Nothing moves, no data changes, every page keeps working.                                                                                   |
| Execution       | Implementation work is delegated to **Opus subagents** (`model: "opus"`), one per work item, run in parallel where items are independent.                                                         |

---

## Part 1 — How it is organised (target state)

### 1.1 Three things, three owners

| Thing                                                                                                                                          | Lives in                                               | Owner                  | Licence             |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ---------------------- | ------------------- |
| **Module code** (server, kit, CLI, reference app)                                                                                              | monorepo `divelog`                                     | maintainers            | Apache-2.0 + NOTICE |
| **Personal log** (dives, people, trips, gear, profiles, computer exports, scans, private reference maps, site _overlays_ and _personal sites_) | one private repo per diver (`divelog-data` for Dennis) | the diver              | private             |
| **Site commons** (sites, regions, drawn maps, seed maps, CC photos)                                                                            | public repo `divelog-sites`                            | community, PR-reviewed | ODbL + CC BY-SA 4.0 |

One diver = one instance = one log repo + zero or one commons checkout. Multi-user auth stays
a non-goal; say so in the README.

### 1.2 Monorepo layout

```
divelog/                         pnpm workspace + uv workspace
  packages/server/               python: divelog_server (was backend/app), CLI, tests, Dockerfile
    divelog_server/{api,core,importers,schemas,services,store,cli}
  packages/kit/                  npm @divelog/kit (svelte-package), subpath exports:
    src/lib/core/                  "./core"    pure TS: types (generated), sitemap ops, filter, stats/charts/list/
                                               timeline/profile view logic, format, map (globe/locator/viewport/world)
    src/lib/components/            "."         dive, map, admin components + OwnerBar, Toast, anim helpers
    src/lib/routes/                "./routes"  page components + route tables (public, admin) + DivePage/AdminPage
    src/lib/server/                "./server"  createDivelog, loaders, handleDivelog, seo, sitemap entries
    src/lib/og/                    "./og"      OG card SVG + resvg render (optional peer dep)
    src/lib/widgets/               "./widgets" DiveTile + loadDiveSummary for home pages
    src/lib/styles/                "./styles/*" tokens.css (--dl-*), divelog.css (.dl-* classes), maplibre.css
  apps/reference/                minimal SvelteKit app mounting the kit; dev playground; e2e target; standalone image
  schema/v1/                     JSON Schema exported from pydantic (CI artefact)
  docs/                          FORMAT.md, DEPLOY.md, CONTRIBUTING.md
```

One npm package, not two: the core stays in its own directory with its own coverage, but a
second published package only adds release coordination. PyPI is a by-product, the GHCR image
is the deliverable. A compatibility contract (`format` for data, `api` for the server, `kit`
for the package) is published by `GET /api/v1/version`; the kit refuses a major mismatch.

### 1.3 Data organisation

**Manifest** `divelog.yaml` at the root of every repo:

```yaml
format: 1
kind: log # log | sites
sources: # log only
  - kind: commons
    name: divelog-sites
    ref: 3f0c1a2 # commit the instance was last validated against (pinning; reproducible deploys)
```

**Site record split** (`SiteRecord` → `SiteCore` + overlay fields):

| Commons (`SiteCore`, public)                                                                                                                                                                                                                          | Personal overlay (log repo)                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `site_id, name, full_name, short_name, aliases, region, country, area, system, type, water, halocline, halocline_m, lat, lon, access, section_vocabulary, summary, sources, default_map, maps, media (CC), geo_source, verified, location_visibility` | `notes, prices, reference_maps, subsurface_uuid, default_map` (preference), `summary_override`, extra `maps` (personal `-p` ids), extra `media` (own photos), personal body text |

Corrections to the first instinct: `verified` and `geo_source` are **provenance**, which ODbL
attribution and commons CI depend on, so they become public (today `site_out` in
`backend/app/services/dives.py:337` hides them behind `owner`). `location_visibility` is a
property of the commons record; a sensitive site is either hidden there or not submitted.

**Three site origins**, resolved per `site_id` by the store:

1. `log` — full personal record in `log/sites/<id>.md` (today's file, no `extends`). Personal-only site.
2. `commons` — commons record merged with an optional overlay `log/sites/<id>.md` carrying `extends: commons`.
3. `fork` — full personal record that shadows a commons id, with `forked_from: commons@<sha>`. Reported as status, not error.

Overlay files keep today's path and filename so `git log sites/fra-ressel.md` stays continuous.

**Merge rules** (`merge_site(base, overlay)`): overlay fields replace; `maps`, `media`,
`aliases` concatenate; body = overlay body if non-empty, and the commons body is kept
separately (`body_html` vs `body_html_commons`) so a page can show "About this site" and "My
dives here". Objective fields are never overridden by an overlay; that is what a fork is for.

**Ids**: sites `^[a-z]{3}-[a-z0-9-]+$` (already true), never deleted in the commons
(`redirects.yaml` old → new). Commons maps `<site>-<n>`, personal maps `<site>-p<n>`,
copies carry `copied_from: <id>@<rev>`. Uniqueness comes from the namespace, not a registry.

**Annotations**: `DiveMapAnnotation {map_id, revision, route[{from,to}], …}` keeps pinning
`revision`; routes reference node ids. Commons CI enforces node-id stability (removed ids must
be listed as `retired_nodes`, renames as `renamed_nodes`, with a `revision` bump). The instance
exposes `annotation_stale` read-time instead of only cleaning on save (`clean_annotation`,
`dives.py:723`).

### 1.4 Backend organisation (`store/`)

```
files.py      unchanged
git.py        GitRepo + readonly=True (pull only)
models.py     SiteCore, SiteOverlayRecord, SiteRecord(SiteCore + overlay fields), forked_from, retired/renamed_nodes
loader.py     the generic _load_markdown/_load_json_list/_validate/errors from today's Store
sources.py    SiteSource protocol {name, root, writable, sites, regions, maps, seed_maps, load(), public_file(), head()}
              CommonsSource (read-only checkout), LogSiteSource (sites/regions/maps in the log repo)
log_repo.py   LogRepo: dives, people, trips, gear, imports, profiles, reference maps, overlays
store.py      Store(log, commons=None): merged read view, indexes (+ site_origin, map_origin, dangling_sites), write policy
overlay.py    merge_site / split_site
```

**Write policy**

| Operation                                                               | origin `log`                            | origin `commons`                                                                       | origin `fork`                       |
| ----------------------------------------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------- |
| PUT site, objective fields                                              | write log file                          | 422 "commons site; fork to edit"; `?fork=true` writes a full record with `forked_from` | write fork                          |
| overlay fields / PATCH (`default_map`, `prices`, `location_visibility`) | log file                                | write overlay                                                                          | fork                                |
| DELETE site                                                             | as today (409 while dives reference it) | removes overlay only                                                                   | removes fork, falls back to commons |
| POST map                                                                | `<site>-<n>`                            | `<site>-p<n>` in log repo                                                              | `-p<n>`                             |
| PUT map                                                                 | as today                                | 422; UI offers "copy to a personal map"                                                | n/a                                 |
| site photo upload                                                       | log media                               | overlay `media`                                                                        | fork                                |

Dives are untouched: `apply_dive_in` (`dives.py:794`) checks `site_id in store.sites`, which is
the merged view, so adopting a commons site is just selecting it.

**Media and files**: `MediaRef.key` gains a `commons:` prefix next to `repo:`; `media_url()`
maps it to `/media/commons/<path>`, served by a second route over the commons source with
`ETag` from `head()`. Variants for commons photos are generated lazily into `STATE_DIR/variants/`
with the existing `process_image`. `maps/reference` stays log-only. Tiles stay an instance
concern (`/media/tiles`, built from the merged placed sites that have dives or are personal).

**Config**: `SITE_NAME`, `OWNER_NAME`, `HOME_COUNTRIES`, mail subject/greeting, `COMMONS_ROOT`
(optional), `COMMONS_GIT_ENABLED`; `RepoStatus` gains `commons_head/commons_state`; pull
pulls both.

**Markdown** rendered server-side (`markdown-it-py`, `html=False`, then `nh3.clean`) into
`*_html` siblings of every `*_md` field, so the kit needs no markdown library and non-Svelte
consumers get HTML. `_md` stays for editors.

**Types**: OpenAPI always on; `openapi-typescript` generates `api.d.ts`; the hand-mirrored
`src/lib/dive/types.ts` (521 lines) becomes a file of aliases.

### 1.5 Frontend organisation (kit)

**Config and URLs**: one `DivelogConfig {basePath, adminPath, apiBase, mediaBase, tilesBase,
siteName, ownerName, siteUrl, presets?}` and a pure `createUrls(config)` with `dive(n)`,
`site(slug)`, `trip`, `person`, `region`, `gear(hash?)`, `filter(params)`, `admin.*`.
Pure so loaders, `stats-view.ts`, seo and sitemap use it; components read it from Svelte
context via `DivelogProvider` / `getDivelog()`. The admin `adminJson` client is built from
`apiBase`. Personal presets (`DIVE_TAGS`, `CYLINDER_PRESETS`, `STANDARD_GASES`) become
defaults overridable through `presets`.

**Theme contract**: `styles/tokens.css` defines `--dl-*` under `:where(.divelog)` with
fallbacks to the consumer's names (`--dl-color-bg: var(--color-bg, #071426)` for the ~25
tokens in `src/lib/styles/theme.css`). Components use only `--dl-*`. Utility classes become
`.dl-btn .dl-card .dl-num .dl-kicker .dl-container .dl-detail .dl-tag .dl-prose .dl-visually-hidden`
in `styles/divelog.css`, plus the admin form/table rules now in `admin/+layout.svelte`.
Also defines the two tokens referenced but missing today (`--font-sans`, `--radius-md`).

**Mount pattern**: two catch-all routes in the consumer, each two files:

```ts
// src/routes/dive/[...path]/+page.server.ts
export const load = (event) => divePublicLoad(divelog, event.params.path, event);
// src/routes/dive/[...path]/+page.svelte   → <DivePage {data} />  (+ snapshot for the globe view)
// src/routes/dive/+layout.svelte            → <DivelogProvider {config}><DiveNav />{@render children()}</DivelogProvider>
// src/routes/admin/[...path]/…              → adminLoad / <AdminPage {data} />, explicit admin/login page
// src/routes/dive/og/[kind]/[id].png/+server.ts → diveOg(...)   (rest routes swallow og.png, so explicit)
```

The kit holds an ordered route table `{pattern, load, component, meta}` for `''`, `(\d+)`,
`sites`, `sites/[slug]`, `regions/[id]`, `trips`, `trips/[slug]`, `people`, `people/[slug]`,
`gear`, and the `/sites/[slug]/map` redirect. Every page component is also exported so a
consumer can eject one route by adding a more specific SvelteKit route.

**Server helpers**: `createDivelog({backendUrl, config})`, `handleDivelog` (owner resolution
via `/auth/me`, admin gate, noindex, `private, no-store`; lifted from `src/hooks.server.ts`),
`diveSitemapEntries`, `diveMetaFor`, `diveOgImageFor`, `loadDiveSummary` for the home tile.

**What stays in the personal site**: blog, home, contact, descent/fish animations, Umami,
CSP, Cap, the two catch-all mounts, the OG route, the home `DiveTile` from `./widgets`, blog
components with their own `formatDate` (they import it from `$lib/dive/format` today).

### 1.6 The site-sharing system

**Commons repo** `divelog-sites`:

```
divelog.yaml  LICENSE.md (ODbL + CC BY-SA layer)  CONTRIBUTING.md  README.md  redirects.yaml
sites/<iso3>-<slug>.md   regions/<id>.md   maps/drawn/<id>.json   maps/seed/<id>.{json,svg}
media/sites/<id>.jpg     media/manifest.json (source, page, author, licence, public)
.github/workflows/validate.yml
```

`validate.yml` runs `uvx divelog-server validate --kind sites .` (the pydantic models are the
one source of truth) plus: id regex and uniqueness, no `-p\d+$` map ids, references resolve;
provenance (`lat/lon` ⇒ `geo_source`, `sources` non-empty for long bodies); licence
(`manifest.json` allowlist, `public: true`, no `reference:` refs, no `notes/prices/reference_maps`
keys); editorial lint (first-person word list in `summary` and body → fail); node-id stability
and `revision` bump on map changes; PNG render of changed maps as a run artefact.
Contribution flow: fork + PR, DCO sign-off, no CLA.

**Instance features** (Phase D): `SiteOut.origin` and `attribution`; attribution line on every
site page and map (a licence obligation: "Site data © divelog-sites contributors (ODbL),
descriptions CC BY-SA 4.0, map data © OpenStreetMap contributors"); public lists filter to
`dives > 0 or origin != commons`; "adopt a site" search over the commons in the new-site
dialog (`GET /admin/commons/sites?q=&near=`); Subsurface importer matches commons sites
(name/alias, else within 300 m) before creating personal ones; stale-annotation notice;
commons pull in the admin bar with the manifest pin updated.

**Proposing** is a CLI, not a server feature: `divelog sites propose <id>` copies the personal
site, its `-p` maps (renumbered) and eligible photos into a branch of the commons checkout,
strips overlay fields, runs the validator and prints the `gh pr create` command;
`divelog sites adopt <id>` converts the local record into an overlay after merge. No export
endpoint, no GitHub API from the admin UI.

**What may not enter the commons**: `maps/reference` (third-party), stick maps traced from
copyrighted surveys (cave-ha, QRSS; 30 of 203 drawn maps are stick maps and need a per-map
rights decision; OSM-derived site maps are fine under ODbL), text copied from duikersgids.nl
or scubadiving.place (cited as sources in ~19 site files; citing is fine, copying is not),
first-person prose (42 of 210 bodies, some summaries such as fra-ressel's "most-dived cave in
the log"), and `nld-clipper-anna` (region-only) unless hidden on the commons record.

### 1.7 Scripts

Site tooling becomes CLI subcommands in the server package: `build_tiles.py` → `divelog tiles`,
`osm_sitemap.py` → `divelog sitemap-osm`, `trace_stickmap.py` → `divelog stickmap`,
`fetch_site_media.py` / `upload_media.py` → `divelog media fetch|upload`, `add_access_points.py`
→ `divelog sites access`, plus `validate`, `schema export`, `sites split|propose|adopt`,
`migrate`. The workbook one-offs (`fill_*`, `fix_*`, `export_divelog.py`, `link_*`, …) and
`fetch_reference_maps.py` stay with the personal data, never in the module.

---

## Part 2 — Phases

| Phase       | What                                                                                                                                                                                                                             | Result                                                                                                                     |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **A** (now) | Decouple in place in this repo                                                                                                                                                                                                   | Same site, same data, but every seam of 1.4 and 1.5 exists and is tested; a `COMMONS_ROOT` can be pointed at a second repo |
| B           | Split the data: `divelog sites split` writes 210 commons cores to `../divelog-sites` and rewrites the log files as overlays; editorial pass on 42+ bodies; map rights pass; manifests; delete duplicated media-store site photos | Public API golden diff identical except additive keys; overlay edits commit to `divelog-data`                              |
| C           | Extract to the monorepo (`backend/app` → `divelog_server`, `src/lib/divelog` → kit), reference app, CI, images, CLI; personal site consumes `@divelog/kit` + the server image                                                    | Reference app e2e smoke; personal site passes its gates; `publint` clean                                                   |
| D           | Sharing: commons repo + CI, origin/attribution UI, listing filters, adopt-a-site, importer matching, propose/adopt CLI, commons pull + pin                                                                                       | A deliberately bad PR fails CI; adopt → dive → annotation on a commons map round-trips                                     |

---

## Part 3 — Phase A in detail (to execute)

Rule for every item: behaviour and URLs stay identical; `make ci` (backend ruff + mypy strict

- pytest, frontend lint zero warnings + check + vitest ≥70% + build) stays green after each.

Record a **golden snapshot** first (A0): dump every public endpoint (`/stats`, `/summary`,
`/timeline`, `/dives`, `/dives/{n}` for a few, `/sites`, `/sites/{slug}`, `/regions`,
`/regions/{id}`, `/trips`, `/people`, `/gear`) to the scratchpad, signed-out and signed-in,
and diff after each backend item; only additive keys allowed.

### A1 — Backend config and branding

- `backend/app/core/config.py`: add `SITE_NAME`, `OWNER_NAME`, `HOME_COUNTRIES` (default `NLD,DEU,BEL`), `MAIL_SUBJECT`, `MAIL_GREETING`, `COMMONS_ROOT=""`, `COMMONS_GIT_ENABLED=False`.
- Replace literals: `backend/app/main.py:31` (title), `backend/app/services/auth.py:70-71` ("Sign in to dennisbakhuis.nl", "Hi Dennis"), `backend/app/store/trips.py` `HOME_COUNTRIES` → parameter threaded from settings into `derive_trips`.
- Verify: `grep -rn "Dennis\|dennisbakhuis" backend/app` shows only config defaults; pytest green; `.env.example` and `docker-compose.yml` document the new vars.

### A2 — Site record split, public provenance, server-side markdown

- `backend/app/store/models.py`: `SiteCore` (commons fields incl. `verified`, `geo_source`, `location_visibility`), overlay fields, `SiteRecord(SiteCore, overlay)`, `SiteOverlayRecord` (`site_id`, `extends: Literal["commons"]`, overlay fields, body), `forked_from`, `SiteMapRecord.retired_nodes/renamed_nodes`.
- `backend/app/schemas/dive.py` + `services/dives.py site_out`: `verified`, `geo_source` move from `SitePrivate` to `SiteOut`; `SitePrivate` keeps `notes`, `reference_maps`; add `origin: "log"` placeholder and `attribution: null`.
- `backend/app/services/markdown.py`: `render(md) -> str` with `markdown-it-py` (`html=False`) + `nh3.clean`; add `body_html`/`description_html`/`bio_html`/`notes_html` siblings on every Out model that has a `_md` body (dive, site, region, trip, person, gear). Match the escaping property of `src/lib/markdown.ts renderMarkdown`.
- Tests: sanitiser (script tag, `javascript:` href, raw HTML), new fields present, golden diff additive only. Update `backend/tests/test_private_fields.py` for the provenance move.

### A3 — Store split: LogRepo + SiteSource + merged Store

- Create `store/loader.py`, `store/sources.py` (`SiteSource` protocol, `LogSiteSource`, `CommonsSource` with `GitRepo(readonly=True)`), `store/log_repo.py`, `store/overlay.py` (`merge_site`, `split_site`), rewrite `store/store.py` as `Store(log, commons=None)` keeping today's public attribute names (`dives`, `sites`, `maps`, `dives_by_site`, `maps_by_site`, …) so `services/*` and `api/*` keep working; add `site_origin`, `map_origin`, `dangling_sites`, status entries for shadowing.
- Write policy per 1.4 in `backend/app/api/v1/admin.py` (site PUT/PATCH/DELETE, map POST id `-p<n>` via the existing `while map_id in store.maps` loop at `admin.py:423`, map PUT 422 for commons ids, site attachments to overlay); `save_site` routes to log file / overlay / fork.
- `services/dives.py`: `annotation_stale` + `annotation_dropped_legs` in `dive_out`; `map_ref` resolves `drawn:` across both sources, `reference:` only against the log.
- `services/storage.py media_url` + `api/v1/media.py`: `commons:` prefix → `/media/commons/{path}` over `PUBLIC_REPO_DIRS`, ETag from `source.head()`, lazy variants in `STATE_DIR/variants/`.
- `RepoStatus` gains `commons_head`, `commons_state`; `admin_repo_pull`/`reload` cover both; `core/deps.py get_store()` builds the composed store from settings.
- Fixtures: `backend/tests/fixtures/commons/` (one site, one region, one drawn map, one photo + manifest, `divelog.yaml`); tests for merge, overlay write/delete, fork, shadow status, dangling site, `-p` ids, 422 paths, `/media/commons`, variant cache, stale annotation. Target ≥110 tests. Golden diff unchanged with `COMMONS_ROOT` unset.

### A4 — Generated API types

- `backend/app/main.py`: `openapi_url` always on. `package.json` script `types`: `openapi-typescript http://localhost:8300/api/openapi.json -o src/lib/dive/api.d.ts`; `src/lib/dive/types.ts` becomes `export type Site = components['schemas']['SiteOut']` aliases (component imports unchanged). `sitemap.ts` types stay hand-written where they add behaviour.
- Verify: `pnpm check` clean; generated file committed; CI step diff-checks it (`make types-check`).

### A5 — Frontend config and URL seam

- `src/lib/dive/config.ts`: `DivelogConfig`, `DEFAULT_CONFIG`, `createUrls`; `src/lib/dive/context.ts`: `setDivelog`/`getDivelog`; `DivelogProvider.svelte`.
- Sweep hard-coded paths (the checklist from exploration): `src/lib/dive/stats-view.ts` (`headlineTiles/notableTiles/recordTiles` take `urls`), `src/lib/map/locator.ts` (`TILES_BASE` → parameter), `src/lib/admin/client.ts` (`apiBase`), `src/lib/admin/dive-input.ts` (presets from config), components `DiveNav`, `DiveTable`, `DiveGlobe`, `WorldMap`, `SiteLocatorMap`, `MapPanel`, `DiveFacts`, `DiveForm`, `Attachments`, home `DiveTile`, `Hero`, `src/lib/seo.ts` (dive entries via `diveMetaFor(urls)`), `sitemap.xml` via `diveSitemapEntries`.
- Providers mounted in `src/routes/dive/+layout.svelte` and `src/routes/admin/+layout.svelte`.
- Verify: `grep -rn "'/dive\|'/admin\|/api/v1\|/media/" src/lib/{dive,map,admin,components/{dive,map,admin}}` is empty; vitest green; every URL in `docs/WORKFLOW.md` §2 still answers 200/303.

### A6 — Theme contract and shared helpers

- `src/lib/styles/divelog-tokens.css` (`--dl-*` with `var(--color-*, fallback)`), `src/lib/styles/divelog.css` (`.dl-*` classes + the admin `:global` form rules lifted from `src/routes/admin/+layout.svelte`), imported after `theme.css` in `src/routes/+layout.svelte`. Components in the dive/map/admin trees use only `--dl-*` and `.dl-*`; define `--font-sans` and `--radius-md`.
- Move into `src/lib/divelog/` (the future kit tree): `anim/{counter,inview,reveal,motion}`, `components/OwnerBar.svelte`, `components/Toast.svelte`, `stores/toast.svelte.ts`; the site imports them from there. Dive pages render `{@html body_html}` and drop `Markdown.svelte`; blog components get `src/lib/format.ts` for `formatDate`.
- Verify: `pnpm lint` zero warnings; visual pass in Chrome of every public and editor page from WORKFLOW §2 (fake visibility for anim, see memory note); dark and light.

### A7 — Route tables and catch-all mounts

- `src/lib/divelog/routes/{public,admin}.ts` route tables (`pattern, load, component, meta`), `DivePage.svelte`, `AdminPage.svelte`, loaders that take `(divelog, path, event)`; `src/lib/divelog/server/{index,handle,seo,sitemap}.ts` with `createDivelog`, `divePublicLoad`, `adminLoad`, `handleDivelog` (lifted from `src/hooks.server.ts:22-51,65-70`, composed with `sequence()`), `diveSitemapEntries`, `diveMetaFor`, `diveOgImageFor`; OG moved to `src/routes/dive/og/[kind]/[id].png/+server.ts` using `src/lib/server/og/*` (fonts read via `import.meta.url`).
- Replace `src/routes/dive/**` and `src/routes/admin/**` with the two catch-alls, the explicit `admin/login`, and the OG route; `/dive/sites/[slug]/map` redirect and old `og.png` paths become 301 table entries.
- Verify: curl every WORKFLOW §2 URL (same status as before), `sitemap.xml` paths unchanged, OG PNGs render, the globe snapshot restores on back-navigation, admin login redirect loop test, `pnpm build` and `pnpm preview` OK.

### Execution with Opus subagents

Dependency order: A0 → A1 → A2 → A3 → A4; A5 → A6 → A7. The two chains are independent until
A4 (generated types) lands, so run **A1–A3 (backend chain)** and **A5 (frontend seam)** in
parallel, then A4, then A6, then A7. Each subagent gets: the relevant 1.x section of this plan,
the file list above, the verification commands, and the rule "no behaviour change, golden diff
additive only". The orchestrator reviews each diff, runs `make ci`, and commits one item per
commit (author Dennis only, no AI trailers per `~/.claude/CLAUDE.md`).

---

## Verification (end of Phase A)

1. `make ci` green; backend ≥110 tests; frontend coverage ≥70%.
2. Golden API diff: every public endpoint identical to A0 except additive keys (`*_html`, `origin`, `attribution`, `annotation_stale`, `verified`/`geo_source` now public).
3. Point `COMMONS_ROOT` at `backend/tests/fixtures/commons` in dev: the fixture site appears with `origin: commons`, an overlay edit lands in `divelog-data`, a PUT on its objective fields returns 422, `?fork=true` writes a fork, `/media/commons/...` serves the photo with an ETag.
4. Grep gates: no branding literals in `backend/app` outside config defaults; no hard-coded `/dive`, `/admin`, `/api/v1`, `/media` strings under the dive, map and admin trees.
5. Browser pass (Chrome automation, dev server on :5373): `/`, `/dive`, a dive with a route, `/dive/sites`, a site with maps, a region, trips, people, gear, `/admin` list, dive editor, site editor, map editor, import page.

## Risks and notes

- Catch-all routes lose per-page `$types` and need the OG route outside the rest parameter; proven in A7 before packaging so the pattern is validated on the real site first.
- `svelte-package` constraints for Phase C (`$env` not allowed, no `?inline`, resvg native): A5–A7 already avoid them (`createDivelog({backendUrl})`, fonts via `import.meta.url`).
- Phase B's editorial pass (42 bodies, 30 stick-map rights decisions) is the real schedule risk; the overlay mechanism lets a site stay personal until its text is clean, so the commons can grow file by file.
- `docs/SPEC.md` §2, §9, §10 still describe Postgres; update the spec alongside Phase A to describe the layered store so the design contract matches the code.
