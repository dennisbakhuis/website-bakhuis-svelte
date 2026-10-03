import type { PageServerLoad } from './$types';
import { apiOrError } from '$lib/server/api';
import type { CountryStat, DiveListItem, MapSite, Person, TripTogether } from '$lib/dive/types';
import { landPath, spherePath, project, MAP_WIDTH, MAP_HEIGHT } from '$lib/map/world';

type Payload = {
  person: Person;
  countries: CountryStat[];
  dives: DiveListItem[];
  map_sites: MapSite[];
  years: { year: number; dives: number; minutes: number }[];
  trips: TripTogether[];
};

export const load: PageServerLoad = async (event) => {
  const data = await apiOrError<Payload>(event, `/api/v1/dive/people/${event.params.slug}`);
  const dots = data.map_sites
    .map((site) => ({ ...site, point: project(site.lon, site.lat) }))
    .filter((s): s is MapSite & { point: { x: number; y: number } } => s.point !== null);
  return {
    ...data,
    map: { landPath, spherePath, width: MAP_WIDTH, height: MAP_HEIGHT, dots },
    editHref: data.person.private
      ? `/admin/people/${encodeURIComponent(data.person.private.id)}`
      : '/admin/people',
    meta: {
      title: `Diving with ${data.person.name} — Dennis Bakhuis`,
      description: `${data.dives.length} dives together, ${data.person.stats.countries} countries.`,
    },
  };
};
