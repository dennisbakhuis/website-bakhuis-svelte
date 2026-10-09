<script lang="ts">
  import type { Post } from '$lib/blog/posts';
  import { formatLongDate } from '$lib/format';
  import { articleLD, jsonLdScript } from '$lib/seo';

  let { post, backHref, backLabel }: { post: Post; backHref: string; backLabel: string } = $props();

  const jsonLd = $derived(
    jsonLdScript(
      articleLD({
        title: post.title,
        description: post.summary,
        path: post.path,
        date: post.date,
        updated: post.updated,
      }),
    ),
  );
  const Content = $derived(post.component);
</script>

<svelte:head>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -- JSON.stringify output with `<` escaped -->
  {@html jsonLd}
</svelte:head>

<article class="post container narrow">
  <a class="back" href={backHref}>← {backLabel}</a>
  <header>
    <p class="meta num">
      {formatLongDate(post.date)}
      {#if post.updated}<span class="updated"> · updated {formatLongDate(post.updated)}</span>{/if}
      · {post.readingMinutes} min read
    </p>
    <h1>{post.title}</h1>
    {#if post.summary}<p class="summary">{post.summary}</p>{/if}
    <p class="tags">
      {#each post.tags as tag (tag)}<a class="tag" href="{backHref}?tag={tag}">{tag}</a>{/each}
    </p>
  </header>
  <div class="prose">
    <Content />
  </div>
</article>

<style>
  .post {
    padding-top: 48px;
    padding-bottom: var(--space-section);
  }
  .back {
    display: inline-block;
    text-decoration: none;
    font-size: 14px;
    color: var(--color-text-muted);
    margin-bottom: 28px;
  }
  .back:hover {
    color: var(--color-accent);
  }
  header {
    margin-bottom: 36px;
    padding-bottom: 28px;
    border-bottom: 1px solid var(--color-border);
  }
  .meta {
    font-size: 13px;
    color: var(--color-text-faint);
    margin-bottom: 12px;
  }
  h1 {
    font-size: clamp(30px, 5vw, 46px);
    margin-bottom: 14px;
  }
  .summary {
    font-size: 1.15rem;
    color: var(--color-text-muted);
    line-height: 1.55;
  }
  .tags {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin: 0;
  }
  .tag {
    text-decoration: none;
  }
</style>
