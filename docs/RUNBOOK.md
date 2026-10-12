# Runbook — the dive log

The dive log is a directory of files: the private **divelog-data** repository. The backend loads
it into memory, serves it, and writes every admin edit back as one git commit. The file format is
[FORMAT.md](../../divelog/docs/FORMAT.md) in the divelog repo; this checkout holds:

```
divelog-data/
  divelog.yaml              manifest: format, kind, the commons it layers on
  dives/00457.md            one dive: YAML frontmatter + the story as Markdown
  sites/<site_id>.md        one site: frontmatter (coordinates, type, prices, maps…) + prose
  regions/<region>.md       shared context for a group of sites
  people/<first_last>.md    one buddy; surname, e-mail and notes are owner-only
  gear/{items,setups}.json  equipment and named setups
  profiles/*.json           dive-computer samples (columnar)
  computer/records.json     computer dives without a matching profile
  maps/seed/*.{json,svg}    hand-drawn schematics — ours, publishable
  maps/drawn/<id>.json      maps made in the site editor — ours, publishable
  maps/reference/           third-party maps — NEVER public, served only to the owner
  maps/traces/              work files behind the drawn maps
  media/sites/*.jpg         CC-licensed site photos (credits in media/manifest.json)
  imports/*.json            what each dive-computer import did
  archive/divelog_index.xlsx the retired workbook
```

Binary media (photos, logbook scans, avatars) is **not** in git: it lives in the media store —
`MEDIA_DIR` on disk in dev, S3 in prod — and each record's `media:` list points at it by key.

## Everyday

The rule: every thing in the log has one public page and one editor
page. Signed in, every public page shows a dashed owner bar with **Edit …**; every editor has
**View ↗** back. The admin nav is Dives · Sites · People · Trips · Gear · Import.

**Add a dive.** _+ New dive_ (admin bar, or the owner bar of any public page; _Log a dive
here_ on a site page prefills the site), or drop the Perdix XML on `/admin/import` (a dry run
shows what will happen) and finish the draft. On the form: _Same as previous dive_ fills site,
buddies, tanks and trip from the previous dive; type depth, duration and time in (time out fills
the duration); Ctrl/⌘-S or _Save_ in the bar at the bottom. Missing depth or duration is marked
on the field, nothing is sent. Water temperature, surface interval and trip fill themselves and
say so. A new site is made from the site picker's _+ New site_ (name and a tap on the map), a
trip from _+ New trip_, a buddy with _Add person_. Photos picked before the first save upload
right after it. One file appears under `dives/` and one commit lands in the data repo.

**Sites, people, trips, regions.** Lists under `/admin/sites`, `/admin/people`,
`/admin/trips`, `/admin/regions`; each record has its own editor page. A person can be deleted
once no dive names them; a trip editor creates or removes the override file
(`trips/<slug>.md`) over the trip derived from the dive dates. A person's file is
`first_last.md`; the public URL uses only the first name (or alias), never the surname.

**Draw a map.** Site editor → _Maps_ tab (`/admin/sites/<id>/maps`), or _Create & draw a map_
when creating the site. _Start from OpenStreetMap_ gives a starter site map to correct;
nothing is stored until _Save map_. Stick maps take survey shots (distance / bearing / depth); site maps
take shorelines, depth contours, dive paths and objects. Trace over a reference map or an
uploaded map, or over the locator map itself — the underlay is never published. The _shown
first_ radio on this page is the only place the map shown first is set.

**Mark what a dive did on a map.** In the dive editor, _On the map_ (or _Mark route_ in the
owner bar of the dive page) picks one of the site's drawn maps. Click the stations you reached
in the order you swam them: the line in between fills in along the shortest way, so a few
clicks cover a whole dive, and clicking the entrance again brings the route back the same way
(a leg swum twice counts twice and gets an arrow each way). _Back_ takes the last click away,
_Turned here_ sets the turn point at the route's end, and note pins carry short remarks. On a
site map (lake, wreck) the route is a free track instead: click along the way you swam, objects
included. No drawn map yet? _Draw a map ↗_ opens the map editor in a new tab and _↻ Refresh
maps_ picks it up without leaving the form. The dive page draws the way in red and the way out
green, dashed green over red where both used the same line, with direction arrows; the site page
overlays every logged route on the map, with a chip per dive to show one at a time.

