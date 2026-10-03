# Dive log — improvement plan

Written 2026-09-27 after a walk-through of the running dev site in Chrome
(front page, `/dive`, dive detail #674 / #670 / #409, sites index, site page,
people, person page, gear, region page, blog, admin list and dive editor).

Not verified: the phone layout (the automation window refused to resize) and
the scroll-reveal timing (the automation tab is hidden, so animations pause).
Check both by hand before shipping phase 3.

---

## 1. Where the site stands

**Strong already**

- The timeline strip ("every dive on one line"), the world map with the three
  region insets, and the charts block give `/dive` a real identity.
- Site pages are the best pages on the site: summary, long description,
  locator map, sections vocabulary, "getting in", "dived here with", dives per
  year, the list. Region pages have good essays.
- Person pages: stats band, world map, dives per year, list.
- The admin editor is complete and pleasant.
- The data is much richer than the public pages show: every site has a
  summary and a description, 190 of 210 have a locator SVG, every person has
  computed stats, 176 dives have a real story, 25 sites belong to a named
  cave system.

**Thin**

- **Dive detail** is numbers + profile + a one-line provenance sentence. It
  does not tell you anything about _where_ you were or _who_ you were with,
  although the API response for a dive already carries the full site record
  (summary, system, type, max depth, dive count, first/last dive, maps) and
  the buddies' slugs.
- **Log rows**: a large empty grey square with "#674" in it, a "PROFILE" pill
  on almost every row, and the site name printed twice (title and location
  line). Nothing in the row is visual.
- **Gear** page renders an empty "Items" heading (`gear/items.json` is `[]`).
- **Trips** exist in the model (`trip` field) but are never populated and have
  no page, although a quarter of the log is trips (Mexico Feb 2026 alone is
  25 dives).
- No dive has a photo yet, so the gallery, cover thumbnails and lightbox are
  untested in practice.

**Bugs seen**

| Where       | What                                               | Cause                                                                                                                     |
| ----------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Stats band  | "Diving since **2,005**"                           | `counter` formats with `toLocaleString`, grouping the year (`src/lib/anim/counter.ts:6`, `src/lib/dive/stats-view.ts:29`) |
| Stats band  | "632.8 h" wraps onto two lines in the headline row | tile width vs. font size; needs `white-space: nowrap` or a smaller size at that width                                     |
| Dive detail | "Visibility —" shown when unknown                  | the fact is unconditional while every other empty fact is hidden                                                          |
| Dive detail | prev/next only at the top of a long page           | no bottom nav                                                                                                             |
| Log rows    | "PROFILE" pill on ~90 % of rows                    | signal shown as a tag; noise                                                                                              |
| Gear        | empty heading, no empty state                      | no `{:else}` branch                                                                                                       |

---

## 2. Plan

Ordered by value for effort. Phases 1 and 2 are the actual ask (site and team
context on the dive page); the rest is what I would do after.

### Phase 1 — Quick fixes (½ day)

1. Counter: add a `group: false` option and use it for year tiles, or skip
   the counter for "Diving since".
2. Headline tiles: no wrap; reduce the size one step on narrow tiles.
3. Log rows: drop the "PROFILE" pill (move the signal to a tiny icon at the
   right edge); show only area in the location line when it starts with the
   site name; fill the grey square with something (see phase 3).
4. Dive detail: hide "Visibility" when null; repeat prev / next at the bottom.
5. Gear: empty state ("No gear catalogued yet") or hide the section.

### Phase 2 — Dive detail: context (1–2 days) — the main ask

Add three blocks between the facts card and the profile.

**a. "Where" — site card.** All fields are already in `dive.site`:

- `summary` (one sentence, every site has one), `site_type`, `system`
  ("part of Sistema Ox Bel Ha"), site `max_depth_m`.
- "Dive 14 of 21 here · first 2022 · last Feb 2026" — from `dives`,
  `first_dive`, `last_dive`, plus the dive's own rank at the site (one
  backend addition: `site_dive_index`).
