import type { PageServerLoad } from './$types';
import { apiOrError } from '$lib/server/api';
import type { Region } from '$lib/dive/types';

export const load: PageServerLoad = async (event) => {
  const regions = await apiOrError<Region[]>(event, '/api/v1/admin/regions');
  return { regions };
};
