import type { PageServerLoad } from './$types';
import { api } from '$lib/server/api';
import { latestWriting } from '$lib/blog/posts';
import type { DiveSummary } from '$lib/dive/types';
import type { DiveTimeline } from '$lib/dive/sparkline';

async function optional<T>(fetchFn: typeof fetch, path: string): Promise<T | null> {
  try {
    return await api<T>(fetchFn, path);
  } catch (err) {
    console.warn(`${path} unavailable`, err);
    return null;
  }
}

export const load: PageServerLoad = async ({ fetch }) => {
  const [summary, timeline] = await Promise.all([
    optional<DiveSummary>(fetch, '/api/v1/dive/summary'),
    optional<DiveTimeline>(fetch, '/api/v1/dive/timeline'),
  ]);
  return {
    summary,
    timeline,
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
