import type { PageServerLoad } from './$types';
import { apiOrError } from '$lib/server/api';
import type { DiveAdmin } from '$lib/dive/types';

export const load: PageServerLoad = async (event) => {
  const dives = await apiOrError<DiveAdmin[]>(event, '/api/v1/admin/dives');
  return { dives };
};
