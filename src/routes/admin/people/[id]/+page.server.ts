import type { PageServerLoad } from './$types';
import { apiOrError } from '$lib/server/api';
import type { PersonPrivate } from '$lib/dive/types';

export const load: PageServerLoad = async (event) => ({
  person: await apiOrError<PersonPrivate>(
    event,
    `/api/v1/admin/people/${encodeURIComponent(event.params.id)}`,
  ),
});
