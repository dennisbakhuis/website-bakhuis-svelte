/**
 * This site's blog configuration: where the blog lives, whose it is and its
 * copy. Free of post modules, so the list page can import it without
 * shipping the posts to the browser.
 */
import { createUrls, resolveConfig } from '@blog/kit/core';
import { SITE_URL, site } from '$lib/site';

export const blogConfig = resolveConfig({
  siteName: site.name,
  siteUrl: SITE_URL,
  authorName: site.name,
  titleSuffix: site.name,
  copy: {
    kicker: 'Blog',
    title: 'Writing',
    kindTitles: { til: 'Today I learned' },
    lede: 'Longer articles on Python, machine learning, data engineering and diving, mixed with short TIL notes: one command, one gotcha, one thing that cost an hour.',
    pageTitle: 'Blog',
    description:
      'Articles on Python, machine learning, data engineering and diving, plus short TIL notes.',
    feedTitle: `${site.name} — writing`,
    feedDescription: `Blog posts and TIL notes by ${site.name}`,
    backLabel: 'All writing',
    kindBackLabels: { til: 'All TIL notes' },
  },
});

export const blogUrls = createUrls(blogConfig);
