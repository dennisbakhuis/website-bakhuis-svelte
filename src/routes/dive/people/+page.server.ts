import type { PageServerLoad } from './$types';
import { apiOrError } from '$lib/server/api';
import type { Person } from '$lib/dive/types';
import { urls } from '$lib/divelog-config';

export const load: PageServerLoad = async (event) => ({
  people: await apiOrError<Person[]>(event, urls.api('/dive/people')),
  editHref: urls.admin.people(),
  meta: {
    title: 'Dive buddies — Dennis Bakhuis',
    description: 'The people I have shared the water with, and how often.',
  },
});
