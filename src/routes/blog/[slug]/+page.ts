import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { findPost } from '$lib/blog/posts';

export const load: PageLoad = ({ params }) => {
  const post = findPost(params.slug);
  if (!post) error(404, 'Post not found');
  const title = post.kind === 'til' ? `TIL: ${post.title}` : post.title;
  return {
    post,
    meta: { title: `${title} — Dennis Bakhuis`, description: post.summary },
  };
};
