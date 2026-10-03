import { describe, expect, it } from 'vitest';
import {
  articleLD,
  canonicalUrl,
  jsonLdScript,
  metaFor,
  ogImageFor,
  pageMeta,
  personLD,
} from './seo';

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
    expect(ogImageFor('/dive/409')).toBe('https://dennisbakhuis.nl/dive/409/og.png');
    expect(ogImageFor('/dive/409/')).toBe('https://dennisbakhuis.nl/dive/409/og.png');
    expect(ogImageFor('/dive/sites/mex-mayan-blue')).toBe(
      'https://dennisbakhuis.nl/dive/sites/mex-mayan-blue/og.png',
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

  it('describes the person and articles', () => {
    expect(personLD()['@type']).toBe('Person');
    const article = articleLD({
      title: 'A',
      description: 'B',
      path: '/blog/a',
      date: '2024-01-01',
    });
    expect(article.dateModified).toBe('2024-01-01');
    expect(article.url).toBe('https://dennisbakhuis.nl/blog/a');
  });
});
