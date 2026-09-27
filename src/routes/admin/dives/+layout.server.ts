import type { LayoutServerLoad } from './$types';
import { apiOrError } from '$lib/server/api';
import type { GearSetup, Person, Site, Trip } from '$lib/dive/types';

// Reference data every dive form needs: sites, trips, people, gear setups.
export const load: LayoutServerLoad = async (event) => {
  const [sites, trips, people, setups] = await Promise.all([
    apiOrError<Site[]>(event, '/api/v1/admin/sites'),
    apiOrError<Trip[]>(event, '/api/v1/admin/trips'),
    apiOrError<Person[]>(event, '/api/v1/admin/people'),
    apiOrError<GearSetup[]>(event, '/api/v1/admin/gear/setups'),
  ]);
  return { sites, trips, people, setups };
};
