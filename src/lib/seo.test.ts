import { describe, expect, it } from 'vitest';
import {
  canonicalUrl,
  diveMetaFor,
  jsonLdScript,
  metaFor,
  ogImageFor,
  pageMeta,
  personLD,
} from './seo';
import { DEFAULT_CONFIG, createUrls } from '@divelog/kit/core';

describe('seo', () => {
  it('builds canonical urls without trailing slashes', () => {
    expect(canonicalUrl('/')).toBe('https://dennisbakhuis.nl');
    expect(canonicalUrl('/dive/')).toBe('https://dennisbakhuis.nl/dive');
  });

  it('falls back to the home meta', () => {
    expect(metaFor('/nope')).toEqual(pageMeta['/']);
    expect(metaFor('/nope', { title: 't', description: 'd' }).title).toBe('t');
  });

  it('picks the Open Graph image per route', () => {
    expect(ogImageFor('/')).toBe('https://dennisbakhuis.nl/og-image.png');
    expect(ogImageFor('/dive/409')).toBe('https://dennisbakhuis.nl/dive/og/dive/409.png');
    expect(ogImageFor('/dive/409/')).toBe('https://dennisbakhuis.nl/dive/og/dive/409.png');
    expect(ogImageFor('/dive/sites/mex-mayan-blue')).toBe(
      'https://dennisbakhuis.nl/dive/og/site/mex-mayan-blue.png',
    );
    expect(ogImageFor('/dive/gear')).toBe('https://dennisbakhuis.nl/og-image.png');
    expect(ogImageFor('/x', { title: 't', description: 'd', image: '/a.png' })).toBe(
      'https://dennisbakhuis.nl/a.png',
    );
    expect(ogImageFor('/x', { title: 't', description: 'd', image: 'https://cdn/a.png' })).toBe(
      'https://cdn/a.png',
    );
  });

  it('escapes closing tags in JSON-LD', () => {
    const html = jsonLdScript({ x: '</script>' });
    expect(html).not.toContain('</script>"');
    expect(html.startsWith('<script type="application/ld+json">')).toBe(true);
  });

  it('describes the person', () => {
    expect(personLD()['@type']).toBe('Person');
    expect(personLD().url).toBe('https://dennisbakhuis.nl/');
    expect(personLD()).not.toHaveProperty('email');
  });

  it('keeps the blog list meta', () => {
    expect(pageMeta['/blog']).toEqual({
      title: 'Blog — Dennis Bakhuis',
      description:
        'Articles on Python, machine learning, data engineering and diving, plus short TIL notes.',
    });
  });
});

describe('dive meta', () => {
  it('keys the dive index pages by their paths, in sitemap order', () => {
    expect(Object.keys(pageMeta)).toEqual([
      '/',
      '/dive',
      '/dive/gear',
      '/dive/sites',
      '/dive/trips',
      '/blog',
      '/contact',
      '/privacy',
    ]);
    expect(pageMeta['/dive/sites'].title).toBe('Dive sites — Dennis Bakhuis');
  });

  it('follows another mount', () => {
    const urls = createUrls({ ...DEFAULT_CONFIG, basePath: '/logbook' });
    const meta = diveMetaFor(urls, 'Kim');
    expect(Object.keys(meta)).toEqual([
      '/logbook',
      '/logbook/gear',
      '/logbook/sites',
      '/logbook/trips',
    ]);
    expect(meta['/logbook'].title).toBe('Dive log — Kim');
  });
});
