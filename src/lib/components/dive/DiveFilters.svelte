<script lang="ts">
  import type { DiveEnvelope } from '$lib/dive/types';
  import {
    EMPTY_FILTER,
    isFilterActive,
    toggleTag,
    type DiveFilter,
    type SortKey,
  } from '$lib/dive/filter';
  import { flagEmoji } from '$lib/dive/format';

  let {
    envelope,
    filter,
    onChange,
  }: { envelope: DiveEnvelope; filter: DiveFilter; onChange: (next: DiveFilter) => void } =
    $props();

  let q = $derived(filter.q);
  let timer: ReturnType<typeof setTimeout> | undefined;

  function onSearch(value: string) {
    q = value;
    clearTimeout(timer);
    timer = setTimeout(() => onChange({ ...filter, q: value }), 220);
  }

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: 'date', label: 'Date' },
    { key: 'depth', label: 'Depth' },
    { key: 'duration', label: 'Duration' },
    { key: 'number', label: 'Number' },
  ];
</script>

<div class="filters">
  <div class="row">
    <label class="search">
      <span class="visually-hidden">Search dives</span>
      <input
        type="search"
        placeholder="Search site, country, buddy, tag…"
        value={q}
        oninput={(e) => onSearch(e.currentTarget.value)}
      />
    </label>
    <select
      value={filter.country}
      onchange={(e) => onChange({ ...filter, country: e.currentTarget.value })}
      aria-label="Country"
    >
      <option value="">All countries</option>
      {#each envelope.countries as c (c.country_code)}
        <option value={c.country_code}
          >{flagEmoji(c.country_code)} {c.country_name} ({c.dives})</option
        >
      {/each}
    </select>
    <select
      value={filter.year === null ? '' : String(filter.year)}
      onchange={(e) =>
        onChange({ ...filter, year: e.currentTarget.value ? Number(e.currentTarget.value) : null })}
      aria-label="Year"
    >
      <option value="">All years</option>
      {#each envelope.years as y (y)}
        <option value={String(y)}>{y}</option>
      {/each}
    </select>
    <select
      value={filter.setup}
      onchange={(e) => onChange({ ...filter, setup: e.currentTarget.value })}
      aria-label="Gear setup"
    >
      <option value="">Any setup</option>
      {#each envelope.gear_setups as s (s.slug)}
        <option value={s.slug}>{s.name}</option>
      {/each}
    </select>
    <select
      value={filter.gas}
      onchange={(e) => onChange({ ...filter, gas: e.currentTarget.value })}
      aria-label="Gas"
    >
      <option value="">Any gas</option>
      <option value="air">Air</option>
      <option value="nitrox">Nitrox</option>
      <option value="trimix">Trimix</option>
    </select>
  </div>
  <div class="row tags-row">
    {#each envelope.tags as tag (tag)}
      <button
        type="button"
        class="tag"
        class:active={filter.tags.includes(tag)}
        data-tag={tag}
        aria-pressed={filter.tags.includes(tag)}
        onclick={() => onChange(toggleTag(filter, tag))}
      >
        {tag}
      </button>
    {/each}
    {#if filter.site}
      <button type="button" class="tag active" onclick={() => onChange({ ...filter, site: '' })}
        >site: {filter.site} ×</button
      >
    {/if}
    <span class="spacer"></span>
    <label class="sort">
      Sort
      <select
        value={filter.sort}
        onchange={(e) => onChange({ ...filter, sort: e.currentTarget.value as SortKey })}
      >
        {#each sortOptions as o (o.key)}
          <option value={o.key}>{o.label}</option>
        {/each}
      </select>
    </label>
    <button
      type="button"
      class="btn btn-ghost btn-sm"
      onclick={() => onChange({ ...filter, desc: !filter.desc })}
      aria-label="Toggle sort direction"
    >
      {filter.desc ? '↓' : '↑'}
    </button>
    {#if isFilterActive(filter)}
      <button
        type="button"
        class="btn btn-ghost btn-sm"
        onclick={() => onChange({ ...EMPTY_FILTER, sort: filter.sort, desc: filter.desc })}
        >Clear</button
      >
    {/if}
  </div>
</div>

<style>
  .filters {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin: 20px 0 24px;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  .search {
    flex: 1 1 260px;
  }
  input,
  select {
    font: inherit;
    font-size: 14.5px;
    color: var(--color-text);
    background: var(--color-surface);
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    padding: 9px 12px;
    width: 100%;
  }
  select {
    width: auto;
  }
  .tags-row .tag {
    cursor: pointer;
  }
  .tag.active {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }
  .spacer {
    flex: 1;
  }
  .sort {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--color-text-muted);
  }
  .sort select {
    padding: 6px 10px;
  }
</style>
