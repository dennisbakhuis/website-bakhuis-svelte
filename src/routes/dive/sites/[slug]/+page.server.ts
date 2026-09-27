import type { PageServerLoad } from './$types';
import { apiOrError } from '$lib/server/api';
import type { DiveListItem, Site } from '$lib/dive/types';
import { landPath, spherePath, project, MAP_WIDTH, MAP_HEIGHT } from '$lib/map/world';

export const load: PageServerLoad = async (event) => {
  const data = await apiOrError<{ site: Site; dives: DiveListItem[] }>(
    event,
    `/api/v1/dive/sites/${event.params.slug}`,
  );
  const point =
    data.site.lat !== null && data.site.lon !== null ? project(data.site.lon, data.site.lat) : null;
  return {
    ...data,
    map: { landPath, spherePath, width: MAP_WIDTH, height: MAP_HEIGHT, point },
    meta: {
      title: `${data.site.name} — dive site — Dennis Bakhuis`,
      description: `${data.dives.length} dives at ${data.site.name}, ${data.site.country_name}.`,
    },
  };
};