**Edit files by hand.** Edit in your checkout, commit, push; then _pull_ in the admin bar (or
`make data-pull`). The store reloads in under a second. A file that fails validation is reported in
the admin bar as a file error and skipped; the rest keeps serving.

**Who sees what.** Signed in, every public page shows the owner view: surnames and e-mails,
transcription notes, logbook scans, reference maps, provenance. Signed out, none of that leaves the
server, and responses carry `Cache-Control: public`. Anything with `public: false` in a `media:`
list or under `maps/reference/` is refused on the public paths.

## Backups and restore

The data repo _is_ the backup: `git log dives/00457.md` is the history of a dive, and
`git checkout <sha> -- dives/00457.md` restores it. Pushes happen after every admin write; the admin
bar shows `unpushed` when the remote is unreachable and `conflict` when a rebase failed — resolve
that in the checkout and _pull_.

Media: bucket versioning in prod; in dev it is just a directory.

## Running it

```fish
make run                              # backend + Mailpit in Docker, SvelteKit on :5373
make data-status                      # git status of the data checkout
make ci                               # lint, format, svelte-check, vitest + coverage, build
```

### Five checkouts

This repository is the personal site only. The dive log itself is two packages in the divelog
monorepo, the data is two git repositories and the blog's code is the blog repository; all five
are sibling checkouts:

| Checkout                 | What                                                                            |
| ------------------------ | ------------------------------------------------------------------------------- |
| `website-bakhuis-svelte` | this site: home, blog, contact, the personal config of the log                  |
| `../divelog`             | monorepo: `packages/kit` (`@divelog/kit`), `packages/server` (`divelog-server`) |
| `../divelog-data`        | the log (`DATA_REPO`), mounted at `/data/repo`                                  |
| `../divelog-sites`       | the sites commons (`COMMONS_REPO`), mounted read-only at `/data/commons`        |
| `../blog`                | `packages/kit` (`@blog/kit`): blog pages, feed, markdown pipeline; no server    |

**The kit** is consumed as a packed tarball, `vendor/divelog-kit-<version>.tgz`, referenced from
`package.json` as `file:vendor/…`. The committed tarball _is_ the pin until the kit is published
on npm. After changing the kit in the monorepo, `make kit-vendor` builds and packs it from
`$DIVELOG_DIR/packages/kit` (default `../divelog`), replaces the tarball and reinstalls;
`make kit-check` (local only, not in CI) fails when the tarball's version differs from the
monorepo's. Bump the kit's version when its contents change, or `kit-check` cannot tell. The
site sets everything personal in `src/lib/divelog-config.ts` (names, URL, title suffix, page
copy, the home tile's text); the kit's defaults are neutral.

**The blog kit** works the same way: `vendor/blog-kit-<version>.tgz`, `make blog-vendor` builds
and packs it from `$BLOG_DIR/packages/kit` (default `../blog`) and `make blog-check` compares the
versions. The posts stay in `src/content/{blog,til}`; `src/lib/blog.ts` globs them and hands them
to `createBlog`, `src/lib/blog-config.ts` holds the personal config (names, URL, copy, kinds),
and `svelte.config.js` passes the `[[dive:…]]` / `[[site:…]]` resolvers to `blogPreprocess`.
The `blog/`, `feed.xml` and `til/` routes are a few lines each around the kit's helpers.

**The server** is the `divelog-server` package. In dev, `docker-compose.yml` builds its `dev`
image from `${DIVELOG_SERVER_DIR:-../divelog/packages/server}` and mounts that source for
`--reload`; recreate after pulling the monorepo: `docker compose up -d --build backend`. The
package's defaults are generic, so compose sets this site's `SITE_NAME`, `OWNER_NAME`,
`OWNER_EMAIL`, `HOME_COUNTRIES`, mail templates, `SESSION_COOKIE_NAME`, sender, git author and
S3 region explicitly (each overridable from `.env`). Its tests run in the monorepo
(`cd ../divelog; uv run pytest packages/server`). Production runs the published image
`ghcr.io/<owner>/divelog-server:<tag>`; the deploy passes `DIVELOG_SERVER_TAG` (default `latest`)
next to the frontend tag.

**The `divelog` CLI** runs from this repository's uv project (`pyproject.toml`, `uv.lock`),
which installs the server package editable from the monorepo: `uv sync`, then
`uv run divelog …`. The CLI's `push` subcommands talk to `DIVELOG_API` (default
`http://localhost:8000`); for the dev stack, `set -x DIVELOG_API http://127.0.0.1:8300`.

