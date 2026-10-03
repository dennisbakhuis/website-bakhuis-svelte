import type { LayoutServerLoad } from './$types';
import { apiOrError } from '$lib/server/api';
import type { GearSetup, PersonPrivate, Region, Site, Trip } from '$lib/dive/types';

// Reference data every dive form needs: sites, trips, people, gear setups, regions.
export const load: LayoutServerLoad = async (event) => {
  const [sites, trips, people, setups, regions] = await Promise.all([
    apiOrError<Site[]>(event, '/api/v1/admin/sites'),
    apiOrError<Trip[]>(event, '/api/v1/admin/trips'),
    apiOrError<PersonPrivate[]>(event, '/api/v1/admin/people'),
    apiOrError<GearSetup[]>(event, '/api/v1/admin/gear/setups'),
    apiOrError<Region[]>(event, '/api/v1/dive/regions'),
  ]);
  return { sites, trips, people, setups, regions };
};
