<script lang="ts">
  import { formatDate } from '$lib/format';

  type Item = {
    path: string;
    title: string;
    date: string;
    tags: string[];
    summary: string;
    readingMinutes: number;
    external?: string;
    kind?: string;
  };
  let { posts, compact = false }: { posts: Item[]; compact?: boolean } = $props();

  const byYear = $derived(
    posts.reduce<{ year: string; items: Item[] }[]>((acc, post) => {
      const year = post.date.slice(0, 4);
      const group = acc.find((g) => g.year === year);
      if (group) group.items.push(post);
      else acc.push({ year, items: [post] });
      return acc;
    }, []),
  );
</script>

{#each byYear as group (group.year)}
  <section class="year-group">
    <h2 class="year num">{group.year}</h2>
    <ul class="posts" class:compact>
      {#each group.items as post (post.path)}
        <li>
          <a
            class="post"
            href={post.external ?? post.path}
            rel={post.external ? 'noopener' : undefined}
          >
            <span class="post-date num">{formatDate(post.date)}</span>
            <span class="post-main">
              <span class="post-title"
                >{#if post.kind === 'til'}<span class="kind-badge">TIL</span
                  >{/if}{post.title}{post.external ? ' ↗' : ''}</span
              >
              {#if !compact}<span class="post-summary">{post.summary}</span>{/if}
              <span class="post-meta">
                {#each post.tags as tag (tag)}<span class="tag">{tag}</span>{/each}
                {#if !compact}<span class="reading num">{post.readingMinutes} min</span>{/if}
              </span>
            </span>
          </a>
        </li>
      {/each}
    </ul>
  </section>
{/each}

<style>
  .year-group {
    display: grid;
    grid-template-columns: 80px 1fr;
    gap: 24px;
    padding: 28px 0;
    border-top: 1px solid var(--color-border);
  }
  .year {
    font-size: 15px;
    color: var(--color-text-muted);
    font-weight: 500;
    margin: 4px 0 0;
  }
  .posts {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 22px;
  }
  .posts.compact {
    gap: 12px;
  }
  .post {
    display: grid;
    grid-template-columns: 100px 1fr;
    gap: 12px;
    text-decoration: none;
    color: inherit;
  }
  .post:hover .post-title {
    color: var(--color-accent);
  }
  .post-date {
    font-size: 13px;
    color: var(--color-text-faint);
    padding-top: 3px;
  }
  .post-main {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .post-title {
    font-family: var(--font-display);
    font-size: 19px;
    font-weight: 600;
    line-height: 1.3;
  }
  .compact .post-title {
    font-size: 16.5px;
    font-weight: 500;
  }
  .kind-badge {
    display: inline-block;
    font-family: var(--font-mono);
    font-size: 10.5px;
    letter-spacing: 0.1em;
    padding: 2px 6px;
    margin-right: 8px;
    border-radius: 4px;
    background: var(--color-accent-soft);
    color: var(--color-accent);
    vertical-align: middle;
  }
  .post-summary {
    color: var(--color-text-muted);
    font-size: 15px;
    line-height: 1.55;
    max-width: 62ch;
  }
  .post-meta {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    align-items: center;
  }
  .reading {
    font-size: 12px;
    color: var(--color-text-faint);
    margin-left: 4px;
  }
  @media (max-width: 640px) {
    .year-group {
      grid-template-columns: 1fr;
      gap: 10px;
    }
    .post {
      grid-template-columns: 1fr;
      gap: 4px;
    }
  }
</style>
