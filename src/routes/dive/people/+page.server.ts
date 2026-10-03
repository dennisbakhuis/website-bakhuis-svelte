import type { PageServerLoad } from './$types';
import { apiOrError } from '$lib/server/api';
import type { Person } from '$lib/dive/types';

export const load: PageServerLoad = async (event) => ({
  people: await apiOrError<Person[]>(event, '/api/v1/dive/people'),
  editHref: '/admin/people',
  meta: {
    title: 'Dive buddies — Dennis Bakhuis',
    description: 'The people I have shared the water with, and how often.',
  },
});
