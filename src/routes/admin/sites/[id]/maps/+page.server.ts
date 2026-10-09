import type { PageServerLoad } from './$types';
import { apiOrError } from '$lib/server/api';
import type { Site } from '$lib/dive/types';
import { urls } from '$lib/divelog-config';

export const load: PageServerLoad = async (event) => {
  const site = await apiOrError<Site>(
    event,
    urls.api(`/admin/sites/${encodeURIComponent(event.params.id)}`),
  );
  return { site };
};
