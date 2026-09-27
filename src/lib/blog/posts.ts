import type { Component } from 'svelte';

export type PostKind = 'blog' | 'til';

export const POST_KINDS: { kind: PostKind; label: string; plural: string }[] = [
  { kind: 'blog', label: 'Article', plural: 'Articles' },
  { kind: 'til', label: 'TIL', plural: 'TIL notes' },
];

export type PostMeta = {
  title: string;
  date: string;
  updated?: string;
  tags: string[];
  summary: string;
  draft?: boolean;
  cover?: string;
  external?: string;
};

export type Post = PostMeta & {
  slug: string;
  kind: PostKind;
  path: string;
  readingMinutes: number;
  component: Component;
};

type Module = { default: Component; metadata: Record<string, unknown> };

const blogModules = import.meta.glob<Module>('/src/content/blog/*.md', { eager: true });
const tilModules = import.meta.glob<Module>('/src/content/til/*.md', { eager: true });

// mdsvex parses unquoted YAML dates into Date objects; keep ISO strings either way.
function isoDate(value: unknown): string | undefined {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'string' && value) return value.slice(0, 10);
  return undefined;
}

function slugOf(path: string): string {
  return path.split('/').pop()!.replace(/\.md$/, '');
}

function toPost(kind: PostKind, path: string, module: Module): Post {
  const m = module.metadata;
  const slug = slugOf(path);
  const words = typeof m.words === 'number' ? m.words : 600;
  return {
    slug,
    kind,
    path: `/blog/${slug}`,
    title: String(m.title ?? slug),
    date: isoDate(m.date) ?? '1970-01-01',
    updated: isoDate(m.updated),
    tags: Array.isArray(m.tags) ? m.tags.map(String) : [],
    summary: String(m.summary ?? ''),
    draft: m.draft === true,
    cover: m.cover ? String(m.cover) : undefined,
    external: m.external ? String(m.external) : undefined,
    readingMinutes: Math.max(1, Math.round(words / 220)),
    component: module.default,
  };
}

function byDateDesc(a: Post, b: Post): number {
  return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
}

function collect(kind: PostKind, modules: Record<string, Module>): Post[] {
  return Object.entries(modules)
    .map(([path, module]) => toPost(kind, path, module))
    .filter((p) => !p.draft || import.meta.env.DEV);
}

/** Articles and TIL notes are one stream; the kind is just a filter. */
export const allPosts: Post[] = [
  ...collect('blog', blogModules),
  ...collect('til', tilModules),
].sort(byDateDesc);

export const blogPosts: Post[] = allPosts.filter((p) => p.kind === 'blog');
export const tilPosts: Post[] = allPosts.filter((p) => p.kind === 'til');

export function findPost(slug: string): Post | undefined {
  return allPosts.find((p) => p.slug === slug);
}

export function isPostKind(value: string | null): value is PostKind {
  return value === 'blog' || value === 'til';
}

export function filterPosts(kind: PostKind | null, tag: string | null): Post[] {
  return allPosts.filter((p) => (!kind || p.kind === kind) && (!tag || p.tags.includes(tag)));
}

export function allTags(posts: Post[]): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of posts) for (const t of p.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function latestWriting(limit = 3): Post[] {
  return allPosts.slice(0, limit);
}
