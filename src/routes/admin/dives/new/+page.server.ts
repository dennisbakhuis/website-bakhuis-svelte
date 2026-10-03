import type { PageServerLoad } from './$types';
import { apiOrError } from '$lib/server/api';
import { diveTemplate } from '$lib/admin/dive-input';
import type { DiveAdmin } from '$lib/dive/types';

export const load: PageServerLoad = async (event) => {
  const [next, dives] = await Promise.all([
    apiOrError<{ number: number }>(event, '/api/v1/admin/dives/next-number'),
    apiOrError<DiveAdmin[]>(event, '/api/v1/admin/dives'),
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
