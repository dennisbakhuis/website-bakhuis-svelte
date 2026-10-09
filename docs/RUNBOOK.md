# Runbook — the dive log

The dive log is a directory of files: the private **divelog-data** repository. The backend loads
it into memory, serves it, and writes every admin edit back as one git commit. Postgres is gone.

```
divelog-data/
  dives/00457.md            one dive: YAML frontmatter + the story as Markdown
  sites/<site_id>.md        one site: frontmatter (coordinates, type, prices, maps…) + prose
  regions/<region>.md       shared context for a group of sites
  people/<first_last>.md    one buddy; surname, e-mail and notes are owner-only
  profiles/*.json           dive-computer samples (columnar)
  computer/records.json     computer dives without a matching profile
  maps/seed/*.{json,svg}    hand-drawn schematics — ours, publishable
  maps/drawn/<id>.json      maps made in the site editor — ours, publishable
  maps/reference/           third-party maps — NEVER public, served only to the owner
  media/sites/*.jpg         CC-licensed site photos (credits in media/manifest.json)
  imports/*.json            what each dive-computer import did
  archive/divelog_index.xlsx the retired workbook
```

Binary media (photos, logbook scans, avatars) is **not** in git: it lives in the media store —
`MEDIA_DIR` on disk in dev, S3 in prod — and each record's `media:` list points at it by key.

## Everyday

The rule (see `docs/WORKFLOW.md`): every thing in the log has one public page and one editor
page. Signed in, every public page shows a dashed owner bar with **Edit …**; every editor has
**View ↗** back. The admin nav is Dives · Sites · People · Trips · Gear · Import.

**Add a dive.** _+ New dive_ (top right of every admin page), or drop the Perdix XML on
`/admin/import` and finish the draft. _Copy last dive_ pre-fills site, trip, people and kit.
Site, trip and person can be created from inside the form (_+ New site_, _+ New trip_,
_New person_). The sticky bar at the bottom saves; leaving with unsaved changes asks first.
Photos, scans and exports are added after the first save. One file appears under `dives/`
and one commit lands in the data repo.

**Sites, people, trips, regions.** Lists under `/admin/sites`, `/admin/people`,
`/admin/trips`, `/admin/regions`; each record has its own editor page. A person can be deleted
once no dive names them; a trip editor creates or removes the override file
(`trips/<slug>.md`) over the trip derived from the dive dates. A person's file is
`first_last.md`; the public URL uses only the first name (or alias), never the surname.

**Draw a map.** Site editor → _Open map editor_ (`/admin/sites/<id>/maps`), or _Maps_ in the
owner bar of the site page. Stick maps take survey shots (distance / bearing / depth); site maps
take shorelines, depth contours, dive paths and objects. Trace over a reference map or an
uploaded map — the underlay is never published. The star on this page is the only place the
map _shown first_ is set.

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
cd backend; uv run pytest             # 188 tests on tests/fixtures/{data,commons}
pnpm check; pnpm lint; pnpm test      # frontend gates
```

Production mounts a clone of divelog-data at `DATA_ROOT`, a deploy key at `GIT_SSH_KEY_PATH`,
`STATE_DIR` for sessions, and sets `GIT_ENABLED=true`. Run one uvicorn worker: the store is
in-process.

### Two repositories

`COMMONS_ROOT` (optional) points at a read-only checkout of a shared site repository
(`divelog-sites`: `sites/`, `regions/`, `maps/drawn/`, `maps/seed/`, `media/`, a `divelog.yaml`
with `kind: sites`). Unset, the log is the only source and nothing changes. Set, every site id
resolves to one **origin**: `log` (a full record in `divelog-data/sites/<id>.md`, personal only),
`commons` (the commons record with an optional **overlay**), or `fork` (a full log record that
shadows a commons id, reported under `notices` in `/api/v1/admin/repo/status`, not as an error).
An overlay keeps the usual path `sites/<id>.md` but starts with `extends: commons` and carries
only personal material: `notes`, `prices`, `reference_maps`, `subsurface_uuid`,
`summary_override`, a preferred `default_map`, extra `aliases`/`maps`/`media`, and the personal
body (the commons body stays available as `body_md_commons`). Editing an objective field of a
commons site answers 422 "commons site; fork to edit"; `PUT …?fork=true` writes a fork with
`forked_from: commons@<sha>`. Deleting a commons site removes its overlay; deleting a fork falls
back to the commons record. New maps on commons or forked sites get personal ids `<site>-p<n>`;
commons maps cannot be edited. Commons photos (`commons:` keys) are served from
`/media/commons/…`, their WebP variants rendered once into `STATE_DIR/variants/`. Pull and
reload in the admin cover both repositories (`COMMONS_GIT_ENABLED=true` lets pull fetch the
commons; it is never committed to). Tests: `backend/tests/fixtures/commons`.

## One-off scripts

- `scripts/export_divelog.py` — the original workbook → files export (kept for reference).
- `scripts/upload_media.py` — push scans and site images into the media store and record them.
- `scripts/build_tiles.py` — cut the basemap tiles behind every site's locator map (below).
- `scripts/trace_stickmap.py` — turn a scanned cave map into a drawn stick map (below).
- `scripts/osm_sitemap.py` — starter site map from OpenStreetMap, check, render, merge, recentre, push (below).

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
maps, a QRSS survey, a hand sketch) with `scripts/trace_stickmap.py`. The trace file records
every station, T, jump and line end in _image pixels_, plus the scale bar and the entrance;
the tool converts that into the site-map JSON (metres, entrance at the origin, north up) and
draws it back over the source so a misplaced point is obvious.

```fish
set tool "uv run --project backend python scripts/trace_stickmap.py"
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
site's own dive map with `trace_stickmap.py` and merged in.

```fish
set tool "uv run --project backend python scripts/osm_sitemap.py"
$tool fetch nld-bussloo --out work/nld-bussloo --radius 500   # starter map + raw OSM extract (cached)
$tool check work/nld-bussloo/map.json                          # schema + loose ends
$tool render work/nld-bussloo/map.json work/bussloo.png        # look at it
$tool merge map.json traced.json out.json                      # add traced content
$tool recentre out.json out2.json                              # origin into the drawing when the site point is off
$tool push out2.json --site nld-bussloo --cookies cj.txt       # save, set default_map (--map-id to replace)
```

The work files behind every map drawn in September 2026 (traces, scripts, source images, the
list of data problems found) are in the data repo under `maps/traces/`.
