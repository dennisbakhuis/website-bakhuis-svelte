// Mirrors backend/app/schemas/dive.py. Keep the two in step by hand.

import type { DiveMapAnnotation, SiteMapOut } from './sitemap';

export type SiteSummary = {
  slug: string;
  name: string;
  country_code: string;
  country_name: string;
  region: string | null;
  area: string | null;
  lat: number | null;
  lon: number | null;
  site_type: string;
  water: 'salt' | 'fresh' | 'brackish' | null;
};

export type MapCollection = 'seed' | 'drawn' | 'reference';

/** One map a site page can show, from any of the three collections. */
export type MapRef = {
  ref: string;
  collection: MapCollection;
  title: string;
  url: string | null;
  public: boolean;
  credit: string | null;
  warning: string | null;
  drawn: SiteMapOut | null;
};

export type Price = { date: string; amount: number; currency: string; note: string };

export type AccessPoint = { lat: number | null; lon: number | null; note: string | null };

export type SitePrivate = {
  notes: string | null;
  reference_maps: MapRef[];
};

/** Where a site record comes from: the owner's log, a shared commons, or a fork of one. */
export type SiteOrigin = 'log' | 'commons' | 'fork';

/** Licence and source of a site record taken from a shared commons. */
export type Attribution = { licence: string; source: string; ref: string | null };

export type Site = SiteSummary & {
  id: string;
  full_name: string | null;
  short_name: string | null;
  aliases: string[];
  country: string | null;
  region_name: string | null;
  system: string | null;
  section_vocabulary: string[];
  access: AccessPoint | null;
  location_visibility: 'exact' | 'region_only';
  halocline: boolean;
  halocline_m: number | null;
  summary: string | null;
  description_md: string;
  description_html: string;
  max_depth_m: number | null;
  dives: number;
  first_dive: string | null;
  last_dive: string | null;
  maps: MapRef[];
  default_map: string | null;
  attachments: Attachment[];
  prices: Price[];
  sources: string[];
  verified: string | null;
  geo_source: string | null;
  origin: SiteOrigin;
  attribution: Attribution | null;
  private: SitePrivate | null;
};

export type Region = {
  id: string;
  name: string;
  country: string | null;
  country_code: string;
  waters: string[];
  body_md: string;
  body_html: string;
  sites: SiteSummary[];
  dives: number;
  /** Only on the region page itself, not in the list. */
  stats: RegionStats | null;
  map_sites: MapSite[];
};

export type RegionStats = {
  dives: number;
  sites: number;
  minutes: number;
  max_depth_m: number | null;
  first_year: number | null;
  last_year: number | null;
  top_site: { slug: string; name: string; dives: number } | null;
};

/** One logged dive's route on one of the site's drawn maps. */
export type SiteDiveRoute = {
  number: number;
  date: string;
  title: string;
  annotation: DiveMapAnnotation;
};

/** Another exactly-placed site near the one on the page; never offered for region-only sites. */
export type NearbySite = {
  slug: string;
  name: string;
  country_code: string;
  site_type: string;
  lat: number;
  lon: number;
  distance_km: number;
  dives: number;
};

export type Trip = {
  slug: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  description_md: string;
  description_html: string;
  /** On a dive page: the day of the trip the dive fell on, 1-based, and the trip's length. */
  day_index?: number | null;
  days?: number | null;
};

/** The trip a row of the log belongs to. */
export type TripRef = { slug: string; name: string };

export type TripStats = {
  dives: number;
  minutes: number;
  max_depth_m: number | null;
  sites: number;
};

/** A trip card, and the head of a trip page; counts are over the dives the viewer may see. */
export type TripSummary = {
  id: string;
  slug: string;
  name: string;
  start_date: string;
  end_date: string;
  days: number;
  countries: CountryStat[];
  regions: { id: string; name: string }[];
  site_ids: string[];
  dive_numbers: number[];
  stats: TripStats;
  buddies: (PersonPublic & { dives: number })[];
  description_md: string;
  description_html: string;
  cover_url: string | null;
};

export type TripDetail = { trip: TripSummary; dives: DiveListItem[]; map_sites: MapSite[] };

/** A trip a buddy was on, with the dives we made together on it. */
export type TripTogether = {
  slug: string;
  name: string;
  start_date: string;
  end_date: string;
  dives: number;
};

/**
 * A trip as the editor sees it: the override file's fields when there is one
 * (`custom: true`), else the derived trip built from the logged dives.
 */
export type TripAdmin = {
  slug: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  description_md: string;
  description_html: string;
  days: number | null;
  custom: boolean;
};

