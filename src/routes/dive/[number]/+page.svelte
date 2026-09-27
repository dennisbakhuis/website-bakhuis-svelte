<script lang="ts">
  import {
    flagEmoji,
    formatDepth,
    formatLongDate,
    formatTemp,
    formatTime,
    gasLabel,
    modeLabel,
  } from '$lib/dive/format';
  import DiveProfile from '$lib/components/dive/DiveProfile.svelte';
  import Gallery from '$lib/components/dive/Gallery.svelte';
  import Markdown from '$lib/components/Markdown.svelte';
  import SiteMapView from '$lib/components/dive/SiteMapView.svelte';
  import MapLegend from '$lib/components/dive/MapLegend.svelte';
  import { annotationSummary, defaultTitle, fitAnnotation, routeKeys } from '$lib/dive/sitemap';

  let { data } = $props();
  const dive = $derived(data.dive);
  const photos = $derived(dive.attachments.filter((a) => a.kind === 'photo'));
  const scans = $derived(dive.attachments.filter((a) => a.kind === 'scan'));
  const maps = $derived(dive.attachments.filter((a) => a.kind === 'map'));
  let tab = $state<'story' | 'logbook'>('story');
  let onCurrent = $state(false);
  const routeMap = $derived(onCurrent && dive.map_current ? dive.map_current : dive.map);
  const routeAnnotation = $derived(
    dive.map_annotation && routeMap ? fitAnnotation(routeMap, dive.map_annotation) : null,
  );
</script>

