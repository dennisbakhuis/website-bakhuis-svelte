import type { PageServerLoad } from './$types';
import { apiOrError } from '$lib/server/api';
import type { DiveEnvelope, DiveStats } from '$lib/dive/types';
import { landPath, spherePath, project, MAP_WIDTH, MAP_HEIGHT } from '$lib/map/world';

export const load: PageServerLoad = async (event) => {
  const [stats, envelope] = await Promise.all([
    apiOrError<DiveStats>(event, '/api/v1/dive/stats'),
    apiOrError<DiveEnvelope>(event, '/api/v1/dive/dives'),
  ]);

  const dots = stats.map_sites
    .map((site) => ({ ...site, point: project(site.lon, site.lat) }))
    .filter((s): s is typeof s & { point: NonNullable<typeof s.point> } => s.point !== null);

  return {
    stats,
    envelope,
    map: { landPath, spherePath, width: MAP_WIDTH, height: MAP_HEIGHT, dots },
  };
};
