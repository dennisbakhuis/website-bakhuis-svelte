import { SITE_URL, site } from '$lib/site';
import { diveMetaFor, diveOgImageFor, type PageMeta } from '@divelog/kit/server';
import { blogPageMeta, jsonLdScript } from '@blog/kit/core';
import { urls } from '$lib/divelog-config';
import { blogConfig, blogUrls } from '$lib/blog-config';

export { SITE_URL };

export { diveMetaFor, diveOgImageFor, jsonLdScript, type PageMeta };

export const pageMeta: Record<string, PageMeta> = {
  '/': {
    title: `${site.name} — ${site.role}`,
    description: `${site.name}: data scientist and engineer with a physics PhD, based in the Netherlands. Machine learning, data engineering, diving and writing.`,
  },
  ...diveMetaFor(urls, site.name),
  [blogUrls.base]: blogPageMeta(blogConfig),
  '/contact': {
    title: `Contact — ${site.name}`,
    description: 'Get in touch about projects, talks, or diving.',
  },
  '/privacy': {
    title: `Privacy — ${site.name}`,
    description: 'What this site stores about you (very little) and why.',
  },
};

export function metaFor(pathname: string, fallback?: PageMeta): PageMeta {
  return pageMeta[pathname] ?? fallback ?? pageMeta['/'];
}

export function canonicalUrl(pathname: string): string {
  return `${SITE_URL}${pathname === '/' ? '' : pathname.replace(/\/$/, '')}`;
}

/**
 * Absolute Open Graph image for a page: an explicit `meta.image` wins, dive
 * and site pages get their generated card, everything else the default.
 */
export function ogImageFor(pathname: string, meta?: PageMeta): string {
  const explicit = meta?.image;
  if (explicit) return explicit.startsWith('http') ? explicit : `${SITE_URL}${explicit}`;
  const card = diveOgImageFor(urls, pathname);
  if (card) return `${SITE_URL}${card}`;
  return `${SITE_URL}/og-image.png`;
}

export function personLD(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: site.name,
    url: `${SITE_URL}/`,
    jobTitle: site.role,
    email: site.email,
    address: { '@type': 'PostalAddress', addressLocality: 'Enschede', addressCountry: 'NL' },
    sameAs: Object.values(site.social).filter(Boolean),
  };
}
