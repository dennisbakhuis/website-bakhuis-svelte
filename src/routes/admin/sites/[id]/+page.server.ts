import type { PageServerLoad } from './$types';
import { apiOrError } from '$lib/server/api';
import type { Region, Site } from '$lib/dive/types';

export const load: PageServerLoad = async (event) => {
  const id = encodeURIComponent(event.params.id);
  const [site, regions] = await Promise.all([
    apiOrError<Site>(event, `/api/v1/admin/sites/${id}`),
    apiOrError<Region[]>(event, '/api/v1/dive/regions'),
  ]);
  return { site, regions };
};
