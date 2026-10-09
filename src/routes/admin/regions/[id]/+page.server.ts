import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { apiOrError } from '$lib/server/api';
import type { Region } from '$lib/dive/types';
import { urls } from '$lib/divelog-config';

export const load: PageServerLoad = async (event) => {
  const regions = await apiOrError<Region[]>(event, urls.api('/admin/regions'));
  const region = regions.find((r) => r.id === event.params.id);
  if (!region) error(404, 'Not found');
  return { region };
};
