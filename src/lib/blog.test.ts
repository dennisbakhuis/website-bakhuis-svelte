import { describe, expect, it } from 'vitest';
import { articleLd, postMeta } from '@blog/kit/core';
import { blog } from './blog';
import { blogConfig, blogUrls, kindLabel } from './blog-config';

describe('blog', () => {
  it('collects the articles and TIL notes newest first', () => {
    const { all } = blog.posts;
    expect(blog.posts.ofKind('blog').length).toBeGreaterThan(0);
    expect(blog.posts.ofKind('til').length).toBeGreaterThan(0);
    expect(all.length).toBe(blog.posts.ofKind('blog').length + blog.posts.ofKind('til').length);
    const dates = all.map((p) => p.date);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it('serves posts under /blog', () => {
    const post = blog.posts.find('why-i-log-every-dive');
    expect(post?.kind).toBe('blog');
    expect(post?.path).toBe('/blog/why-i-log-every-dive');
    expect(post?.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(blog.posts.find('postgres-jsonb-containment')?.kind).toBe('til');
  });

  it('keeps the list, feed and redirect URLs', () => {
    expect(blogUrls.list()).toBe('/blog');
    expect(blogUrls.list({ kind: 'til', tag: 'python' })).toBe('/blog?kind=til&tag=python');
    expect(blogUrls.feed()).toBe('/feed.xml');
    expect(blogUrls.post('a')).toBe('/blog/a');
  });

  it('keeps the page titles and article data', () => {
    expect(postMeta(blogConfig, { kind: 'til', title: 'A', summary: 'B' }).title).toBe(
      'TIL: A — Dennis Bakhuis',
    );
    const ld = articleLd(blogConfig, {
      title: 'A',
      summary: 'B',
      path: '/blog/a',
      date: '2024-01-01',
    });
    expect(ld.url).toBe('https://dennisbakhuis.nl/blog/a');
    expect(ld.author).toEqual({
      '@type': 'Person',
      name: 'Dennis Bakhuis',
      url: 'https://dennisbakhuis.nl/',
    });
  });

  it('labels the kinds on the home tile', () => {
    expect(kindLabel('blog')).toBe('Article');
    expect(kindLabel('til')).toBe('TIL');
    expect(kindLabel('other')).toBe('other');
  });
});