- The locator map as a thumbnail (`maps[default_map].url`, an SVG; there are
  190). Click goes to the site page. Where a site has a CC photo
  (`media/sites`, 19 of them) use that instead.
- Links: site page, region page.

**b. "With" — team card.** One row per buddy, replacing the bare name pills:

- Initial or avatar, name, "381 dives together · since Jul 2005 · last
  8 Aug 2026", link to the person page. First dive with someone gets a
  "first dive together" badge.
- Backend: enrich `buddies[]` in the dive detail with `dives_together`,
  `first_dive`, `last_dive`. The numbers are already computed for
  `/people`; expose them on the dive schema (`backend/app/schemas/dive.py`,
  `backend/app/services/dives.py`).

**c. "Context" strip.** Small muted line under the header:

- "2nd dive of the day" with links to the other dives that day; "day 12 of
  the Mexico 2026 trip" once trips exist (phase 4).
- "Deeper than 71 % of all dives · 12th time at this site · coldest of 2026".
  Cheap to compute server-side and fun to read; keep it to three facts.

Also: use the cover photo, else the site photo, else the locator map as a
dim header background so pages stop looking identical.

For computer-only dives ("from dive computer (record #674); never logged on
paper") render the provenance as a muted one-liner under the profile rather
than as the story body, so the story block is either a story or absent.

### Phase 3 — Log list and filters (1–2 days)

- Row redesign: the grey square becomes a **mini profile sparkline** when
  `has_profile` is set (the sample data is already served), otherwise the
  site-type glyph from `MapGlyph`. Depth and time as small horizontal bars
  next to the numbers so a 44 m or a 230 min dive jumps out.
- **Date group headers** (month, or trip once phase 4 exists) so the list
  reads like a diary instead of 674 identical cards.
- Filters: buddy dropdown (people are in the search text but not a facet),
  depth and duration ranges, "with photos / with profile" toggles, a
  "clear all" chip, and a results count that updates.
- Timeline brush and map click both already filter the list; make sure both
  land in the URL (`?from=2022&to=2023`, `?site=…`) so filters are shareable.
- "Show more (614 left)" is fine; add "jump to year" on the sort row.
- Verify the phone layout of the row and the filter bar by hand.

### Phase 4 — Trips (2 days)

- Derive trips automatically: consecutive dives outside NL/DE/BE within a
  window of a few days form a trip; store the result as `trips/*.md` so it
  can be edited (name, dates, description, cover). Populate `dive.trip`.
- `/dive/trips` (cards: name, dates, country flags, dive count) and
  `/dive/trips/[slug]` (map of sites, stats band, buddies, day-by-day list).
- Use trips in the dive detail context strip, as group headers in the log
  list, and as labels on the timeline strip.

### Phase 5 — People, sites, regions polish (1 day)

- People index: sort by dives / recency, filter by country; show "since" on
  the card.
- Person page: "sites we dived together", "trips together".
- Site page: "nearby sites" (by distance), water temperature by month for
  this site, and drop the redundant site name in each row of its own list.
- Region page: add the inset map (the component exists) and a small stats
  band; the essay is good, it just floats.

### Phase 6 — Content and media (ongoing, no code)

- Fill `gear/items.json` and `gear/setups.json`; the page is built.
- Upload the Mexico 2026 photos through the admin so the gallery, covers and
  variants get exercised on real data.
- Bios for the ten or so most frequent buddies (`bio_md` exists, none
  filled).
- Site photos: 19 CC images now; the site card in phase 2 makes more of them
  worthwhile.

### Phase 7 — Front page and cross-links (½ day)

- Diving tile: link "Last dive" to the dive page; add a tiny timeline
  sparkline.
- Blog posts about diving link to dives and sites (a small mdsvex shortcode).
- OG image per dive and site (the profile chart or the locator map rendered
  to PNG at build time).

---

## 3. Suggested order

1. Phase 1 (fixes) and phase 2 (site + team context) together, as one PR.
2. Phase 3 (list) — the second most visible change.
3. Phase 4 (trips) — unlocks the diary feel everywhere.
4. Phases 5–7 as time allows; phase 6 is content work that can run alongside.
