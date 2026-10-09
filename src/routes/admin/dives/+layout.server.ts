import type { LayoutServerLoad } from './$types';
import { apiOrError } from '$lib/server/api';
import type { GearSetup, PersonPrivate, Region, Site, Trip } from '$lib/dive/types';
import { urls } from '$lib/divelog-config';

// Reference data every dive form needs: sites, trips, people, gear setups, regions.
export const load: LayoutServerLoad = async (event) => {
  const [sites, trips, people, setups, regions] = await Promise.all([
    apiOrError<Site[]>(event, urls.api('/admin/sites')),
    apiOrError<Trip[]>(event, urls.api('/admin/trips')),
    apiOrError<PersonPrivate[]>(event, urls.api('/admin/people')),
    apiOrError<GearSetup[]>(event, urls.api('/admin/gear/setups')),
    apiOrError<Region[]>(event, urls.api('/dive/regions')),
  ]);
  return { sites, trips, people, setups, regions };
};
