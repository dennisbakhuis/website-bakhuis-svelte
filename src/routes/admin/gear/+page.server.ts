import type { PageServerLoad } from './$types';
import { apiOrError } from '$lib/server/api';
import type { GearItem, GearSetup } from '$lib/dive/types';
import { urls } from '$lib/divelog-config';

export const load: PageServerLoad = async (event) => {
  const [items, setups] = await Promise.all([
    apiOrError<GearItem[]>(event, urls.api('/admin/gear/items')),
    apiOrError<GearSetup[]>(event, urls.api('/admin/gear/setups')),
  ]);
  return { items, setups };
};
