import type { PageServerLoad } from './$types';
import { apiOrError } from '$lib/server/api';
import type { Site } from '$lib/dive/types';

export const load: PageServerLoad = async (event) => ({
  sites: await apiOrError<Site[]>(event, '/api/v1/admin/sites'),
});
