import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { apiOrError } from '$lib/server/api';
import type { Dive } from '$lib/dive/types';
import { urls } from '$lib/divelog-config';

export const load: PageServerLoad = async (event) => {
  const number = Number(event.params.number);
  if (!Number.isInteger(number) || number < 1) error(404, 'Dive not found');
  const dive = await apiOrError<Dive>(event, urls.api(`/dive/dives/${number}`));
  const where = dive.site ? ` at ${dive.site.name}` : '';
  return {
    dive,
    editHref: urls.admin.dive(dive.number),
    meta: {
      title: `Dive #${dive.number}${dive.title ? ` — ${dive.title}` : ''} — Dennis Bakhuis`,
      description: `${dive.max_depth_m} m for ${Math.round(dive.duration_min)} minutes${where} on ${dive.date}.`,
    },
  };
};
