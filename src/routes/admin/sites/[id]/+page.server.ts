import type { PageServerLoad } from './$types';
import { apiOrError } from '$lib/server/api';
import type { Region, Site } from '$lib/dive/types';
import { urls } from '$lib/divelog-config';

export const load: PageServerLoad = async (event) => {
  const id = encodeURIComponent(event.params.id);
  const [site, regions] = await Promise.all([
    apiOrError<Site>(event, urls.api(`/admin/sites/${id}`)),
    apiOrError<Region[]>(event, urls.api('/dive/regions')),
  ]);
  return { site, regions };
};
