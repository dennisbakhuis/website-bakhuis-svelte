/**
 * Where the blog posts are: the posts/ directory of the private content
 * repository, not this one. CONTENT_DIR (environment) overrides it, relative to
 * this directory; the default is the sibling checkout. svelte.config.js maps
 * `$content` to it (src/lib/blog.ts globs `$content/{blog,til}/*.md`) and
 * vite.config.ts lets Vite serve it and refuses to run without it.
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const CONTENT_DIR = resolve(
  dirname(fileURLToPath(import.meta.url)),
  process.env.CONTENT_DIR || '../website-bakhuis-content/posts',
);

/** The post kinds, one directory each under CONTENT_DIR. */
export const CONTENT_KINDS = ['blog', 'til'];
