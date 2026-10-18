import { sveltekit } from '@sveltejs/kit/vite';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { CONTENT_DIR, CONTENT_KINDS } from './content.config.js';

/**
 * The posts come from outside this tree (CONTENT_DIR): refuse to start or
 * build without them rather than ship an empty blog, and watch the directory
 * so a new post shows up in `pnpm dev`.
 */
function content(): Plugin {
  return {
    name: 'site-content',
    configResolved() {
      const missing = CONTENT_KINDS.filter((kind) => !existsSync(join(CONTENT_DIR, kind)));
      const posts = CONTENT_KINDS.flatMap((kind) =>
        missing.includes(kind)
          ? []
          : readdirSync(join(CONTENT_DIR, kind)).filter((f) => f.endsWith('.md')),
      );
      if (missing.length === 0 && posts.length > 0) return;
      throw new Error(
        `No blog content in ${CONTENT_DIR} (${
          missing.length ? `missing ${missing.map((k) => `${k}/`).join(', ')}` : 'no posts'
        }). Check out the content repository next to this one ` +
          `(../website-bakhuis-content) or point CONTENT_DIR at its posts/ directory.`,
      );
    },
    configureServer(server) {
      server.watcher.add(CONTENT_DIR);
    },
  };
}

// In development the SvelteKit dev server fronts the FastAPI backend the same
// way Caddy does in production, so `/api/*` and `/media/*` are same-origin and
// the admin session cookie works without CORS.
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8300';

export default defineConfig({
  plugins: [content(), sveltekit()],
  server: {
    port: 5373,
    strictPort: true,
    fs: { allow: [CONTENT_DIR] },
    proxy: {
      '/api/v1': { target: BACKEND_URL, changeOrigin: false },
      '/media': { target: BACKEND_URL, changeOrigin: false },
    },
  },
  preview: {
    port: 4373,
    strictPort: true,
  },
  // Component tests mount Svelte in jsdom, which needs the browser build of
  // the runtime rather than the server one Vitest resolves by default.
  resolve: process.env.VITEST ? { conditions: ['browser'] } : undefined,
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{js,ts}'],
    setupFiles: ['src/test-setup.ts'],
    // Vite's SSR transform of the kit drops the JSON import attribute, so
    // world-atlas must go through Vite too instead of Node's own loader.
    server: { deps: { inline: ['world-atlas'] } },
    passWithNoTests: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      // Coverage is measured on the logic modules; Svelte components and
      // route glue (load functions, redirects, feeds) are exercised in the
      // browser and by E2E, not by unit tests.
      include: ['src/lib/**/*.ts'],
      exclude: [
        'src/**/*.{test,spec}.{ts,js}',
        'src/**/*.d.ts',
        'src/lib/paraglide/**',
        'src/lib/anim/**',
        'src/lib/cap-widget-loader.ts',
      ],
      thresholds: {
        'src/lib/**': {
          lines: 85,
          functions: 90,
          branches: 80,
          statements: 85,
        },
      },
    },
  },
});
