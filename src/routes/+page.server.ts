import type { PageServerLoad } from './$types';
import { loadDiveSummary } from '@divelog/kit/widgets';
import { divelog } from '$lib/divelog.server';
import { loadLatestWriting } from '@blog/kit/widgets';
import { blog } from '$lib/blog';

export const load: PageServerLoad = async ({ fetch }) => ({
  ...(await loadDiveSummary(divelog, fetch)),
  writing: await loadLatestWriting(blog),
});
