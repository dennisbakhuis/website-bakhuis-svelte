import { site } from '$lib/site';
import { diveMetaFor, diveOgImageFor, type PageMeta } from '$lib/divelog/server/seo';
import { urls } from '$lib/divelog-config';

export const SITE_URL = 'https://dennisbakhuis.nl';

export { diveMetaFor, diveOgImageFor, type PageMeta };

export const pageMeta: Record<string, PageMeta> = {
  '/': {
    title: `${site.name} — ${site.role}`,
    description: `${site.name}: data scientist and engineer with a physics PhD, based in the Netherlands. Machine learning, data engineering, diving and writing.`,
  },
  ...diveMetaFor(urls, site.name),
  '/blog': {
    title: `Blog — ${site.name}`,
    description:
      'Articles on Python, machine learning, data engineering and diving, plus short TIL notes.',
  },
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

export function articleLD(input: {
  title: string;
  description: string;
  path: string;
  date: string;
  updated?: string;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.title,
    description: input.description,
    url: canonicalUrl(input.path),
    datePublished: input.date,
    dateModified: input.updated ?? input.date,
    author: { '@type': 'Person', name: site.name, url: `${SITE_URL}/` },
  };
}

export function jsonLdScript(data: Record<string, unknown>): string {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">${json}</script>`;
}
