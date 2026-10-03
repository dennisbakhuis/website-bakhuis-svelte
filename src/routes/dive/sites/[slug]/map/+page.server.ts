import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { apiOrError } from '$lib/server/api';
import type { Site } from '$lib/dive/types';

export const load: PageServerLoad = async (event) => {
  const { site } = await apiOrError<{ site: Site }>(
    event,
    `/api/v1/dive/sites/${event.params.slug}`,
  );
  redirect(302, `/admin/sites/${encodeURIComponent(site.id)}/maps`);
};
