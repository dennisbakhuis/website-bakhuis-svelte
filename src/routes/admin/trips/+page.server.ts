import type { PageServerLoad } from './$types';
import { apiOrError } from '$lib/server/api';
import type { TripAdmin } from '$lib/dive/types';
import { urls } from '$lib/divelog-config';

export const load: PageServerLoad = async (event) => ({
  trips: await apiOrError<TripAdmin[]>(event, urls.api('/admin/trips')),
});
