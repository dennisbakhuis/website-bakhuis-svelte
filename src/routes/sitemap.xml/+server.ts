import { SITE_URL, pageMeta } from '$lib/seo';
import { allPosts } from '$lib/blog/posts';
import { divelog } from '$lib/divelog.server';
import { diveSitemapEntries } from '$lib/divelog/server/sitemap';

export const prerender = false;

function priorityOf(path: string): string {
  return path === '/' ? '1.0' : path.startsWith(`${divelog.urls.base}/`) ? '0.5' : '0.7';
}

export async function GET({ fetch }): Promise<Response> {
  const staticPaths = Object.keys(pageMeta).filter((p) => p !== '/privacy');
  const postPaths = allPosts.filter((p) => !p.external).map((p) => p.path);
  const sitePaths = [...staticPaths, ...postPaths].map((path) => ({
    path,
    priority: priorityOf(path),
  }));

  const entries = [...sitePaths, ...(await diveSitemapEntries(divelog, fetch))]
    .map(
      ({ path, priority }) =>
        `  <url>\n    <loc>${SITE_URL}${path === '/' ? '' : path}</loc>\n    <priority>${priority}</priority>\n  </url>`,
    )
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
  return new Response(body, {
    headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' },
  });
}
