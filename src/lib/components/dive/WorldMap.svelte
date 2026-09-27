<script lang="ts">
  import type { MapSite } from '$lib/dive/types';
  import { dotRadius } from '$lib/dive/stats-view';
  import { flagEmoji } from '$lib/dive/format';

  type Dot = MapSite & { point: { x: number; y: number } };
  type MapData = {
    landPath: string;
    spherePath: string;
    width: number;
    height: number;
    dots: Dot[];
  };

  let {
    map,
    activeSite,
    onSelect,
  }: { map: MapData; activeSite: string; onSelect: (slug: string) => void } = $props();

  const maxDives = $derived(Math.max(...map.dots.map((d) => d.dives), 1));
  let hovered = $state<Dot | null>(null);

  function typeColor(type: string): string {
    return (
      { cave: 'var(--tag-cave)', quarry: 'var(--tag-training)', lake: 'var(--tag-drift)' }[type] ??
      'var(--color-accent)'
    );
  }
</script>

<div class="map card">
  <svg viewBox="0 0 {map.width} {map.height}" role="img" aria-labelledby="map-title" class="world">
    <title id="map-title">World map with {map.dots.length} dive sites</title>
    <path d={map.spherePath} class="sphere" />
    <path d={map.landPath} class="land" />
    {#each map.dots as dot (dot.slug)}
      <g
        class="site"
        class:active={activeSite === dot.slug}
        class:dimmed={activeSite && activeSite !== dot.slug}
        transform="translate({dot.point.x} {dot.point.y})"
        role="button"
        tabindex="0"
        aria-label="{dot.name}, {dot.dives} dives"
        onmouseenter={() => (hovered = dot)}
        onmouseleave={() => (hovered = null)}
        onfocus={() => (hovered = dot)}
        onblur={() => (hovered = null)}
        onclick={() => onSelect(activeSite === dot.slug ? '' : dot.slug)}
        onkeydown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(activeSite === dot.slug ? '' : dot.slug);
          }
        }}
      >
        <circle
          class="halo"
          r={dotRadius(dot, maxDives) * 2.2}
          style="fill: {typeColor(dot.site_type)}"
        />
        <circle class="dot" r={dotRadius(dot, maxDives)} style="fill: {typeColor(dot.site_type)}" />
      </g>
    {/each}
  </svg>
  <div class="legend">
    <span><i style="background: var(--color-accent)"></i> sea</span>
    <span><i style="background: var(--tag-cave)"></i> cave</span>
    <span><i style="background: var(--tag-training)"></i> quarry</span>
    <span><i style="background: var(--tag-drift)"></i> lake</span>
    <span class="hint">dot size = number of dives · click to filter</span>
  </div>
  <div class="tooltip" class:visible={hovered} aria-live="polite">
    {#if hovered}
      <strong>{flagEmoji(hovered.country_code)} {hovered.name}</strong>
      <span class="num"
        >{hovered.dives}
        {hovered.dives === 1 ? 'dive' : 'dives'} · max {hovered.max_depth_m} m</span
      >
    {/if}
  </div>
  <ul class="visually-hidden">
    {#each map.dots as dot (dot.slug)}
      <li><a href="/dive/sites/{dot.slug}">{dot.name}: {dot.dives} dives</a></li>
    {/each}
  </ul>
</div>

<style>
  .map {
    position: relative;
    padding: 12px;
    overflow: hidden;
    background: var(--color-bg-elevated);
  }
  .world {
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
  .site {
    cursor: pointer;
    outline: none;
  }
  .halo {
    opacity: 0.18;
    transition: opacity 0.2s ease;
  }
  .dot {
    stroke: var(--color-bg);
    stroke-width: 1.2;
    transition: transform 0.2s ease;
  }
  .site:hover .halo,
  .site:focus-visible .halo,
  .site.active .halo {
    opacity: 0.4;
  }
  .site.dimmed {
    opacity: 0.35;
  }
  .site.active .dot {
    stroke: var(--color-warm);
    stroke-width: 2;
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    padding: 10px 8px 4px;
    font-size: 12.5px;
    color: var(--color-text-muted);
    font-family: var(--font-mono);
  }
  .legend i {
    display: inline-block;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    margin-right: 6px;
  }
  .hint {
    margin-left: auto;
    color: var(--color-text-faint);
  }
  .tooltip {
    position: absolute;
    top: 16px;
    left: 16px;
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    background: var(--color-surface);
    border: 1px solid var(--color-border-strong);
    box-shadow: var(--shadow-sm);
    font-size: 13.5px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.15s ease;
  }
  .tooltip.visible {
    opacity: 1;
  }
  .tooltip .num {
    color: var(--color-text-muted);
    font-size: 12px;
  }
</style>
