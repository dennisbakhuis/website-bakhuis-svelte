import type { PageServerLoad } from './$types';
import { apiOrError } from '$lib/server/api';
import type { PersonPrivate } from '$lib/dive/types';
import { urls } from '$lib/divelog-config';

export const load: PageServerLoad = async (event) => ({
  people: await apiOrError<PersonPrivate[]>(event, urls.api('/admin/people')),
});
