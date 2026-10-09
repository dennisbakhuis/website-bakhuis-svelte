import type { PageServerLoad } from './$types';
import { divelog } from '$lib/divelog.server';
import { latestWriting } from '$lib/blog/posts';
import type { DiveSummary } from '$lib/dive/types';
import type { DiveTimeline } from '$lib/dive/sparkline';
import { urls } from '$lib/divelog-config';

async function optional<T>(fetchFn: typeof fetch, path: string): Promise<T | null> {
  try {
    return await divelog.api<T>(fetchFn, path);
  } catch (err) {
    console.warn(`${path} unavailable`, err);
    return null;
  }
}

export const load: PageServerLoad = async ({ fetch }) => {
  const [summary, timeline] = await Promise.all([
    optional<DiveSummary>(fetch, urls.api('/dive/summary')),
    optional<DiveTimeline>(fetch, urls.api('/dive/timeline')),
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
