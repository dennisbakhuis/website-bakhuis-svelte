import type { PageServerLoad } from './$types';
import { apiOrError } from '$lib/server/api';
import type { Region, Site } from '$lib/dive/types';

export type SiteRow = {
  slug: string;
  name: string;
  site_type: string;
  area: string | null;
  region: string | null;
  region_name: string | null;
  country_code: string;
  country_name: string;
  dives: number;
  last_dive: string | null;
  max_depth_m: number | null;
  drawn: number;
  summary: string | null;
};

export type RegionGroup = { id: string | null; name: string; sites: SiteRow[] };
export type CountryGroup = { code: string; name: string; dives: number; regions: RegionGroup[] };

export const load: PageServerLoad = async (event) => {
  const [sites, regions] = await Promise.all([
    apiOrError<Site[]>(event, '/api/v1/dive/sites'),
    apiOrError<Region[]>(event, '/api/v1/dive/regions'),
  ]);
  const regionName = new Map(regions.map((r) => [r.id, r.name]));
  const rows: SiteRow[] = sites.map((site) => ({
    slug: site.slug,
    name: site.name,
    site_type: site.site_type,
    area: site.area,
    region: site.region,
    region_name: site.region ? (regionName.get(site.region) ?? site.region) : null,
    country_code: site.country_code,
    country_name: site.country_name,
    dives: site.dives,
    last_dive: site.last_dive,
    max_depth_m: site.max_depth_m,
    drawn: site.maps.filter((m) => m.collection === 'drawn' || m.collection === 'seed').length,
    summary: site.summary,
  }));

  const countries: CountryGroup[] = [];
  for (const row of rows) {
    let country = countries.find((c) => c.code === row.country_code);
    if (!country) {
      country = { code: row.country_code, name: row.country_name, dives: 0, regions: [] };
      countries.push(country);
    }
    country.dives += row.dives;
    let region = country.regions.find((r) => r.id === row.region);
    if (!region) {
      region = { id: row.region, name: row.region_name ?? 'Elsewhere', sites: [] };
      country.regions.push(region);
    }
    region.sites.push(row);
  }
  for (const country of countries) {
    country.regions.sort(
      (a, b) => b.sites.reduce((s, r) => s + r.dives, 0) - a.sites.reduce((s, r) => s + r.dives, 0),
    );
    for (const region of country.regions) {
      region.sites.sort((a, b) => b.dives - a.dives || a.name.localeCompare(b.name));
    }
  }
  countries.sort((a, b) => b.dives - a.dives);

  const types = [...new Set(rows.map((r) => r.site_type))].sort();
  return { countries, types, total: rows.length, editHref: '/admin/sites' };
};
