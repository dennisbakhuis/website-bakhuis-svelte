import type { PageServerLoad } from './$types';
import { allTags, filterPosts, isPostKind } from '$lib/blog/posts';

export const load: PageServerLoad = ({ url }) => {
  const kindParam = url.searchParams.get('kind');
  const kind = isPostKind(kindParam) ? kindParam : null;
  const tag = url.searchParams.get('tag');
  const posts = filterPosts(kind, tag).map(
    ({ path, title, date, tags, summary, readingMinutes, external, kind }) => ({
      path,
      title,
      date,
      tags,
      summary,
      readingMinutes,
      external,
      kind,
    }),
  );
  return { posts, tags: allTags(filterPosts(kind, null)), tag, kind };
};
