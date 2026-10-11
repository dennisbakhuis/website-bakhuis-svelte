/**
 * This site's posts: the markdown in src/content, handed to the blog kit as
 * lazy loaders, so each post is its own chunk and a post page loads only its own.
 */
import { dev } from '$app/environment';
import { createBlog } from '@blog/kit/core';
import { blogConfig } from '$lib/blog-config';

export const blog = createBlog({
  config: blogConfig,
  sources: {
    blog: import.meta.glob('/src/content/blog/*.md'),
    til: import.meta.glob('/src/content/til/*.md'),
  },
  includeDrafts: dev,
});
