import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { BLOG_EXTENSIONS, blogPreprocess } from '@blog/kit/config';
import { DEFAULT_CONFIG, createUrls } from '@divelog/kit/core';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { CONTENT_DIR } from './content.config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const APP_VERSION = readFileSync(join(__dirname, 'VERSION'), 'utf8').trim();

// `[[dive:409]]` and `[[site:mex-mayan-blue]]` in posts link into the dive log,
// mounted at the kit's default base like src/lib/divelog-config.ts (a TypeScript
// module this file cannot import); src/lib/crosslinks.test.ts fails if they part.
const dive = createUrls(DEFAULT_CONFIG);

/** @type {import('@blog/kit/config').CrosslinkResolvers} */
const crosslinks = {
  dive: (ref) => {
    if (!/^\d+$/.test(ref)) return null;
    const number = String(Number(ref));
    return { href: dive.dive(number), text: `dive #${number}` };
  },
  site: (ref) => ({ href: dive.site(ref.toLowerCase()) }),
};

/** @type {import('@sveltejs/kit').Config} */
const config = {
  extensions: ['.svelte', ...BLOG_EXTENSIONS],
  preprocess: [vitePreprocess(), blogPreprocess({ crosslinks })],
  kit: {
    adapter: adapter(),
    version: { name: APP_VERSION },
    alias: { $content: CONTENT_DIR },
    // CSP: `mode: 'auto'` hashes SvelteKit's own inline bootstrap script in
    // production builds. Everything else, the map tiles included, is
    // first-party.
    csp: {
      mode: 'auto',
      directives: {
        'default-src': ['self'],
        'script-src': ['self', "'wasm-unsafe-eval'"],
        'worker-src': ['self', 'blob:'],
        'style-src': ['self', 'unsafe-inline'],
        'img-src': ['self', 'data:', 'blob:'],
        'connect-src': ['self'],
        'font-src': ['self'],
        'object-src': ['none'],
        'base-uri': ['self'],
        'form-action': ['self'],
        'frame-ancestors': ['none'],
      },
    },
  },
};

export default config;
