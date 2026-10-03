<script lang="ts">
  import type { DiveListItem, DiveStats } from '$lib/dive/types';
  import { barHeights, durationBuckets, typicalDive } from '$lib/dive/stats-view';
  import { counter } from '$lib/anim/counter';

  let {
    stats,
    dives = [],
    onTag,
    onSite,
    onPerson,
  }: {
    stats: DiveStats;
    dives?: DiveListItem[];
    onTag: (tag: string) => void;
    onSite?: (slug: string) => void;
    onPerson?: (slug: string) => void;
  } = $props();

  const yearHeights = $derived(barHeights(stats.years, (y) => y.dives));
  const depthHeights = $derived(barHeights(stats.depth_buckets, (b) => b.dives));
  const topTags = $derived(stats.tags.slice(0, 8));
  const tagWidths = $derived(barHeights(topTags, (t) => t.count));

  const cumulative = $derived.by(() => {
    let total = 0;
    return stats.years.map((y) => {
      total += y.minutes;
      return { year: y.year, hours: total / 60 };
    });
  });
  const cumulativePath = $derived.by(() => {
    if (cumulative.length < 2) return { line: '', area: '', max: 0 };
    const max = cumulative[cumulative.length - 1].hours || 1;
    const W = 320;
    const H = 120;
    const x = (i: number) => (i / (cumulative.length - 1)) * W;
    const y = (h: number) => H - (h / max) * (H - 8);
    const line = cumulative
      .map((c, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(c.hours).toFixed(1)}`)
      .join(' ');
    return { line, area: `${line} L${W} ${H} L0 ${H} Z`, max };
  });

  function top<T extends { slug: string; name: string }>(
    pick: (dive: DiveListItem) => T[],
    n: number,
  ): { slug: string; name: string; count: number }[] {
    const counts: Record<string, { slug: string; name: string; count: number }> = {};
    for (const dive of dives) {
      for (const item of pick(dive)) {
        const row = (counts[item.slug] ??= { slug: item.slug, name: item.name, count: 0 });
        row.count += 1;
      }
    }
    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, n);
  }

  const topSites = $derived(top((d) => (d.site ? [d.site] : []), 8));
  const topPeople = $derived(top((d) => d.buddies, 8));
  const siteWidths = $derived(barHeights(topSites, (s) => s.count));
  const peopleWidths = $derived(barHeights(topPeople, (p) => p.count));

  const byMonth = $derived.by(() => {
    const months = Array.from({ length: 12 }, () => ({ dives: 0, temps: [] as number[] }));
    for (const dive of dives) {
      const m = Number(dive.date.slice(5, 7)) - 1;
      months[m].dives += 1;
      if (dive.water_temp_c !== null) months[m].temps.push(dive.water_temp_c);
    }
    return months.map((m, i) => ({
      label: 'JFMAMJJASOND'[i],
      dives: m.dives,
      temp: m.temps.length ? m.temps.reduce((a, b) => a + b, 0) / m.temps.length : null,
    }));
  });
  const monthHeights = $derived(barHeights(byMonth, (m) => m.dives));

  const durations = $derived(durationBuckets(dives));
  const durationHeights = $derived(barHeights(durations, (b) => b.dives));
  const typical = $derived(typicalDive(dives, stats));

  function numeric(value: string): { n: number; suffix: string; decimals: number } | null {
    const m = /^([\d.]+)(.*)$/.exec(value);
    if (!m) return null;
    const n = Number(m[1]);
    if (!Number.isFinite(n)) return null;
    return { n, suffix: m[2], decimals: m[1].includes('.') ? 1 : 0 };
  }
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
    <h3>Hours underwater, cumulative</h3>
    {#if cumulativePath.line}
      <svg viewBox="0 0 320 124" class="area-chart" role="img" aria-label="Cumulative bottom time">
        <path d={cumulativePath.area} class="cum-area" />
        <path d={cumulativePath.line} class="cum-line" />
        <text x="318" y="12" text-anchor="end" class="axis num"
          >{Math.round(cumulativePath.max)} h</text
        >
        <text x="0" y="122" class="axis num">{cumulative[0].year}</text>
        <text x="320" y="122" text-anchor="end" class="axis num"
          >{cumulative[cumulative.length - 1].year}</text
        >
      </svg>
    {/if}
  </div>

  {#if typical.length}
    <div class="chart card">
      <h3>Typical dive</h3>
      <dl class="tiles">
        {#each typical as tile (tile.label)}
          {@const parsed = numeric(tile.value)}
          <div class="tile">
            <dt>{tile.label}</dt>
            <dd>
              {#if parsed}
                <span
                  class="num"
                  use:counter={{
                    value: parsed.n,
                    suffix: parsed.suffix,
                    decimals: parsed.decimals,
                    duration: 1200,
                  }}>{tile.value}</span
                >
              {:else}
                <span class="num">{tile.value}</span>
              {/if}
              {#if tile.note}<small>{tile.note}</small>{/if}
            </dd>
          </div>
        {/each}
      </dl>
    </div>
  {/if}

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

  {#if dives.length}
    <div class="chart card">
      <h3>Bottom time</h3>
      <div class="bars" style="--n: {durations.length}">
        {#each durations as bucket, i (bucket.from_min)}
          <div class="bar-col" title="{bucket.label} min: {bucket.dives} dives">
            <span class="bar-value num">{bucket.dives}</span>
            <span class="bar time" style="height: {durationHeights[i]}%"></span>
            <span class="bar-label num">{bucket.label}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#if dives.length}
    <div class="chart card">
      <h3>By month · water temperature</h3>
      <div class="bars" style="--n: 12">
        {#each byMonth as month, i (i)}
          <div
            class="bar-col"
            title="{month.dives} dives{month.temp !== null
              ? `, water ${month.temp.toFixed(1)} °C`
              : ''}"
          >
            <span class="bar-value num"
              >{month.temp !== null ? Math.round(month.temp) + '°' : ''}</span
            >
            <span class="bar month" style="height: {monthHeights[i]}%"></span>
            <span class="bar-label num">{month.label}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

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

  {#if topSites.length}
    <div class="chart card">
      <h3>Most dived sites</h3>
      <ul class="hbars">
        {#each topSites as site, i (site.slug)}
          <li>
            <button type="button" class="hbar-row wide" onclick={() => onSite?.(site.slug)}>
              <span class="name">{site.name}</span>
              <span class="hbar-track"
                ><span class="hbar" style="width: {siteWidths[i]}%"></span></span
              >
              <span class="hbar-value num">{site.count}</span>
            </button>
          </li>
        {/each}
      </ul>
    </div>
  {/if}

  {#if topPeople.length}
    <div class="chart card">
      <h3>Dived most with</h3>
      <ul class="hbars">
        {#each topPeople as person, i (person.slug)}
          <li>
            <button type="button" class="hbar-row wide" onclick={() => onPerson?.(person.slug)}>
              <span class="name">{person.name}</span>
              <span class="hbar-track"
                ><span class="hbar warm" style="width: {peopleWidths[i]}%"></span></span
              >
              <span class="hbar-value num">{person.count}</span>
            </button>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</div>

<style>
  /* Six tracks so a card can take a third, a half or the whole row: whatever
     the count, the last row is always filled. */
  .charts {
    display: grid;
    gap: 16px;
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
  .chart {
    grid-column: span 2;
    min-width: 0;
    padding: 20px;
    background: var(--color-bg-elevated);
  }
  .chart:last-child:nth-child(3n + 1) {
    grid-column: span 6;
  }
  .chart:nth-last-child(2):nth-child(3n + 1),
  .chart:last-child:nth-child(3n + 2) {
    grid-column: span 3;
  }
  @media (max-width: 900px) {
    .chart,
    .chart:last-child:nth-child(3n + 1),
    .chart:nth-last-child(2):nth-child(3n + 1),
    .chart:last-child:nth-child(3n + 2) {
      grid-column: span 3;
    }
    .chart:last-child:nth-child(odd) {
      grid-column: span 6;
    }
  }
  @media (max-width: 560px) {
    .chart,
    .chart:last-child:nth-child(3n + 1),
    .chart:nth-last-child(2):nth-child(3n + 1),
    .chart:last-child:nth-child(3n + 2),
    .chart:last-child:nth-child(odd) {
      grid-column: span 6;
    }
  }
  .tiles {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(88px, 1fr));
    gap: 18px 10px;
    margin: 0;
  }
  .tile dt {
    font-family: var(--font-mono);
    font-size: 10.5px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-faint);
    margin-bottom: 4px;
  }
  .tile dd {
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .tile .num {
    font-family: var(--font-display);
    font-size: 22px;
    font-weight: 600;
    line-height: 1.1;
    color: var(--color-text);
  }
  .tile small {
    font-size: 11.5px;
    color: var(--color-text-muted);
  }
  .bar.time {
    background: var(--color-warm);
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
  .bar.month {
    background: var(--tag-drift);
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
  .area-chart {
    width: 100%;
    height: auto;
    display: block;
  }
  .cum-area {
    fill: color-mix(in srgb, var(--color-accent) 18%, transparent);
  }
  .cum-line {
    fill: none;
    stroke: var(--color-accent);
    stroke-width: 2;
    stroke-linejoin: round;
  }
  .axis {
    fill: var(--color-text-faint);
    font-size: 10px;
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
  .hbar-row.wide {
    grid-template-columns: 128px 1fr 32px;
  }
  .hbar-row:hover .tag,
  .hbar-row:hover .name {
    color: var(--color-accent);
  }
  .name {
    font-size: 13px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
    background: var(--color-accent);
  }
  .hbar.warm {
    background: var(--color-warm);
  }
  .hbar-value {
    font-size: 12px;
    color: var(--color-text-muted);
    text-align: right;
  }
</style>
