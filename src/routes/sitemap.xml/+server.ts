import { SITE_URL, pageMeta } from '$lib/seo';
import { allPosts } from '$lib/blog/posts';
import { api } from '$lib/server/api';
import type { DiveEnvelope, TripSummary } from '$lib/dive/types';

export const prerender = false;

export async function GET({ fetch }): Promise<Response> {
  const staticPaths = Object.keys(pageMeta).filter((p) => p !== '/privacy');
  const postPaths = allPosts.filter((p) => !p.external).map((p) => p.path);
  let divePaths: string[] = [];
  let tripPaths: string[] = [];
  try {
    const [envelope, trips] = await Promise.all([
      api<DiveEnvelope>(fetch, '/api/v1/dive/dives'),
      api<TripSummary[]>(fetch, '/api/v1/dive/trips'),
    ]);
    divePaths = envelope.dives.map((d) => `/dive/${d.number}`);
    tripPaths = trips.map((t) => `/dive/trips/${t.slug}`);
  } catch {
    // The dive log being down should not take the sitemap down with it.
  }

  const urls = [...staticPaths, ...postPaths, ...tripPaths, ...divePaths]
    .map((path) => {
      const priority = path === '/' ? '1.0' : path.startsWith('/dive/') ? '0.5' : '0.7';
      return `  <url>\n    <loc>${SITE_URL}${path === '/' ? '' : path}</loc>\n    <priority>${priority}</priority>\n  </url>`;
    })
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(body, {
    headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' },
  });
}
