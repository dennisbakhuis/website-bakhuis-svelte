import { render } from 'svelte/server';
import { allPosts } from '$lib/blog/posts';
import { site } from '$lib/site';
import { SITE_URL } from '$lib/seo';

export const prerender = false;

function escape(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function GET(): Response {
  const posts = allPosts.slice(0, 30);

  const items = posts
    .map((post) => {
      const url = post.external ?? `${SITE_URL}${post.path}`;
      const html = render(post.component).body;
      return `    <item>
      <title>${escape(post.kind === 'til' ? `TIL: ${post.title}` : post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${SITE_URL}${post.path}</guid>
      <pubDate>${new Date(`${post.date}T08:00:00Z`).toUTCString()}</pubDate>
      <description>${escape(post.summary)}</description>
      <content:encoded><![CDATA[${html}]]></content:encoded>
      ${post.tags.map((t) => `<category>${escape(t)}</category>`).join('')}
    </item>`;
    })
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escape(site.name)} — writing</title>
    <link>${SITE_URL}</link>
    <description>Blog posts and TIL notes by ${escape(site.name)}</description>
    <language>en</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
