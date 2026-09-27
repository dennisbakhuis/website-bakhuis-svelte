import type { PageServerLoad } from './$types';
import { apiOrError } from '$lib/server/api';
import type { DiveAdmin } from '$lib/dive/types';

export const load: PageServerLoad = async (event) => {
  const dive = await apiOrError<DiveAdmin>(event, `/api/v1/admin/dives/${event.params.id}`);
  return { dive };
};
