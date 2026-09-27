import type { PageServerLoad } from './$types';
import { api } from '$lib/server/api';
import { latestWriting } from '$lib/blog/posts';
import type { DiveSummary } from '$lib/dive/types';

export const load: PageServerLoad = async ({ fetch }) => {
  let summary: DiveSummary | null = null;
  try {
    summary = await api<DiveSummary>(fetch, '/api/v1/dive/summary');
  } catch (err) {
    console.warn('dive summary unavailable', err);
  }
  return {
    summary,
    writing: latestWriting(3).map(({ slug, kind, path, title, date, tags, summary }) => ({
      slug,
      kind,
      path,
      title,
      date,
      tags,
      summary,
    })),
  };
};
