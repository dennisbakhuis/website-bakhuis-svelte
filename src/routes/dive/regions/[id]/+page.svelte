<script lang="ts">
  import { goto } from '$app/navigation';
  import Markdown from '$lib/components/Markdown.svelte';
  import DetailTop from '$lib/components/dive/DetailTop.svelte';
  import WorldMap from '$lib/components/dive/WorldMap.svelte';
  import { flagEmoji, formatDepth, formatHours, pluralize } from '$lib/dive/format';
  import { getDivelog } from '$lib/dive/context';

  const { urls } = getDivelog();

  let { data } = $props();
  const region = $derived(data.region);
  const stats = $derived(region.stats);
</script>

<section class="region container detail">
  <DetailTop
    back={{ href: urls.sites(), label: 'Dive sites' }}
    owner={data.owner ? { edit: { label: 'Edit region', href: data.editHref } } : null}
  />
  <p class="kicker">Region · {flagEmoji(region.country_code)} {region.country ?? ''}</p>
  <h1>{region.name}</h1>
  <p class="where num">
    {pluralize(region.sites.length, 'site')} · {pluralize(region.dives, 'dive')}{region.waters
      .length
      ? ` · ${region.waters.join(', ')}`
      : ''}
  </p>

  {#if stats && stats.dives}
    <dl class="band">
      <div>
        <dt>Dives</dt>
        <dd class="num">{stats.dives}</dd>
      </div>
      <div>
        <dt>Sites dived</dt>
        <dd class="num">{stats.sites}</dd>
      </div>
      <div>
        <dt>Time underwater</dt>
        <dd class="num">{formatHours(stats.minutes)}</dd>
      </div>
      <div>
        <dt>Deepest</dt>
        <dd class="num">{formatDepth(stats.max_depth_m)}</dd>
      </div>
      {#if stats.first_year}
        <div>
          <dt>First · last</dt>
          <dd class="num">
            {stats.first_year}{stats.last_year && stats.last_year !== stats.first_year
              ? ` · ${stats.last_year}`
              : ''}
          </dd>
        </div>
      {/if}
      {#if stats.top_site}
        <div class="top-site">
          <dt>Most dived</dt>
          <dd>
            <a href={urls.site(stats.top_site.slug)}>{stats.top_site.name}</a>
            <span class="num faint">{pluralize(stats.top_site.dives, 'dive')}</span>
          </dd>
        </div>
      {/if}
    </dl>
  {/if}

  {#if data.map && data.map.dots.length}
    <div class="region-map">
      <WorldMap
        map={data.map}
        compact
        label="Map of {pluralize(data.map.dots.length, 'dive site')} in {region.name}"
        onSelect={(slug) => slug && goto(urls.site(slug))}
      />
    </div>
  {/if}

  <div class="grid">
    <div class="prose-block">
      {#if region.body_md}<Markdown source={region.body_md} />{/if}
    </div>
    <aside>
      <h2>Sites</h2>
      <ul class="sites">
        {#each region.sites as site (site.slug)}
          <li>
            <a href={urls.site(site.slug)}>{site.name}</a>
            <span class="muted">{site.site_type}{site.area ? ` · ${site.area}` : ''}</span>
          </li>
        {/each}
      </ul>
      <a class="btn btn-ghost btn-sm" href={urls.filter({ region: region.id })}>All dives here →</a>
    </aside>
  </div>
</section>

<style>
  .region {
    padding-top: 40px;
    padding-bottom: var(--space-section);
  }
  h1 {
    font-size: clamp(30px, 5vw, 48px);
    margin-bottom: 6px;
  }
  .where {
    color: var(--color-text-muted);
    margin-bottom: 28px;
  }
  .band {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 14px 18px;
    margin: 0 0 20px;
    padding: 18px 20px;
    border-radius: var(--radius);
    border: 1px solid var(--color-border);
    background: var(--color-bg-elevated);
  }
  .band dt {
    font-family: var(--font-mono);
    font-size: 10.5px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }
  .band dd {
    margin: 2px 0 0;
    font-size: 22px;
    font-weight: 500;
  }
  .band .top-site {
    grid-column: span 2;
  }
  .band .top-site dd {
    font-size: 16px;
    display: flex;
    flex-direction: column;
  }
  .band .top-site a {
    color: inherit;
    text-decoration: none;
  }
  .band .top-site a:hover {
    color: var(--color-accent);
  }
  .faint {
    color: var(--color-text-faint);
    font-size: 12.5px;
    font-weight: 400;
  }
  .region-map {
    margin-bottom: 36px;
  }
  .grid {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(240px, 1fr);
    gap: 40px;
    align-items: start;
  }
  .prose-block {
    max-width: 72ch;
  }
  aside h2 {
    font-size: 16px;
    margin-bottom: 10px;
  }
  .sites {
    list-style: none;
    padding: 0;
    margin: 0 0 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .sites li {
    display: flex;
    flex-direction: column;
  }
  .sites a {
    text-decoration: none;
    color: var(--color-text);
    font-weight: 500;
  }
  .sites a:hover {
    color: var(--color-accent);
  }
  .muted {
    color: var(--color-text-faint);
    font-size: 13px;
    text-transform: capitalize;
  }
  @media (max-width: 800px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
</style>
