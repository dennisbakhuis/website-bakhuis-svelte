import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { apiOrError } from '$lib/server/api';
import type { Site } from '$lib/dive/types';
import { urls } from '$lib/divelog-config';

export const load: PageServerLoad = async (event) => {
  const { site } = await apiOrError<{ site: Site }>(
    event,
    urls.api(`/dive/sites/${event.params.slug}`),
  );
  redirect(302, urls.admin.siteMaps(encodeURIComponent(site.id)));
};