<article class="dive container">
  <nav class="crumbs">
    <a href="/dive">← Dive log</a>
    <span class="pager">
      {#if dive.prev_number}<a href="/dive/{dive.prev_number}">← #{dive.prev_number}</a>{/if}
      {#if dive.next_number}<a href="/dive/{dive.next_number}">#{dive.next_number} →</a>{/if}
    </span>
  </nav>

  <header class="head">
    <p class="kicker">
      Dive <span class="num">#{dive.number}</span> · {formatLongDate(dive.date)}{dive.time_in
        ? ` · ${formatTime(dive.time_in)}`
        : ''}
    </p>
    <h1>{dive.title || dive.site?.name || `Dive #${dive.number}`}</h1>
    {#if dive.site}
      <p class="where">
        <a href="/dive/sites/{dive.site.slug}"
          >{flagEmoji(dive.site.country_code)} {dive.site.name}</a
        >
        {#if dive.site.region}· {dive.site.region}{/if} · {dive.site.country_name}
        {#if dive.trip}· <span class="trip">{dive.trip.name}</span>{/if}
      </p>
    {/if}
    <p class="tags">
      {#each dive.tags as tag (tag)}<a class="tag" data-tag={tag} href="/dive?tag={tag}">{tag}</a
        >{/each}
    </p>
  </header>

  <dl class="numbers">
    <div>
      <dt>Max depth</dt>
      <dd class="num">{formatDepth(dive.max_depth_m)}</dd>
    </div>
    <div>
      <dt>Avg depth</dt>
      <dd class="num">{formatDepth(dive.avg_depth_m)}</dd>
    </div>
    <div>
      <dt>Bottom time</dt>
      <dd class="num">{dive.duration_min} min</dd>
    </div>
    <div>
      <dt>Water</dt>
      <dd class="num">{formatTemp(dive.water_temp_c)}</dd>
    </div>
    <div>
      <dt>Air</dt>
      <dd class="num">{formatTemp(dive.air_temp_c)}</dd>
    </div>
    <div>
      <dt>Visibility</dt>
      <dd class="num">{dive.visibility_m !== null ? `${dive.visibility_m} m` : '—'}</dd>
    </div>
    <div>
      <dt>Gas</dt>
      <dd>{gasLabel(dive.gas, dive.o2_pct, dive.he_pct)}</dd>
    </div>
    <div>
      <dt>Mode</dt>
      <dd>{modeLabel(dive.mode)}</dd>
    </div>
    {#if dive.suit}<div>
        <dt>Suit</dt>
        <dd>{dive.suit}</dd>
      </div>{/if}
    {#if dive.weights_kg !== null}<div>
        <dt>Weights</dt>
        <dd class="num">{dive.weights_kg} kg</dd>
      </div>{/if}
    {#if dive.gear_setup}<div>
        <dt>Setup</dt>
        <dd><a href="/dive/gear#{dive.gear_setup.slug}">{dive.gear_setup.name}</a></dd>
      </div>{/if}
    {#if dive.buddies.length}<div>
        <dt>Buddies</dt>
        <dd>{dive.buddies.join(', ')}</dd>
      </div>{/if}
    {#if dive.guide}<div>
        <dt>Guide</dt>
        <dd>{dive.guide}</dd>
      </div>{/if}
    {#if dive.rating}<div>
        <dt>Rating</dt>
        <dd aria-label="{dive.rating} out of 5">
          {'★'.repeat(dive.rating)}{'☆'.repeat(5 - dive.rating)}
        </dd>
      </div>{/if}
  </dl>

  {#if routeMap && routeAnnotation}
    <section class="block">
      <div class="map-head">
        <h2>On the map</h2>
        <p class="map-summary num">
          {routeMap.title || defaultTitle(routeMap.kind)}{dive.site ? ` · ${dive.site.name}` : ''} · {annotationSummary(
            routeMap,
            routeAnnotation,
          ) || 'no route marked'}
        </p>
      </div>
      <SiteMapView
        map={routeMap}
        title="Route of dive {dive.number}"
        route={routeKeys(routeAnnotation)}
        turn={routeAnnotation.turn}
        pins={routeAnnotation.pins}
      />
      <MapLegend map={routeMap} />
      {#if routeAnnotation.note}<p class="map-note">{routeAnnotation.note}</p>{/if}
      {#if routeAnnotation.pins.length}
        <ol class="pin-list">
          {#each routeAnnotation.pins as pin (pin.id)}<li>{pin.note || '—'}</li>{/each}
        </ol>
      {/if}
      {#if dive.map_current}
        <p class="map-revision">
          Drawn on revision {routeAnnotation.revision} of the map; it has since been updated.
          <button type="button" class="link" onclick={() => (onCurrent = !onCurrent)}
            >{onCurrent ? 'Show as drawn' : 'Show on the current map'}</button
          >
        </p>
      {/if}
    </section>
  {/if}

  {#if dive.profile && dive.profile.length > 1}
    <section class="block">
      <h2>Profile</h2>
      <DiveProfile samples={dive.profile} maxDepth={dive.max_depth_m} />
    </section>
  {/if}

  {#if dive.body_md || scans.length}
    <section class="block">
      {#if scans.length}
        <div class="tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'story'}
            class:active={tab === 'story'}
            onclick={() => (tab = 'story')}>Story</button
          >
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'logbook'}
            class:active={tab === 'logbook'}
            onclick={() => (tab = 'logbook')}>Logbook page</button
          >
        </div>
      {/if}
      {#if tab === 'story'}
        {#if dive.body_md}
          <Markdown source={dive.body_md} />
        {:else}
          <p class="muted">No story written for this one.</p>
        {/if}
      {:else}
        <Gallery items={scans} kind="scan" />
      {/if}
    </section>
  {/if}

  {#if photos.length}
    <section class="block">
      <h2>Photos</h2>
      <Gallery items={photos} kind="photo" />
    </section>
  {/if}

  {#if maps.length}
    <section class="block">
      <h2>Maps</h2>
      <Gallery items={maps} kind="map" />
    </section>
  {/if}

  {#if dive.site}
    <section class="block">
      <a class="btn btn-ghost" href="/dive/sites/{dive.site.slug}"
        >All dives at {dive.site.name} →</a
      >
    </section>
  {/if}
</article>

<style>
  .map-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
    flex-wrap: wrap;
  }
  .map-summary,
  .map-revision {
    font-size: 14px;
    color: var(--color-text-muted);
  }
  .map-note {
    margin: 10px 0 0;
  }
  .pin-list {
    margin: 8px 0 0;
    padding-left: 22px;
    color: var(--color-text-muted);
    font-size: 14px;
  }
  .link {
    background: none;
    border: 0;
    padding: 0;
    color: var(--color-accent);
    text-decoration: underline;
    cursor: pointer;
    font: inherit;
  }
  .dive {
    max-width: 900px;
    padding-top: 40px;
    padding-bottom: var(--space-section);
  }
  .crumbs {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-size: 14px;
    margin-bottom: 28px;
  }
  .crumbs a {
    text-decoration: none;
    color: var(--color-text-muted);
  }
  .crumbs a:hover {
    color: var(--color-accent);
  }
  .pager {
    display: flex;
    gap: 16px;
  }
  .head h1 {
    font-size: clamp(30px, 5vw, 48px);
    margin-bottom: 10px;
  }
  .where {
    color: var(--color-text-muted);
    font-size: 15.5px;
  }
  .where a {
    text-decoration: none;
    color: var(--color-text);
  }
  .where a:hover {
    color: var(--color-accent);
  }
  .trip {
    color: var(--color-warm);
  }
  .tags {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .tags .tag {
    text-decoration: none;
  }
  .numbers {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 14px;
    margin: 28px 0 0;
    padding: 20px;
    border-radius: var(--radius);
    border: 1px solid var(--color-border);
    background: var(--color-bg-elevated);
  }
  .numbers dt {
    font-family: var(--font-mono);
    font-size: 10.5px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }
  .numbers dd {
    margin: 2px 0 0;
    font-size: 18px;
    font-weight: 500;
  }
  .block {
    margin-top: 44px;
  }
  .block h2 {
    font-size: 22px;
    margin-bottom: 14px;
  }
  .tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 16px;
    border-bottom: 1px solid var(--color-border);
  }
  .tabs button {
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    padding: 8px 14px;
    color: var(--color-text-muted);
    font-family: var(--font-display);
    font-weight: 600;
    margin-bottom: -1px;
  }
  .tabs button.active {
    color: var(--color-text);
    border-bottom-color: var(--color-accent);
  }
  .muted {
    color: var(--color-text-faint);
  }
</style>
