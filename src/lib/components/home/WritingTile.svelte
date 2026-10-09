<script lang="ts">
  import { formatDate } from '$lib/format';

  type Item = { path: string; title: string; date: string; kind: string };
  let { posts }: { posts: Item[] } = $props();
</script>

<div class="tile">
  <div class="tile-head">
    <span class="tile-title">Writing</span>
    <a class="tile-link" href="/blog">All writing →</a>
  </div>
  <ul class="list">
    {#each posts as post (post.path)}
      <li>
        <a href={post.path}>
          <span class="kind">{post.kind === 'til' ? 'TIL' : 'Article'}</span>
          <span class="title">{post.title}</span>
          <span class="date num">{formatDate(post.date)}</span>
        </a>
      </li>
    {/each}
  </ul>
</div>

<style>
  .tile {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .tile-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 12px;
  }
  .tile-title {
    font-family: var(--font-display);
    font-size: 22px;
    font-weight: 600;
  }
  .tile-link {
    font-size: 13px;
    opacity: 0.7;
    font-family: var(--font-mono);
    text-decoration: none;
  }
  .tile-link:hover {
    opacity: 1;
    color: var(--color-accent);
  }
  .list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .list a {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 2px 10px;
    text-decoration: none;
    color: inherit;
  }
  .list a:hover .title {
    color: var(--color-accent);
  }
  .kind {
    font-family: var(--font-mono);
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    opacity: 0.6;
    padding-top: 3px;
  }
  .title {
    font-size: 15px;
    line-height: 1.35;
  }
  .date {
    grid-column: 2;
    font-size: 12px;
    opacity: 0.55;
  }
</style>
