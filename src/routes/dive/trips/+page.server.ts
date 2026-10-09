import type { PageServerLoad } from './$types';
import { apiOrError } from '$lib/server/api';
import type { TripSummary } from '$lib/dive/types';
import { urls } from '$lib/divelog-config';

export const load: PageServerLoad = async (event) => ({
  trips: await apiOrError<TripSummary[]>(event, urls.api('/dive/trips')),
  editHref: urls.admin.trips(),
});
