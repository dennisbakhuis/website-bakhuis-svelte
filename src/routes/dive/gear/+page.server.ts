import type { PageServerLoad } from './$types';
import { apiOrError } from '$lib/server/api';
import type { GearPage } from '$lib/dive/types';
import { urls } from '$lib/divelog-config';

export const load: PageServerLoad = async (event) => {
  const gear = await apiOrError<GearPage>(event, urls.api('/dive/gear'));
  return { gear, editHref: urls.admin.gear() };
};