/** Body of `POST /admin/trips` and `PUT /admin/trips/{slug}`. */
export type TripIn = {
  slug: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  description_md: string;
};

export type AttachmentKind = 'photo' | 'scan' | 'map' | 'avatar' | 'video' | 'export';

export type Attachment = {
  id: string;
  kind: AttachmentKind;
  mime: string;
  bytes: number;
  width: number | null;
  height: number | null;
  caption: string;
  credit: string;
  sort: number;
  public: boolean;
  taken_at: string | null;
  original_name: string;
  url: string;
  variants: Record<string, string>;
};

export type ProfileSample = {
  t: number;
  d: number;
  temp?: number | null;
  /** No-decompression limit in minutes at that moment, as the computer showed it. */
  ndl?: number | null;
  /** First stop (ceiling) depth in metres while in deco; absent otherwise. */
  stop?: number | null;
  /** Time to surface in minutes, stops included. */
  tts?: number | null;
};

export type ProfileMeta = {
  gf: string | null;
  deco_model: string | null;
  deco: boolean;
  /** `[seconds, gas]` pairs; the gas is the O₂ percentage, or "O2/He" for trimix. */
  gas_switches: unknown[][];
  /** `[from, to]` second pairs spent at the surface mid-dive. */
  surface_breaks: number[][];
  temp_min_c: number | null;
  temp_max_c: number | null;
  sample_interval_s: number | null;
  partial: string | null;
  samples: number | null;
  deco_min: number | null;
  deepest_stop_m: number | null;
  first_stop_s: number | null;
  max_ascent_m_min: number | null;
  max_descent_m_min: number | null;
  time_at_max_s: number | null;
};

export type PersonPublic = { slug: string; name: string; avatar_url: string | null };

/** A buddy on the dive page, with what we logged together. */
export type Buddy = PersonPublic & {
  dives_together: number;
  first_dive: string | null;
  last_dive: string | null;
  first_together: boolean;
};

export type SameDayDive = { number: number; site_name: string | null; time_in: string | null };

export type PersonPrivate = PersonPublic & {
  id: string;
  first_name: string;
  last_name: string | null;
  alias: string | null;
  aliases: string[];
  email: string | null;
  display: string;
  notes: string | null;
  /** Dives that still name this person; the admin delete button is refused while this is nonzero. */
  dives: number;
};

export type PersonStats = {
  dives: number;
  minutes: number;
  max_depth_m: number;
  longest_min: number;
  coldest_c: number | null;
  first_dive: string | null;
  last_dive: string | null;
  countries: number;
  sites: number;
};

export type Person = PersonPublic & {
  bio_md: string;
  bio_html: string;
  stats: PersonStats;
  /** Alpha-2 codes of the countries we dived in together, most dives first. */
  countries: string[];
  private: PersonPrivate | null;
};

export type DiveListItem = {
  number: number;
  title: string;
  date: string;
  time_in: string | null;
  duration_min: number;
  max_depth_m: number;
  water_temp_c: number | null;
  tags: string[];
  gas: string;
  /** Every mix breathed, back gas first: "Nitrox 32", "Trimix 21/35", "Oxygen". */
  gases: string[];
  mode: string;
  site: SiteSummary | null;
  section: string | null;
  buddies: PersonPublic[];
  gear_setup: string | null;
  rating: number | null;
  has_photos: boolean;
  has_profile: boolean;
  /** Up to 24 depths in decimetres, evenly spread over the profile; null without one. */
  spark: number[] | null;
  cover_url: string | null;
  search_text: string;
  trip?: TripRef | null;
};

export type TankGas = 'air' | 'nitrox' | 'trimix' | 'oxygen';
export type TankRole = 'back' | 'stage' | 'deco' | 'bailout';

export type Tank = {
  cylinder: string;
  volume_l: number | null;
  gas: TankGas;
  o2_pct: number | null;
  /** What the analyser read, when it differed from the fill ordered. */
  o2_measured_pct: number | null;
  he_pct: number | null;
  pressure_in_bar: number | null;
  pressure_out_bar: number | null;
  role: TankRole;
};

export type DivePrivate = {
  people: PersonPrivate[];
  buddy_raw: string | null;
  buddy_role: string | null;
  operator: string | null;
  flags: string[];
  sketch: string | null;
  site_name_raw: string | null;
  area_raw: string | null;
};

