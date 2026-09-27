import type { PageServerLoad } from './$types';
import { apiOrError } from '$lib/server/api';
import type { Person } from '$lib/dive/types';

export const load: PageServerLoad = async (event) => ({
  people: await apiOrError<Person[]>(event, '/api/v1/admin/people'),
});
