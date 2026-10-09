import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { apiOrError } from '$lib/server/api';
import type { DiveAdmin } from '$lib/dive/types';
import { urls } from '$lib/divelog-config';

export const load: PageServerLoad = async (event) => {
  const number = Number(event.params.number);
  if (!Number.isInteger(number) || number < 1) error(404, 'Dive not found');
  const dive = await apiOrError<DiveAdmin>(event, urls.api(`/admin/dives/${number}`));
  return { dive };
};
