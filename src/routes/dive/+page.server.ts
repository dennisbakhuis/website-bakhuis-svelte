import type { PageServerLoad } from './$types';
import { apiOrError } from '$lib/server/api';
import type { DiveEnvelope, DiveStats, MapSite } from '$lib/dive/types';
import { landPath, MAP_HEIGHT, MAP_WIDTH, project, spherePath } from '$lib/map/world';
import { urls } from '$lib/divelog-config';

export type Dot = MapSite & { point: { x: number; y: number } };

export const load: PageServerLoad = async (event) => {
  const [stats, envelope] = await Promise.all([
    apiOrError<DiveStats>(event, urls.api('/dive/stats')),
    apiOrError<DiveEnvelope>(event, urls.api('/dive/dives')),
  ]);

  const dots = stats.map_sites
    .map((site) => ({ ...site, point: project(site.lon, site.lat) }))
    .filter((s): s is Dot => s.point !== null);

  return {
    stats,
    envelope,
    map: { landPath, spherePath, width: MAP_WIDTH, height: MAP_HEIGHT, dots },
    editHref: urls.admin.root(),
  };
};
