<script lang="ts">
  import { onMount } from 'svelte';
  import PostList from '$lib/components/PostList.svelte';
  import { POST_KINDS } from '$lib/blog/posts';

  let { data } = $props();

  const kinds = [{ kind: null, plural: 'Everything' }, ...POST_KINDS];

  // The sidebar shows itself at the top of the page and slides away once you
  // are reading the list; the buttons pin it open or hide it until asked.
  type Mode = 'auto' | 'shown' | 'hidden';
  let mode = $state<Mode>('auto');
  let scrollY = $state(0);
  const visible = $derived(mode === 'shown' || (mode === 'auto' && scrollY < 140));
  const activeCount = $derived((data.kind ? 1 : 0) + (data.tag ? 1 : 0));

  onMount(() => {
    try {
      const stored = localStorage.getItem('blog-filters');
      if (stored === 'hidden' || stored === 'shown') mode = stored;
    } catch {
      // storage unavailable, keep the default
    }
  });

  function setMode(next: Mode) {
    mode = next;
    try {
      localStorage.setItem('blog-filters', next);
    } catch {
      // storage unavailable
    }
  }

  function href(kind: string | null, tag: string | null): string {
    const parts = [];
    if (kind) parts.push(`kind=${kind}`);
    if (tag) parts.push(`tag=${encodeURIComponent(tag)}`);
    return parts.length ? `/blog?${parts.join('&')}` : '/blog';
  }
</script>

<svelte:window bind:scrollY />

<section class="page container" class:with-sidebar={visible}>
  <header class="head">
    <div>
      <p class="kicker">Blog</p>
      <h1>{data.kind === 'til' ? 'Today I learned' : 'Writing'}</h1>
      <p class="lede">
        Longer articles on Python, machine learning, data engineering and diving, mixed with short <abbr
          title="Today I learned">TIL</abbr
        > notes: one command, one gotcha, one thing that cost an hour.
      </p>
    </div>
  </header>

  <div class="layout">
    <aside class="sidebar" class:visible aria-label="Filters" aria-hidden={!visible}>
      <div class="sidebar-inner">
        <div class="sidebar-head">
          <span class="sidebar-title">Filters</span>
          <button type="button" class="btn btn-ghost btn-sm" onclick={() => setMode('hidden')}
            >Hide</button
          >
        </div>

        <p class="group-label">Kind</p>
        <nav class="kinds" aria-label="Kind of post">
          {#each kinds as k (k.kind ?? 'all')}
            <a class="kind" class:active={data.kind === k.kind} href={href(k.kind, data.tag)}
              >{k.plural}</a
            >
          {/each}
        </nav>

        {#if data.tags.length}
          <p class="group-label">Tags</p>
          <nav class="tags" aria-label="Filter by tag">
            <a class="tag-row" class:active={!data.tag} href={href(data.kind, null)}>
              <span>all</span>
            </a>
            {#each data.tags as { tag, count } (tag)}
              <a class="tag-row" class:active={data.tag === tag} href={href(data.kind, tag)}>
                <span>{tag}</span>
                <span class="count num">{count}</span>
              </a>
            {/each}
          </nav>
        {/if}

        <a class="rss" href="/feed.xml">RSS feed</a>
      </div>
    </aside>

    <div class="main">
      <div class="listbar">
        <p class="count-line num">
          {data.posts.length}
          {data.posts.length === 1 ? 'post' : 'posts'}{data.kind
            ? ` · ${POST_KINDS.find((k) => k.kind === data.kind)?.plural.toLowerCase()}`
            : ''}{data.tag ? ` · ${data.tag}` : ''}
        </p>
        {#if !visible}
          <button type="button" class="btn btn-ghost btn-sm" onclick={() => setMode('shown')}
            >Filters{activeCount ? ` (${activeCount})` : ''}</button
          >
        {/if}
        {#if activeCount}
          <a class="clear" href="/blog">Clear</a>
        {/if}
      </div>
      <PostList posts={data.posts} compact={data.kind === 'til'} />
    </div>
  </div>
</section>

<style>
  .page {
    padding-top: 56px;
    padding-bottom: var(--space-section);
  }
  .head {
    max-width: 720px;
  }
  h1 {
    font-size: clamp(34px, 5vw, 52px);
  }
  .lede {
    color: var(--color-text-muted);
    font-size: 1.1rem;
    max-width: 56ch;
    margin-bottom: 8px;
  }
  .layout {
    display: grid;
    grid-template-columns: 0 minmax(0, 1fr);
    gap: 0;
    align-items: start;
    transition:
      grid-template-columns 0.3s ease,
      gap 0.3s ease;
  }
  .with-sidebar .layout {
    grid-template-columns: 232px minmax(0, 1fr);
    gap: 40px;
  }
  .sidebar {
    position: sticky;
    top: calc(var(--header-h) + 16px);
    overflow: hidden;
    opacity: 0;
    transform: translateX(-12px);
    transition:
      opacity 0.25s ease,
      transform 0.25s ease;
    pointer-events: none;
  }
  .sidebar.visible {
    opacity: 1;
    transform: none;
    pointer-events: auto;
  }
  .sidebar-inner {
    width: 232px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-top: 28px;
  }
  .sidebar-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }
  .sidebar-title {
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 15px;
  }
  .group-label {
    font-family: var(--font-mono);
    font-size: 10.5px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--color-text-muted);
    margin: 10px 0 2px;
  }
  .kinds,
  .tags {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .kind,
  .tag-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border-radius: var(--radius-sm);
    text-decoration: none;
    font-size: 14px;
    color: var(--color-text-muted);
  }
  .kind:hover,
  .tag-row:hover {
    background: var(--color-surface);
    color: var(--color-text);
  }
  .kind.active,
  .tag-row.active {
    background: var(--color-accent-soft);
    color: var(--color-accent);
    font-weight: 500;
  }
  .tags {
    max-height: 50vh;
    overflow-y: auto;
  }
  .count {
    font-size: 12px;
    opacity: 0.7;
  }
  .rss {
    margin-top: 14px;
    font-size: 13px;
    color: var(--color-text-faint);
    text-decoration: none;
  }
  .rss:hover {
    color: var(--color-accent);
  }
  .main {
    min-width: 0;
    max-width: 760px;
  }
  .listbar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 28px 0 4px;
    min-height: 44px;
  }
  .count-line {
    margin: 0;
    font-size: 13px;
    color: var(--color-text-faint);
  }
  .clear {
    font-size: 13px;
    color: var(--color-text-muted);
  }
  @media (max-width: 800px) {
    .layout,
    .with-sidebar .layout {
      grid-template-columns: minmax(0, 1fr);
      gap: 0;
    }
    .sidebar {
      position: static;
      max-height: 0;
      transform: none;
      transition:
        max-height 0.3s ease,
        opacity 0.25s ease;
    }
    .sidebar.visible {
      max-height: 80vh;
    }
    .sidebar-inner {
      width: 100%;
      padding: 20px 0 8px;
      border-bottom: 1px solid var(--color-border);
    }
    .kinds {
      flex-direction: row;
      flex-wrap: wrap;
      gap: 4px;
    }
    .tags {
      flex-direction: row;
      flex-wrap: wrap;
      gap: 4px;
      max-height: none;
    }
    .tag-row {
      border: 1px solid var(--color-border);
    }
  }
</style>
