<script lang="ts">
  import type { DiveEnvelope } from '$lib/dive/types';
  import {
    clearFilter,
    gasOptions,
    hitsOf,
    isFilterActive,
    toggleTag,
    type DiveFilter,
  } from '$lib/dive/filter';
  import { flagEmoji, formatDate } from '$lib/dive/format';
  import {
    DEPTH_BUCKETS,
    DURATION_BUCKETS,
    parseRange,
    rangeLabel,
    rangeValue,
    type Bucket,
  } from '$lib/dive/list-view';

  let {
    envelope,
    filter,
    onChange,
  }: {
    envelope: DiveEnvelope;
    filter: DiveFilter;
    onChange: (next: DiveFilter) => void;
  } = $props();

  let q = $derived(filter.q);
  let timer: ReturnType<typeof setTimeout> | undefined;

  function onSearch(value: string) {
    q = value;
    clearTimeout(timer);
    timer = setTimeout(() => onChange({ ...filter, q: value }), 220);
  }

  function regionLabel(id: string): string {
    return id.replace(/-/g, ' ');
  }

  const buddies = $derived(hitsOf(envelope.dives).people);
  const mixes = $derived(gasOptions(envelope.dives).filter((m) => m.value !== 'Air'));
  const siteName = $derived(
    filter.site
      ? (envelope.dives.find((d) => d.site?.slug === filter.site)?.site?.name ?? filter.site)
      : '',
  );

  const depthRange = $derived({ min: filter.minDepth, max: filter.maxDepth });
  const durationRange = $derived({ min: filter.minDuration, max: filter.maxDuration });

  /** The bucket options, plus the range from a hand-made URL when it matches none of them. */
  function rangeOptions(
    range: { min: number | null; max: number | null },
    buckets: Bucket[],
    unit: string,
  ) {
    const options = buckets.map((b) => ({ value: rangeValue(b), label: b.label }));
    const current = rangeValue(range);
    if (current && !options.some((o) => o.value === current)) {
      options.push({ value: current, label: rangeLabel(range, buckets, unit) });
    }
    return options;
  }
</script>

<div class="filters">
  <div class="row">
    <label class="search">
      <span class="visually-hidden">Search dives</span>
      <input
        type="search"
        placeholder="Search anything: site, buddy, notes, cave line, gas…"
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
      value={filter.region}
      onchange={(e) => onChange({ ...filter, region: e.currentTarget.value })}
      aria-label="Region"
    >
      <option value="">All regions</option>
      {#each envelope.regions as r (r)}
        <option value={r}>{regionLabel(r)}</option>
      {/each}
    </select>
    <select
      value={filter.siteType}
      onchange={(e) => onChange({ ...filter, siteType: e.currentTarget.value })}
      aria-label="Site type"
    >
      <option value="">Any site type</option>
      {#each envelope.site_types as t (t)}
        <option value={t}>{t}</option>
      {/each}
    </select>
    <select
      value={filter.water}
      onchange={(e) => onChange({ ...filter, water: e.currentTarget.value })}
      aria-label="Water"
    >
      <option value="">Any water</option>
      <option value="salt">Salt water</option>
      <option value="fresh">Fresh water</option>
      <option value="brackish">Brackish</option>
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
    {#if envelope.gear_setups.length}
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
    {/if}
    <select
      value={filter.gas}
      onchange={(e) => onChange({ ...filter, gas: e.currentTarget.value })}
      aria-label="Gas"
    >
      <option value="">Any gas</option>
      <option value="air">Air</option>
      <option value="nitrox">Nitrox (any)</option>
      <option value="trimix">Trimix (any)</option>
      {#each mixes as mix (mix.value)}
        <option value={mix.value}>{mix.value} ({mix.count})</option>
      {/each}
    </select>
  </div>
  <div class="row">
    <select
      value={filter.person}
      onchange={(e) => onChange({ ...filter, person: e.currentTarget.value })}
      aria-label="Buddy"
      class="plain"
    >
      <option value="">Any buddy</option>
      {#each buddies as b (b.slug)}
        <option value={b.slug}>{b.name} ({b.count})</option>
      {/each}
      {#if filter.person && !buddies.some((b) => b.slug === filter.person)}
        <option value={filter.person}>{filter.person}</option>
      {/if}
    </select>
    <select
      value={rangeValue(depthRange)}
      onchange={(e) => {
        const range = parseRange(e.currentTarget.value);
        onChange({ ...filter, minDepth: range.min, maxDepth: range.max });
      }}
      aria-label="Depth range"
      class="plain"
    >
      <option value="">Any depth</option>
      {#each rangeOptions(depthRange, DEPTH_BUCKETS, 'm') as o (o.value)}
        <option value={o.value}>{o.label}</option>
      {/each}
    </select>
    <select
      value={rangeValue(durationRange)}
      onchange={(e) => {
        const range = parseRange(e.currentTarget.value);
        onChange({ ...filter, minDuration: range.min, maxDuration: range.max });
      }}
      aria-label="Duration range"
      class="plain"
    >
      <option value="">Any duration</option>
      {#each rangeOptions(durationRange, DURATION_BUCKETS, 'min') as o (o.value)}
        <option value={o.value}>{o.label}</option>
      {/each}
    </select>
    <button
      type="button"
      class="tag toggle"
      class:active={filter.photos}
      aria-pressed={filter.photos}
      onclick={() => onChange({ ...filter, photos: !filter.photos })}>with photos</button
    >
    <button
      type="button"
      class="tag toggle"
      class:active={filter.profile}
      aria-pressed={filter.profile}
      onclick={() => onChange({ ...filter, profile: !filter.profile })}>with profile</button
    >
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
        >site: {siteName} ×</button
      >
    {/if}
    {#if filter.section}
      <button type="button" class="tag active" onclick={() => onChange({ ...filter, section: '' })}
        >line: {filter.section} ×</button
      >
    {/if}
    {#if filter.dateFrom !== null || filter.dateTo !== null}
      <button
        type="button"
        class="tag active"
        onclick={() => onChange({ ...filter, dateFrom: null, dateTo: null })}
        >{filter.dateFrom ? formatDate(filter.dateFrom) : 'start'} – {filter.dateTo
          ? formatDate(filter.dateTo)
          : 'today'} ×</button
      >
    {/if}
    {#if isFilterActive(filter)}
      <button type="button" class="tag clear" onclick={() => onChange(clearFilter(filter))}
        >Clear all ×</button
      >
    {/if}
  </div>
</div>

<style>
  .filters {
    display: flex;
    flex-direction: column;
    gap: 12px;
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
    text-transform: capitalize;
  }
  .tags-row .tag,
  .tag.toggle {
    cursor: pointer;
  }
  .tag.toggle::before {
    display: none;
  }
  select.plain {
    text-transform: none;
  }
  .tag.clear {
    border-style: dashed;
    color: var(--color-text);
  }
  .tag.clear::before {
    display: none;
  }
  .tag.active {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }
  @media (max-width: 480px) {
    select,
    .row > select {
      width: 100%;
      flex: 1 1 100%;
    }
    .search {
      flex-basis: 100%;
    }
  }
</style>
