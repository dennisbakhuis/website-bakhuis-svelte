/**
 * This site's posts: the markdown in the content repository (`$content`, set
 * from CONTENT_DIR in svelte.config.js), handed to the blog kit as lazy
 * loaders, so each post is its own chunk and a post page loads only its own.
 */
import { dev } from '$app/environment';
import { createBlog } from '@blog/kit/core';
import { blogConfig } from '$lib/blog-config';

export const blog = createBlog({
  config: blogConfig,
  sources: {
    blog: import.meta.glob('$content/blog/*.md'),
    til: import.meta.glob('$content/til/*.md'),
  },
  includeDrafts: dev,
});
