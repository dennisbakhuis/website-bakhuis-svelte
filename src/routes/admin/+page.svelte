<script lang="ts">
  import { formatDate } from '$lib/dive/format';

  let { data } = $props();
  let query = $state('');
  let show = $state<'all' | 'draft' | 'private'>('all');

  const rows = $derived(
    data.dives.filter((d) => {
      if (show !== 'all' && d.visibility !== show) return false;
      const q = query.toLowerCase();
      return (
        !q || `${d.number} ${d.title} ${d.site?.name ?? ''} ${d.date}`.toLowerCase().includes(q)
      );
    }),
  );
  const drafts = $derived(data.dives.filter((d) => d.visibility === 'draft').length);
</script>

<h1>Dives <span class="count num">{data.dives.length}</span></h1>

<div class="toolbar">
  <input type="search" placeholder="Filter…" bind:value={query} />
  <select bind:value={show}>
    <option value="all">All</option>
    <option value="draft">Drafts{drafts ? ` (${drafts})` : ''}</option>
    <option value="private">Private</option>
  </select>
  <a class="btn btn-solid btn-sm" href="/admin/dives/new">+ New dive</a>
</div>

<table>
  <thead>
    <tr
      ><th>#</th><th>Date</th><th>Title / site</th><th>Depth</th><th>Time</th><th>Tags</th><th
        >Media</th
      ><th>Status</th></tr
    >
  </thead>
  <tbody>
    {#each rows as dive (dive.id)}
      <tr>
        <td class="num">{dive.number}</td>
        <td class="num">{formatDate(dive.date)}</td>
        <td
          ><a href="/admin/dives/{dive.id}">{dive.title || dive.site?.name || 'Untitled'}</a
          >{#if dive.title && dive.site}<span class="muted"> · {dive.site.name}</span>{/if}</td
        >
        <td class="num">{dive.max_depth_m} m</td>
        <td class="num">{dive.duration_min} min</td>
        <td>{dive.tags.join(', ')}</td>
        <td class="num">{dive.attachments.length || ''}</td>
        <td><span class="status status-{dive.visibility}">{dive.visibility}</span></td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .count {
    font-size: 16px;
    color: var(--color-text-faint);
    font-weight: 400;
  }
  .toolbar {
    display: flex;
    gap: 10px;
    margin-bottom: 16px;
    align-items: center;
  }
  .toolbar input {
    max-width: 320px;
  }
  .toolbar select {
    width: auto;
  }
  .muted {
    color: var(--color-text-faint);
  }
  .status {
    font-family: var(--font-mono);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--color-surface-2);
  }
  .status-draft {
    color: var(--color-warm);
  }
  .status-private {
    color: var(--color-text-muted);
  }
  .status-public {
    color: var(--color-success);
  }
</style>
