import type { PageServerLoad } from './$types';
import { apiOrError } from '$lib/server/api';
import type { MapSite, Region } from '$lib/dive/types';
import { makeRegionMap } from '$lib/map/world';

type Dot = MapSite & { point: { x: number; y: number } };

export const load: PageServerLoad = async (event) => {
  const region = await apiOrError<Region>(event, `/api/v1/dive/regions/${event.params.id}`);
  const panel = await makeRegionMap(region.id, region.name, region.map_sites);
  const map = panel
    ? {
        landPath: panel.landPath,
        spherePath: `M0 0H${panel.width}V${panel.height}H0Z`,
        width: panel.width,
        height: panel.height,
        dots: region.map_sites
          .map((site) => ({ ...site, point: panel.project(site.lon, site.lat) }))
          .filter((s): s is Dot => s.point !== null),
      }
    : null;
  return {
    region,
    map,
    editHref: `/admin/regions/${encodeURIComponent(region.id)}`,
    meta: {
      title: `${region.name} — dive region — Dennis Bakhuis`,
      description: `${region.sites.length} dive sites and ${region.dives} dives in ${region.name}.`,
    },
  };
};
