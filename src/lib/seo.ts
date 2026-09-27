import { site } from '$lib/site';

export const SITE_URL = 'https://dennisbakhuis.nl';

export type PageMeta = {
  title: string;
  description: string;
};

export const pageMeta: Record<string, PageMeta> = {
  '/': {
    title: `${site.name} — ${site.role}`,
    description: `${site.name}: data scientist and engineer with a physics PhD, based in the Netherlands. Machine learning, data engineering, diving and writing.`,
  },
  '/dive': {
    title: `Dive log — ${site.name}`,
    description:
      'Every dive, searchable: statistics, a world map of dive sites, cave and scooter dives, gear.',
  },
  '/dive/gear': {
    title: `Dive gear — ${site.name}`,
    description: 'The setups and the gear behind the dive log, with the dives each item did.',
  },
  '/dive/sites': {
    title: `Dive sites — ${site.name}`,
    description: 'Every site in the dive log by country, with maps and cave stick maps.',
  },
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
