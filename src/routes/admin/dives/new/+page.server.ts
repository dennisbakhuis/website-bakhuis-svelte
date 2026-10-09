import type { PageServerLoad } from './$types';
import { apiOrError } from '$lib/server/api';
import { diveTemplate } from '$lib/admin/dive-input';
import type { DiveAdmin } from '$lib/dive/types';
import { urls } from '$lib/divelog-config';

export const load: PageServerLoad = async (event) => {
  const [next, dives] = await Promise.all([
    apiOrError<{ number: number }>(event, urls.api('/admin/dives/next-number')),
    apiOrError<DiveAdmin[]>(event, urls.api('/admin/dives')),
  ]);
  const last = dives.reduce<DiveAdmin | null>(
    (latest, dive) => (!latest || dive.number > latest.number ? dive : latest),
    null,
  );
  return {
    nextNumber: next.number,
    template: last
      ? {
          number: last.number,
          label: last.title || last.site?.name || 'Untitled',
          input: diveTemplate(last),
        }
      : null,
  };
};
