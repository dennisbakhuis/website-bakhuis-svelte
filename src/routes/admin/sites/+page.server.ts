import type { PageServerLoad } from './$types';
import { apiOrError } from '$lib/server/api';
import type { Region, Site } from '$lib/dive/types';
import { urls } from '$lib/divelog-config';

export const load: PageServerLoad = async (event) => {
  const [sites, regions] = await Promise.all([
    apiOrError<Site[]>(event, urls.api('/admin/sites')),
    apiOrError<Region[]>(event, urls.api('/dive/regions')),
  ]);
  return { sites, regions };
};
