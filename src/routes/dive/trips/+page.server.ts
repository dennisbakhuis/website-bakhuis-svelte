import type { PageServerLoad } from './$types';
import { apiOrError } from '$lib/server/api';
import type { TripSummary } from '$lib/dive/types';

export const load: PageServerLoad = async (event) => ({
  trips: await apiOrError<TripSummary[]>(event, '/api/v1/dive/trips'),
  editHref: '/admin/trips',
});
