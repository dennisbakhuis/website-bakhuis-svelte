import type { PageServerLoad } from './$types';
import { apiOrError } from '$lib/server/api';
import type { GearItem, GearSetup } from '$lib/dive/types';

export const load: PageServerLoad = async (event) => {
  const [items, setups] = await Promise.all([
    apiOrError<GearItem[]>(event, '/api/v1/admin/gear/items'),
    apiOrError<GearSetup[]>(event, '/api/v1/admin/gear/setups'),
  ]);
  return { items, setups };
};
