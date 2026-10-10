import type { PageServerLoad } from './$types';
import { loadDiveSummary } from '@divelog/kit/widgets';
import { divelog } from '$lib/divelog.server';
import { latestWriting } from '$lib/blog/posts';

export const load: PageServerLoad = async ({ fetch }) => ({
  ...(await loadDiveSummary(divelog, fetch)),
  writing: latestWriting(3).map(({ slug, kind, path, title, date, tags, summary }) => ({
    slug,
    kind,
    path,
    title,
    date,
    tags,
    summary,
  })),
});
