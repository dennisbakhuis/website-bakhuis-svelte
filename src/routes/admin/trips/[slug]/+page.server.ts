import type { PageServerLoad } from './$types';
import { apiOrError } from '$lib/server/api';
import type { TripAdmin } from '$lib/dive/types';

export const load: PageServerLoad = async (event) => ({
  trip: await apiOrError<TripAdmin>(
    event,
    `/api/v1/admin/trips/${encodeURIComponent(event.params.slug)}`,
  ),
});
