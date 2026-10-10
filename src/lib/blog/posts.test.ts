import { describe, expect, it } from 'vitest';
import {
  allPosts,
  allTags,
  blogPosts,
  filterPosts,
  findPost,
  isPostKind,
  latestWriting,
  tilPosts,
} from './posts';

describe('posts', () => {
  it('collects articles and TIL notes newest first', () => {
    expect(allPosts.length).toBe(blogPosts.length + tilPosts.length);
    expect(blogPosts.length).toBeGreaterThan(0);
    expect(tilPosts.length).toBeGreaterThan(0);
    const dates = allPosts.map((p) => p.date);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it('derives slug, path and reading time from the file', () => {
    const post = findPost('why-i-log-every-dive');
    expect(post?.kind).toBe('blog');
    expect(post?.path).toBe('/blog/why-i-log-every-dive');
    expect(post?.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(post?.readingMinutes).toBeGreaterThanOrEqual(1);
    expect(findPost('no-such-post')).toBeUndefined();
  });

  it('filters by kind and tag', () => {
    expect(filterPosts('til', null).every((p) => p.kind === 'til')).toBe(true);
    expect(filterPosts(null, null)).toEqual(allPosts);
    const tag = allPosts.find((p) => p.tags.length)!.tags[0];
    expect(filterPosts(null, tag).every((p) => p.tags.includes(tag))).toBe(true);
  });

  it('recognises post kinds', () => {
    expect(isPostKind('blog')).toBe(true);
    expect(isPostKind('til')).toBe(true);
    expect(isPostKind('dive')).toBe(false);
    expect(isPostKind(null)).toBe(false);
  });

  it('counts tags, most used first', () => {
    const fake = [{ tags: ['b', 'a'] }, { tags: ['a'] }] as unknown as typeof allPosts;
    expect(allTags(fake)).toEqual([
      { tag: 'a', count: 2 },
      { tag: 'b', count: 1 },
    ]);
  });

  it('returns the latest writing', () => {
    expect(latestWriting(2)).toEqual(allPosts.slice(0, 2));
  });
});