Production mounts a clone of divelog-data at `DATA_ROOT`, a deploy key at `GIT_SSH_KEY_PATH`,
`STATE_DIR` for sessions, and sets `GIT_ENABLED=true`. Run one uvicorn worker: the store is
in-process.

### The commons

The log layers on the shared site commons (`../divelog-sites`): every site resolves to the origin
`log`, `commons` (with an optional overlay in `sites/<id>.md`) or `fork`
(`forked_from: commons@<revision>`). The format is in
[FORMAT.md](../../divelog/docs/FORMAT.md), the admin side (origin badges, stale chips, _Fork to
edit_, _Mark as reviewed_, _pull commons_) in [KIT.md](../../divelog/docs/KIT.md), and proposing
and adopting sites in [CONTRIBUTING.md](../../divelog/docs/CONTRIBUTING.md). Commons photos are
served from `/media/commons/…`, their WebP variants rendered once into `STATE_DIR/variants/`.

In dev, `docker-compose.yml` mounts `${COMMONS_REPO:-../divelog-sites}` read-only at
`/data/commons` and sets `COMMONS_ROOT=/data/commons`, next to `divelog-data` at `/data/repo`.
`COMMONS_GIT_ENABLED` stays `false` in dev, so the CLI does the pull. The log's `divelog.yaml`
names the commons (`path: ../divelog-sites`) and pins the commit it was validated against
(`ref`); outside compose the CLI finds the commons through that manifest. After changing
`COMMONS_REPO`, recreate the backend: `docker compose up -d --force-recreate backend`.

### Day to day with the commons

All commands run from this repository with the sibling checkouts `../divelog-data` and
`../divelog-sites`. For the CLI's `push` subcommands against the dev stack, set
`DIVELOG_API` first (above).

```fish
uv run divelog commons pull --log ../divelog-data --author "Dennis Bakhuis"   # pull, pin, list stale sites
uv run divelog sites status ../divelog-data            # origin, revision and pin; ends with "… 0 stale"
uv run divelog validate --kind log ../divelog-data
uv run divelog sites propose <site-id> --commons ../divelog-sites --log ../divelog-data --dry-run
uv run divelog sites adopt <site-id> --log ../divelog-data    # or --all, once the PR is merged and pulled
```

The backend picks up a new pin by itself; otherwise `make data-pull` or _pull_ reloads it. Review
a stale site in its editor (_Mark as reviewed against revision N_), or
`curl -b <cookies> -X POST http://localhost:8300/api/v1/admin/sites/<id>/pin`; in dev, commit
the rewritten `base_revision` in the data checkout yourself (`GIT_ENABLED=false`). Without
`--dry-run`, `propose` writes a branch `propose/<site-id>` in `../divelog-sites`: push it to your
fork of the commons and open a PR.

To change the commons itself (in `../divelog-sites`): edit, raise `revision` by one with a
changelog entry, then

```fish
uv run divelog validate --kind sites --base HEAD ../divelog-sites   # 0 errors; warnings are for the reviewer
uv run divelog maps changed --base HEAD --root ../divelog-sites
```

