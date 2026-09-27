import type { PageServerLoad } from './$types';
import { apiOrError } from '$lib/server/api';
import type { GearPage } from '$lib/dive/types';

export const load: PageServerLoad = async (event) => {
  const gear = await apiOrError<GearPage>(event, '/api/v1/dive/gear');
  return { gear };
};
