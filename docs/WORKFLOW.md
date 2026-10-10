# Dive log — editing workflow

Written 2026-09-29 after a survey of every public page, every admin page and the backend.
This is the contract the redesign is built to; `docs/RUNBOOK.md` keeps the short "how do I"
version.

## 1. What was wrong

- **Two half-worlds.** Some editing lived under `/admin` (dives, sites, people, gear), some on
  public URLs behind an owner check (`/dive/sites/[slug]/map`), some inline on public pages
  (starring the default map on the site page). Trips, regions and gear had no editor entry point
  at all, although trips have public pages and the dive form has a trip field.
- **"Shown first" map settable in three places** (site form select, map-editor star, public site
  page star) with no single truth.
- **The route of a dive was a sub-editor inside a long form** with no unsaved-changes guard,
  while the site-map editor had one. Marking a route on a site without a drawn map sent you away
  from the half-filled dive form to draw a map, then back to re-select the site.
- **Creating a site from the dive form opened a new tab**, and the form did not see the new site
  until reload. Trips could not be created anywhere. People could not be deleted.
- **List pages doubled as editors** (`/admin/sites`, `/admin/people`: one form above a table,
  record chosen by `?site=` / `?person=`), so a record had no URL of its own and a half-typed
  new record was lost by clicking "edit" on a row.
- Owner links were inconsistent: a dashed bar on dive and site pages, a button inside the private
  block on the person page, nothing on trip, region and gear pages.

## 2. The rule

**Every thing in the log has one public page and one editor page.** The public page is where you
look; its owner bar has one primary "Edit" link to the editor. The editor is where you change
things; it links back with "View ↗". Nothing owner-only lives on a public URL. Sub-things are
edited from the editor of the thing they belong to: maps from the site editor, the route of a
dive from the dive editor, photos from the record they hang off.

```
public                     editor (owner only)
/dive                      /admin                     dives list, drafts, "+ New dive"
/dive/[number]             /admin/dives/[number]      (+ /admin/dives/new)
/dive/sites                /admin/sites               list, "+ New site"
/dive/sites/[slug]         /admin/sites/[id]          site form, photos, maps card
                           /admin/sites/[id]/maps     drawn-map editor (moved from /dive/sites/[slug]/map)
/dive/regions/[id]         /admin/regions/[id]        (+ /admin/regions/new) minimal
/dive/people               /admin/people              list, "+ New person"
/dive/people/[slug]        /admin/people/[id]         (+ /admin/people/new)
/dive/trips                /admin/trips               list: derived trips and overrides
/dive/trips/[slug]         /admin/trips/[slug]        name, dates, description
/dive/gear                 /admin/gear                unchanged
```

Admin nav: **Dives · Sites · People · Trips · Gear · Import**, with "+ New dive" as the primary
action on the right. Every editor page shows a breadcrumb (`Sites › Cenote Tortuga`) and a
"View ↗" link to the public page.

## 3. The owner bar

`src/lib/components/OwnerBar.svelte` renders the same dashed bar on every public page for the
owner: a primary edit link, optional secondary links, an optional note. Pages set `editHref` in
their `+page.server.ts`; the global header pill and footer link use the same value.

| public page           | primary            | secondary                                                |
| --------------------- | ------------------ | -------------------------------------------------------- |
| `/dive/[number]`      | Edit dive          | Mark route (when site has a drawn map and dive has none) |
| `/dive/sites/[slug]`  | Edit site          | Maps                                                     |
| `/dive/regions/[id]`  | Edit region        |                                                          |
| `/dive/people/[slug]` | Edit person        |                                                          |
| `/dive/trips/[slug]`  | Edit trip          |                                                          |
| `/dive/trips`         | Trips (admin list) |                                                          |
| `/dive/gear`          | Edit gear          |                                                          |

## 4. Dive editor

The editors come from `@divelog/kit` 0.3.0 (the UX rework; walkthroughs in the monorepo's
`docs/KIT.md`, "Logging a dive", "Creating a site" and "Map editor"). In short:

**Logging a dive** (`/admin/dives/new`, or "+ New dive" in the admin bar and on every public page
for the owner; "Log a dive here / with X / on this trip" on site, person and trip pages prefill
the form through `?site=`, `?person=`, `?trip=`, `?date=`):