commit with `git commit -s`, and pull into the log as above.

## The CLI

The site tooling is the `divelog` CLI of the server package (`uv run divelog --help`):

- `divelog media upload` — push scans and site images into the media store and record them.
- `divelog media fetch` — free Wikimedia Commons photos per site.
- `divelog tiles` — cut the basemap tiles behind every site's locator map (below; `make tiles`).
- `divelog stickmap` — turn a scanned cave map into a drawn stick map (below).
- `divelog sitemap-osm` — starter site map from OpenStreetMap, check, render, merge, recentre, push (below).
- `divelog sites access` — add access points to sites; `divelog import shearwater-pnf` — decode
  Shearwater Cloud profiles.

## Locator maps

Every placed site shows an interactive map (MapLibre) drawn from self-hosted vector tiles, so no
visitor request leaves the site. The tiles are PMTiles archives cut from the daily Protomaps
planet build, one per cluster of sites, plus a single planet archive (`world.pmtiles`, z0–7,
~190 MB) behind the globe on `/dive`, and the fonts and sprites the style needs; they live in the
media store under `tiles/` and are served at `/media/tiles/` with byte-range requests.

```fish
brew install pmtiles
make tiles                            # rebuild changed clusters into $MEDIA_DIR/tiles
make tiles-upload                     # same, then push tiles/ to the S3 bucket
```

Run it after adding a site outside every existing cluster (the site page falls back to the SVG
globe until its archive exists; `/dive` shows the static SVG map until `world.pmtiles` is there).
Pass `--build YYYYMMDD` when the latest-build probe fails. Data © OpenStreetMap contributors
(ODbL), credited on every map.

## Cave stick maps from scanned maps

A cave site's drawn map is traced from a survey or line map (the cave-ha.com "cave lines"
maps, a QRSS survey, a hand sketch) with `divelog stickmap`. The trace file records
every station, T, jump and line end in _image pixels_, plus the scale bar and the entrance;
the tool converts that into the site-map JSON (metres, entrance at the origin, north up) and
draws it back over the source so a misplaced point is obvious.

```fish
set tool uv run divelog stickmap
$tool grid map.webp grid.png --zoom 2            # labelled pixel grid to read coordinates off
$tool grid map.webp detail.png --crop 560,180,660,260 --zoom 4
$tool build trace.json map.json                  # warns about loose nodes, odd Ts and ends
$tool overlay trace.json overlay.png --zoom 2    # check the fit, fix the trace, repeat
$tool push trace.json --cookies cj.txt           # save via the admin API, set default_map
```

Conventions: underlined numbers on a cave-ha map are depths, numbers at line ends are
penetration from the entrance (kept as the end node's label); a square dot is where a
permanent line ends, a gap between lines is a jump (nodes on both sides, edge style `jump`).
The map's `notes` credit the source map; the scan itself stays private in `maps/reference`.

## Open-water site maps from OpenStreetMap

A lake, shore or wreck site starts from what OpenStreetMap knows: `fetch` writes `osm.json` and a
starter `map.json` (shoreline, piers, buoys, wrecks, slipways, in metres around the site's
coordinates); the objects, entries, depths and routes are then added by hand or traced from the
site's own dive map with `divelog stickmap` and merged in.

```fish
set tool uv run divelog sitemap-osm
$tool fetch nld-bussloo --out work/nld-bussloo --radius 500   # starter map + raw OSM extract (cached)
$tool check work/nld-bussloo/map.json                          # schema + loose ends
$tool render work/nld-bussloo/map.json work/bussloo.png        # look at it
$tool merge map.json traced.json out.json                      # add traced content
$tool recentre out.json out2.json                              # origin into the drawing when the site point is off
$tool push out2.json --site nld-bussloo --cookies cj.txt       # save, set default_map (--map-id to replace)
```

The work files behind every map drawn in September 2026 (traces, scripts, source images, the
list of data problems found) are in the data repo under `maps/traces/`.
