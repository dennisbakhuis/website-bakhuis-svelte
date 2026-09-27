<script lang="ts">
  import type { DiveStats } from '$lib/dive/types';
  import { barHeights } from '$lib/dive/stats-view';

  let { stats, onTag }: { stats: DiveStats; onTag: (tag: string) => void } = $props();

  const yearHeights = $derived(barHeights(stats.years, (y) => y.dives));
  const depthHeights = $derived(barHeights(stats.depth_buckets, (b) => b.dives));
  const topTags = $derived(stats.tags.slice(0, 8));
  const tagWidths = $derived(barHeights(topTags, (t) => t.count));
</script>

<div class="charts">
  <div class="chart card">
    <h3>Dives per year</h3>
    <div class="bars" style="--n: {stats.years.length}">
      {#each stats.years as year, i (year.year)}
        <div
          class="bar-col"
          title="{year.year}: {year.dives} dives, {Math.round(year.minutes / 60)} h"
        >
          <span class="bar-value num">{year.dives}</span>
          <span class="bar" style="height: {yearHeights[i]}%"></span>
          <span class="bar-label num">{String(year.year).slice(2)}</span>
        </div>
      {/each}
    </div>
  </div>

  <div class="chart card">
    <h3>Max depth</h3>
    <div class="bars" style="--n: {stats.depth_buckets.length}">
      {#each stats.depth_buckets as bucket, i (bucket.from_m)}
        <div class="bar-col" title="{bucket.from_m}–{bucket.to_m} m: {bucket.dives} dives">
          <span class="bar-value num">{bucket.dives}</span>
          <span class="bar depth" style="height: {depthHeights[i]}%"></span>
          <span class="bar-label num">{bucket.from_m}–{bucket.to_m}</span>
        </div>
      {/each}
    </div>
  </div>

  <div class="chart card">
    <h3>Dive types</h3>
    <ul class="hbars">
      {#each topTags as tag, i (tag.tag)}
        <li>
          <button type="button" class="hbar-row" onclick={() => onTag(tag.tag)}>
            <span class="tag" data-tag={tag.tag}>{tag.tag}</span>
            <span class="hbar-track"
              ><span
                class="hbar"
                style="width: {tagWidths[
                  i
                ]}%; background: var(--tag-{tag.tag}, var(--color-accent))"
              ></span></span
            >
            <span class="hbar-value num">{tag.count}</span>
          </button>
        </li>
      {/each}
    </ul>
  </div>
</div>

<style>
  .charts {
    display: grid;
    gap: 16px;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  }
  .chart {
    padding: 20px;
    background: var(--color-bg-elevated);
  }
  h3 {
    font-size: 14px;
    font-family: var(--font-mono);
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-text-muted);
    margin-bottom: 18px;
  }
  .bars {
    display: grid;
    grid-template-columns: repeat(var(--n), minmax(0, 1fr));
    gap: 6px;
    height: 160px;
    align-items: end;
  }
  .bar-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    height: 100%;
    gap: 4px;
  }
  .bar {
    width: 100%;
    max-width: 36px;
    min-height: 2px;
    border-radius: 4px 4px 2px 2px;
    background: var(--color-accent);
    transition: height 0.4s ease;
  }
  .bar.depth {
    background: var(--tag-deep);
  }
  .bar-value {
    font-size: 11px;
    color: var(--color-text-muted);
  }
  .bar-label {
    font-size: 10.5px;
    color: var(--color-text-faint);
    white-space: nowrap;
  }
  .hbars {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .hbar-row {
    width: 100%;
    display: grid;
    grid-template-columns: 96px 1fr 32px;
    gap: 10px;
    align-items: center;
    background: none;
    border: none;
    padding: 2px 0;
    color: inherit;
    text-align: left;
  }
  .hbar-row:hover .tag {
    border-color: var(--color-accent);
  }
  .hbar-track {
    height: 8px;
    border-radius: 4px;
    background: var(--color-surface-2);
    overflow: hidden;
  }
  .hbar {
    display: block;
    height: 100%;
    border-radius: 4px;
  }
  .hbar-value {
    font-size: 12px;
    color: var(--color-text-muted);
    text-align: right;
  }
</style>
