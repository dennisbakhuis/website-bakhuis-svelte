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

One form, saved as one record, with:

- a **sticky save bar** (Save · unsaved marker · View ↗ · Delete) so saving never needs a scroll;
- an **unsaved-changes guard**: `beforeNavigate` and `beforeunload` while dirty;
- **inline creation**: "+ New site" opens a small dialog (name, country, type, region) that
  POSTs the site and selects it; "+ New trip" likewise (name, start, end); "New person" as before;
- **On the map** stays inside the form because the route belongs to the dive and is saved with
  it. When the site has no drawn map the section offers "Draw a map for {site} ↗" (opens
  `/admin/sites/[id]/maps` in a new tab) and a **↻ refresh** that re-fetches the site's maps
  without leaving the form;
- **Copy last dive** on `/admin/dives/new` pre-fills site, trip, people, gear, gas, mode, suit and
  weights from the most recent dive;
- photos, scans and computer exports are added after the first save (the record needs a number);
  the new-dive page says so.

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
