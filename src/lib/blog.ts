/** This site's posts: the markdown in src/content, handed to the blog kit. */
import { dev } from '$app/environment';
import { createBlog, type PostModule } from '@blog/kit/core';
import { blogConfig } from '$lib/blog-config';

export const blog = createBlog({
  config: blogConfig,
  sources: {
    blog: import.meta.glob<PostModule>('/src/content/blog/*.md', { eager: true }),
    til: import.meta.glob<PostModule>('/src/content/til/*.md', { eager: true }),
  },
  includeDrafts: dev,
});
