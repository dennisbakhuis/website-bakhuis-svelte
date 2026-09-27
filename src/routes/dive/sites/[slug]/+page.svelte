<script lang="ts">
  import DiveTable from '$lib/components/dive/DiveTable.svelte';
  import Gallery from '$lib/components/dive/Gallery.svelte';
  import MapLegend from '$lib/components/dive/MapLegend.svelte';
  import SiteMapView from '$lib/components/dive/SiteMapView.svelte';
  import Markdown from '$lib/components/Markdown.svelte';
  import { flagEmoji, formatDepth, pluralize } from '$lib/dive/format';
  import { defaultTitle, mapSummary, normalizeSiteMap } from '$lib/dive/sitemap';

  let { data } = $props();
  const site = $derived(data.site);
  const deepest = $derived(Math.max(0, ...data.dives.map((d) => d.max_depth_m)));
  const maps = $derived(site.attachments.filter((a) => a.kind === 'map'));
  const photos = $derived(site.attachments.filter((a) => a.kind === 'photo'));
  const drawn = $derived(
    site.maps.map(normalizeSiteMap).filter((m) => m.nodes.length || m.areas.length),
  );
</script>

<section class="site container">
  <a class="back" href="/dive">← Dive log</a>
  <p class="kicker">Dive site · {site.site_type}</p>
  <h1>{flagEmoji(site.country_code)} {site.name}</h1>
  <p class="where">{site.region ? `${site.region}, ` : ''}{site.country_name}</p>

  <div class="grid">
    <div>
      <dl class="facts">
        <div>
          <dt>Dives here</dt>
          <dd class="num">{data.dives.length}</dd>
        </div>
        <div>
          <dt>Deepest</dt>
          <dd class="num">{formatDepth(deepest)}</dd>
        </div>
        {#if site.max_depth_m}<div>
            <dt>Site max</dt>
            <dd class="num">{formatDepth(site.max_depth_m)}</dd>
          </div>{/if}
        {#if site.lat !== null && site.lon !== null}
          <div>
            <dt>Position</dt>
            <dd class="num small">{site.lat.toFixed(4)}, {site.lon.toFixed(4)}</dd>
          </div>
        {:else}
          <div>
            <dt>Position</dt>
            <dd class="small">region only</dd>
          </div>
        {/if}
      </dl>
      {#if site.description_md}
        <Markdown source={site.description_md} />
      {/if}
    </div>
    <div class="map card">
      <svg
        viewBox="0 0 {data.map.width} {data.map.height}"
        role="img"
        aria-label="Location of {site.name}"
      >
        <path d={data.map.spherePath} class="sphere" />
        <path d={data.map.landPath} class="land" />
        {#if data.map.point}
          <circle cx={data.map.point.x} cy={data.map.point.y} r="14" class="halo" />
          <circle cx={data.map.point.x} cy={data.map.point.y} r="5" class="dot" />
        {/if}
      </svg>
    </div>
  </div>

  {#each drawn as m, i (i)}
    <section class="stick">
      <div class="stick-head">
        <h2>{m.title || defaultTitle(m.kind)}</h2>
        <p class="muted num">{defaultTitle(m.kind)} · {mapSummary(m)}</p>
      </div>
      <SiteMapView map={m} title="{m.title || defaultTitle(m.kind)} of {site.name}" />
      <MapLegend map={m} />
      {#if m.notes}<p class="muted">{m.notes}</p>{/if}
    </section>
  {/each}

  {#if maps.length}
    <section class="maps">
      <h2>{pluralize(maps.length, 'map')}</h2>
      <Gallery items={maps} kind="map" />
    </section>
  {/if}

  {#if photos.length}
    <section class="maps">
      <h2>Photos</h2>
      <Gallery items={photos} kind="photo" />
    </section>
  {/if}

  <h2>{pluralize(data.dives.length, 'dive')} at {site.name}</h2>
  <DiveTable dives={data.dives} />
</section>

<style>
  .site {
    padding-top: 40px;
    padding-bottom: var(--space-section);
  }
  .back {
    text-decoration: none;
    color: var(--color-text-muted);
    font-size: 14px;
    display: inline-block;
    margin-bottom: 24px;
  }
  h1 {
    font-size: clamp(30px, 5vw, 48px);
    margin-bottom: 6px;
  }
  .where {
    color: var(--color-text-muted);
  }
  .grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 28px;
    margin: 24px 0 48px;
    align-items: start;
  }
  .facts {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
    margin: 0 0 20px;
  }
  .facts dt {
    font-family: var(--font-mono);
    font-size: 10.5px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }
  .facts dd {
    margin: 2px 0 0;
    font-size: 22px;
    font-weight: 500;
  }
  .facts dd.small {
    font-size: 14px;
  }
  .map {
    padding: 8px;
    background: var(--color-bg-elevated);
  }
  svg {
    width: 100%;
    height: auto;
    display: block;
  }
  .sphere {
    fill: color-mix(in srgb, var(--color-accent) 4%, transparent);
    stroke: var(--color-border);
  }
  .land {
    fill: var(--color-surface-2);
    stroke: color-mix(in srgb, var(--color-text) 14%, transparent);
    stroke-width: 0.5;
  }
  .halo {
    fill: var(--color-warm);
    opacity: 0.25;
  }
  .dot {
    fill: var(--color-warm);
    stroke: var(--color-bg);
    stroke-width: 1.5;
  }
  h2 {
    font-size: 24px;
    margin-bottom: 14px;
  }
  .stick,
  .maps {
    margin-bottom: 48px;
  }
  .stick-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
    flex-wrap: wrap;
  }
  .muted {
    color: var(--color-text-muted);
    font-size: 14px;
  }
  @media (max-width: 800px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
</style>
