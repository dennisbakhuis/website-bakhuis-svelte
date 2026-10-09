import type { PageServerLoad } from './$types';
import { apiOrError } from '$lib/server/api';
import type { DiveAdmin } from '$lib/dive/types';
import { urls } from '$lib/divelog-config';

export const load: PageServerLoad = async (event) => {
  const dives = await apiOrError<DiveAdmin[]>(event, urls.api('/admin/dives'));
  return { dives };
};
