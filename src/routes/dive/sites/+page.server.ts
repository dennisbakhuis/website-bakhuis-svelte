import type { PageServerLoad } from './$types';
import { apiOrError } from '$lib/server/api';
import type { DiveEnvelope, Site } from '$lib/dive/types';

export type SiteRow = Site & { dive_count: number; has_map: boolean };

export const load: PageServerLoad = async (event) => {
  const [sites, envelope] = await Promise.all([
    apiOrError<Site[]>(event, '/api/v1/dive/sites'),
    apiOrError<DiveEnvelope>(event, '/api/v1/dive/dives'),
  ]);
  const counts = new Map<string, number>();
  for (const dive of envelope.dives) {
    if (dive.site) counts.set(dive.site.slug, (counts.get(dive.site.slug) ?? 0) + 1);
  }
  const rows: SiteRow[] = sites.map((site) => ({
    ...site,
    dive_count: counts.get(site.slug) ?? 0,
    has_map: site.maps.length > 0 || site.attachments.some((a) => a.kind === 'map'),
  }));
  const countries = [...new Set(rows.map((r) => r.country_name))].sort().map((country) => ({
    country,
    code: rows.find((r) => r.country_name === country)!.country_code,
    sites: rows
      .filter((r) => r.country_name === country)
      .sort((a, b) => b.dive_count - a.dive_count || a.name.localeCompare(b.name)),
  }));
  return { countries, total: rows.length };
};
