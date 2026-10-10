import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

// In development the SvelteKit dev server fronts the FastAPI backend the same
// way Caddy does in production, so `/api/*` and `/media/*` are same-origin and
// the admin session cookie works without CORS.
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8300';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    port: 5373,
    strictPort: true,
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
