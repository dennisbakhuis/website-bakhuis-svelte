import type { PageServerLoad } from './$types';
import { apiOrError } from '$lib/server/api';
import type { MapSite, TripDetail } from '$lib/dive/types';
import { makeRegionMap } from '$lib/map/world';
import { formatDateRange } from '$lib/dive/format';

type Dot = MapSite & { point: { x: number; y: number } };

export const load: PageServerLoad = async (event) => {
  const data = await apiOrError<TripDetail>(event, `/api/v1/dive/trips/${event.params.slug}`);
  const { trip } = data;
  const panel = await makeRegionMap(trip.slug, trip.name, data.map_sites);
  const map = panel
    ? {
        landPath: panel.landPath,
        spherePath: `M0 0H${panel.width}V${panel.height}H0Z`,
        width: panel.width,
        height: panel.height,
        dots: data.map_sites
          .map((site) => ({ ...site, point: panel.project(site.lon, site.lat) }))
          .filter((s): s is Dot => s.point !== null),
      }
    : null;
  return {
    ...data,
    map,
    editHref: `/admin/trips/${trip.slug}`,
    meta: {
      title: `${trip.name} — dive trip — Dennis Bakhuis`,
      description: `${trip.stats.dives} dives at ${trip.stats.sites} sites, ${formatDateRange(trip.start_date, trip.end_date)}.`,
    },
  };
};