- the page loads one template (`GET /admin/dives/template`): the previous dive, the last dive at
  the site, recent sites and frequent buddies;
- the form opens with **Essentials** (number, date, times, depths, site, section, buddies, trip)
  and **Gas & kit**; Conditions, On the map, Story (with the paper-log Transcription), Private
  and Publishing are folded and remember their state. Site, buddies and trip are searchable
  pickers, recent choices first; "+ New site" opens the same site form as `/admin/sites/new`
  (map pick included) in a dialog, "+ New trip" and "Add person" work inline;
- duration (from time in and out), surface interval, water temperature (last dive at the site)
  and trip (from the date) fill themselves and say where they came from; **Same as previous
  dive** fills the blanks (all, or site & buddies / tanks & kit / trip). A repeat dive at the
  same site with the same buddies is six actions: open, Same as previous dive, depth, duration,
  time in, Save;
- no fake defaults: depth and duration start empty and Save marks the missing fields, opens
  their section and focuses the first; a dive without tanks has no gas;
- the **save bar** stays in view: Save, Save & new, Save & next draft (drafts), View ↗, Delete
  (asks in a dialog); Ctrl/⌘-S saves; leaving with unsaved changes asks; the form is backed up in
  the tab and restored after a reload;
- **On the map** picks the site's only drawn map by itself; the route tools (Route, Turn point,
  Note pin) work with the arrow keys;
- photos chosen before the first save are uploaded right after it.

**The dive list** (`/admin`) pages through the server, keeps search, status and sort in the URL,
and publishes selected drafts at once. An import shows a dry run first and lists the new drafts.

**Creating a site** (`/admin/sites/new` or the dive form's "+ New site"): type the name, tap the
map (or paste coordinates). Country, region and id follow the pin; "Already known?" lists sites
with the same name or within 300 m, in the log and in the commons, with "Use this site" /
"Adopt". Then Create, Create & log a dive here, or Create & draw a map (opens the Maps tab with
a blank map). The site editor is one page with tabs: Details · Location · Maps · Photos · Dives.

**Drawing a map** (Maps tab): "Start from OpenStreetMap" builds a starter site map around the
site (Overpass, via the server), or start a blank site or stick map; nothing is stored until
"Save map" (one commit). Single-key shortcuts only work with the drawing focused and can be
switched off under "?"; on a phone the tools sit in a strip at the bottom.

Every admin page works at 390 px: the admin bar folds into a Menu, tables scroll inside their
box, forms are one column.

## 5. Site editor

- `/admin/sites` is a list only: search, country filter, "+ New site", per row edit / view ↗ /
  maps count / dives count.
- `/admin/sites/[id]`: the site form, the photos & uploaded maps panel, and a **Maps card**
  listing the drawn maps (title, kind, stations, shown first) with "Open map editor".
- `/admin/sites/[id]/maps`: the drawn-map editor (create stick map / site map, edit, reorder,
  delete, **star = shown first**). This is the only place the default map is set.
- `/dive/sites/[slug]/map` redirects to the new URL so bookmarks keep working.
- Regions get a minimal editor (`/admin/regions`, `/admin/regions/[id]`, `/admin/regions/new`:
  id, name, country, waters, body) so a new site never needs a hand-edited file.

## 6. People and trips

- `/admin/people` list + `/admin/people/[id]` editor with avatar and **Delete** (refused while
  any dive names the person; the button says how many).
- `/admin/trips` lists what the public site shows (derived trips) and marks which have an
  override file; `/admin/trips/[slug]` edits or creates the override (name, dates, description)
  and can delete it, after which the derived trip shows again.

## 7. Backend additions

```
GET    /admin/sites/{site_id}          SiteOut (owner view)
GET    /admin/people/{person_id}       PersonPrivate + dives (count)
DELETE /admin/people/{person_id}       204; 409 while dives reference the person
GET    /admin/trips/{slug}             TripOut (+ custom: bool, whether an override file exists)
DELETE /admin/trips/{slug}             204 removes the override; 404 if none
GET    /admin/regions                  list[RegionOut]
POST   /admin/regions                  RegionIn {id, name, country, waters[], body_md}
PUT    /admin/regions/{region_id}
DELETE /admin/regions/{region_id}      204; 409 while sites reference the region
```

`TripOut` gains `custom: bool`. `GET /admin/people` gains `dives` per person so the list can
gate deletion.
