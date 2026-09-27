// Mirrors backend/app/schemas/dive.py. Keep the two in step by hand for now;
// generating from the OpenAPI schema is a later improvement.

import type { DiveMapAnnotation, SiteMapOut } from './sitemap';

export type SiteSummary = {
  slug: string;
  name: string;
  country_code: string;
  country_name: string;
  region: string | null;
  lat: number | null;
  lon: number | null;
  site_type: string;
};

export type Site = SiteSummary & {
  id: string;
  description_md: string;
  max_depth_m: number | null;
  location_visibility: 'exact' | 'region_only';
  maps: SiteMapOut[];
  attachments: Attachment[];
};

export type Trip = {
  id: string;
  slug: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  description_md: string;
};

export type Attachment = {
  id: string;
  kind: 'photo' | 'scan' | 'map' | 'export' | 'video';
  mime: string;
  bytes: number;
  width: number | null;
  height: number | null;
  caption: string;
  sort: number;
  taken_at: string | null;
  original_name: string;
  url: string;
  variants: Record<string, string>;
};

export type ProfileSample = { t: number; d: number; temp?: number | null };

export type DiveListItem = {
  number: number;
  title: string;
  date: string;
  duration_min: number;
  max_depth_m: number;
  water_temp_c: number | null;
  tags: string[];
  gas: string;
  mode: string;
  site: SiteSummary | null;
  buddies: string[];
  gear_setup: string | null;
  rating: number | null;
  has_photos: boolean;
  cover_url: string | null;
};

export type Dive = {
  id: string;
  number: number;
  title: string;
  date: string;
  time_in: string | null;
  duration_min: number;
  max_depth_m: number;
  avg_depth_m: number | null;
  water_temp_c: number | null;
  air_temp_c: number | null;
  visibility_m: number | null;
  site: Site | null;
  trip: Trip | null;
  tags: string[];
  gas: string;
  o2_pct: number | null;
  he_pct: number | null;
  mode: string;
  suit: string | null;
  weights_kg: number | null;
  rating: number | null;
  gear_setup: { slug: string; name: string } | null;
  guide: string | null;
  body_md: string;
  visibility: 'public' | 'private' | 'draft';
  buddies: string[];
  attachments: Attachment[];
  cover_attachment_id: string | null;
  profile: ProfileSample[] | null;
  map_annotation: DiveMapAnnotation | null;
  map: SiteMapOut | null;
  map_current: SiteMapOut | null;
  prev_number: number | null;
  next_number: number | null;
};

export type SiteMapRevision = {
  id: string;
  number: number;
  note: string;
  created_at: string;
  data: SiteMapOut;
};

export type DiveAdmin = Dive & {
  buddy_ids: string[];
  site_id: string | null;
  trip_id: string | null;
  gear_setup_id: string | null;
};

export type CountryStat = { country_code: string; country_name: string; dives: number };

export type DiveEnvelope = {
  dives: DiveListItem[];
  total: number;
  tags: string[];
  countries: CountryStat[];
  years: number[];
  gear_setups: { slug: string; name: string }[];
};

export type MapSite = {
  slug: string;
  name: string;
  country_code: string;
  lat: number;
  lon: number;
  dives: number;
  site_type: string;
  max_depth_m: number;
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
  sort: number;
  photo_url: string | null;
  dive_count: number;
};

export type GearSetup = {
  id: string;
  slug: string;
  name: string;
  description_md: string;
  sort: number;
  items: GearItem[];
  dive_count: number;
};

export type GearPage = { setups: GearSetup[]; items: GearItem[] };

export type Person = { id: string; name: string; display: string };