export type Dive = {
  number: number;
  title: string;
  date: string;
  time_in: string | null;
  time_out: string | null;
  duration_min: number;
  max_depth_m: number;
  avg_depth_m: number | null;
  water_temp_c: number | null;
  surface_temp_c: number | null;
  air_temp_c: number | null;
  thermocline_m: number | null;
  visibility_m: number | null;
  visibility_raw: string | null;
  site: Site | null;
  section: string | null;
  trip: Trip | null;
  tags: string[];
  types_raw: string | null;
  gas: string;
  o2_pct: number | null;
  o2_measured_pct: number | null;
  he_pct: number | null;
  gas_raw: string | null;
  mode: string;
  suit: string | null;
  weights_kg: number | null;
  cylinder: string | null;
  pressure_in_bar: number | null;
  pressure_out_bar: number | null;
  safety_stop_min: number | null;
  surface_interval: string | null;
  conditions: string | null;
  difficulty: string | null;
  course: string | null;
  rating: number | null;
  gear_setup: { slug: string; name: string } | null;
  guide: string | null;
  body_md: string;
  body_html: string;
  notes_nl: string | null;
  visibility: 'public' | 'private' | 'draft';
  buddies: Buddy[];
  attachments: Attachment[];
  cover_attachment_id: string | null;
  computer: number[];
  profile: ProfileSample[] | null;
  profile_meta: ProfileMeta | null;
  map_annotation: DiveMapAnnotation | null;
  map: SiteMapOut | null;
  prev_number: number | null;
  next_number: number | null;
  site_dive_index: number | null;
  day_index: number | null;
  same_day: SameDayDive[];
  context_facts: string[];
  private: DivePrivate | null;
  /** Surface air consumption in litres per minute, when cylinder and pressures allow. */
  sac_l_min: number | null;
  /** How the SAC was worked out, e.g. "22.2 L · 200→90 bar". */
  sac_basis: string | null;
  /** Every cylinder carried; empty on dives logged before tanks were recorded separately. */
  tanks: Tank[];
  prev_site_name: string | null;
  next_site_name: string | null;
};

export type DiveAdmin = Dive & {
  id: number;
  people_ids: string[];
  site_id: string | null;
  trip_id: string | null;
  gear_setup_id: string | null;
  country: string | null;
};

export type CountryStat = { country_code: string; country_name: string; dives: number };

export type DiveEnvelope = {
  dives: DiveListItem[];
  total: number;
  tags: string[];
  countries: CountryStat[];
  years: number[];
  regions: string[];
  site_types: string[];
  gear_setups: { slug: string; name: string }[];
};

export type MapSite = {
  slug: string;
  name: string;
  country_code: string;
  lat: number;
  lon: number;
  dives: number;
  minutes: number;
  site_type: string;
  max_depth_m: number;
  first_year: number;
  last_year: number;
};

export type RecordDive = { number: number; title: string; value: number; site: string | null };

export type DiveStats = {
  total_dives: number;
  private_dives: number;
  total_minutes: number;
  max_depth_m: number;
  avg_depth_m: number | null;
  avg_duration_min: number | null;
  countries: number;
  sites: number;
  first_dive: string | null;
  last_dive: string | null;
  tags: { tag: string; count: number }[];
  /** Dives at or past DEEP_DIVE_M (see stats-view). */
  deep_dives: number;
  years: { year: number; dives: number; minutes: number }[];
  country_breakdown: CountryStat[];
  depth_buckets: { from_m: number; to_m: number; dives: number }[];
  map_sites: MapSite[];
  deepest: RecordDive | null;
  longest: RecordDive | null;
  coldest: RecordDive | null;
};

export type DiveSummary = {
  total_dives: number;
  total_hours: number;
  countries: number;
  max_depth_m: number;
  last_dive: string | null;
  last_dive_site: string | null;
  cave_dives: number;
  scooter_dives: number;
};

export type GearItem = {
  id: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  acquired: string | null;
  retired: string | null;
  notes_md: string;
  notes_html: string;
  sort: number;
  photo_url: string | null;
  dive_count: number;
};

export type GearSetup = {
  id: string;
  slug: string;
  name: string;
  description_md: string;
  description_html: string;
  sort: number;
  items: GearItem[];
  dive_count: number;
};

export type GearPage = { setups: GearSetup[]; items: GearItem[] };

export type RepoStatus = {
  state: string;
  ahead: number;
  behind: number;
  head: string | null;
  dirty: boolean;
  last_push_at: string | null;
  last_error: string | null;
  load_errors: string[];
};

/** Body of `POST /admin/regions` and `PUT /admin/regions/{id}`. */
export type RegionIn = {
  id: string;
  name: string;
  country: string | null;
  waters: string[];
  body_md: string;
};
