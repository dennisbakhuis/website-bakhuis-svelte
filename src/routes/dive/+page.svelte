<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import StatsBand from '$lib/components/dive/StatsBand.svelte';
  import WorldMap from '$lib/components/dive/WorldMap.svelte';
  import Charts from '$lib/components/dive/Charts.svelte';
  import DiveFilters from '$lib/components/dive/DiveFilters.svelte';
  import DiveTable from '$lib/components/dive/DiveTable.svelte';
  import { applyFilter, filterFromParams, filterToParams, type DiveFilter } from '$lib/dive/filter';
  import { reveal } from '$lib/anim/reveal';

  let { data } = $props();

  // The URL is the single source of truth for the filter, so any view is a link.
  const filter = $derived(filterFromParams(page.url.searchParams));

  const filtered = $derived(applyFilter(data.envelope.dives, filter));

  function update(next: DiveFilter) {
    const params = filterToParams(next);
    const query = params.toString();
    void goto(`/dive${query ? `?${query}` : ''}#dives`, {
      replaceState: true,
      noScroll: true,
      keepFocus: true,
    });
  }
</script>

<section class="intro container">
  <p class="kicker">Dive log</p>
  <h1>Every dive, <span class="accent">on the record</span></h1>
  <p class="lede">
    Cold Dutch quarries, French caves on a scooter, Red Sea wrecks. Logged since the first
    open-water dive — the boring ones too, because the numbers are only honest that way.
  </p>
</section>

<StatsBand stats={data.stats} />

<section class="container map-section" use:reveal>
  <div data-reveal>
    <p class="kicker">Where</p>
    <h2>Dive sites around the world</h2>
  </div>
  <div data-reveal>
    <WorldMap
      map={data.map}
      activeSite={filter.site}
      onSelect={(slug) => update({ ...filter, site: slug })}
    />
  </div>
</section>

<section class="container charts-section" use:reveal>
  <div data-reveal>
    <p class="kicker">Numbers</p>
    <h2>By year, by depth, by type</h2>
  </div>
  <div data-reveal>
    <Charts stats={data.stats} onTag={(tag) => update({ ...filter, tags: [tag] })} />
  </div>
</section>

<section class="container list-section" id="dives">
  <p class="kicker">The log</p>
  <h2>
    {#if filtered.length === data.envelope.total}
      All {data.envelope.total} dives
    {:else}
      {filtered.length} of {data.envelope.total} dives
    {/if}
  </h2>
  <DiveFilters envelope={data.envelope} {filter} onChange={update} />
  <DiveTable dives={filtered} />
</section>

<style>
  .intro {
    padding-top: 56px;
    padding-bottom: 40px;
  }
  h1 {
    font-size: clamp(36px, 6vw, 64px);
    max-width: 16ch;
  }
  .accent {
    color: var(--color-accent);
  }
  .lede {
    color: var(--color-text-muted);
    font-size: 1.15rem;
    max-width: 56ch;
  }
  .map-section,
  .charts-section,
  .list-section {
    padding-top: var(--space-section);
  }
  .list-section {
    padding-bottom: var(--space-section);
  }
  h2 {
    font-size: clamp(26px, 3.5vw, 36px);
  }
</style>
