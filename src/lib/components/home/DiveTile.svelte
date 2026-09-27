<script lang="ts">
  import type { DiveSummary } from '$lib/dive/types';
  import { counter } from '$lib/anim/counter';

  let { summary }: { summary: DiveSummary | null } = $props();
</script>

<a class="tile" href="/dive">
  <div class="tile-head">
    <span class="tile-title">Diving</span>
    <span class="tile-link">Open the log →</span>
  </div>
  <p class="tile-blurb">
    Cold Dutch water, French caves, a scooter when the line is long enough. Every dive is logged —
    the boring ones too.
  </p>
  {#if summary}
    <dl class="stats">
      <div>
        <dt>Dives</dt>
        <dd class="num" use:counter={{ value: summary.total_dives }}>{summary.total_dives}</dd>
      </div>
      <div>
        <dt>Hours down</dt>
        <dd class="num" use:counter={{ value: summary.total_hours, decimals: 0 }}>
          {summary.total_hours}
        </dd>
      </div>
      <div>
        <dt>Deepest</dt>
        <dd class="num" use:counter={{ value: summary.max_depth_m, decimals: 0, suffix: ' m' }}>
          {summary.max_depth_m} m
        </dd>
      </div>
      <div>
        <dt>Countries</dt>
        <dd class="num" use:counter={{ value: summary.countries }}>{summary.countries}</dd>
      </div>
      <div>
        <dt>Cave dives</dt>
        <dd class="num" use:counter={{ value: summary.cave_dives }}>{summary.cave_dives}</dd>
      </div>
      <div>
        <dt>Scooter dives</dt>
        <dd class="num" use:counter={{ value: summary.scooter_dives }}>{summary.scooter_dives}</dd>
      </div>
    </dl>
  {:else}
    <p class="tile-blurb muted">
      The dive log is taking a surface interval — try again in a moment.
    </p>
  {/if}
</a>

<style>
  .tile {
    display: flex;
    flex-direction: column;
    height: 100%;
    text-decoration: none;
    color: inherit;
  }
  .tile-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 8px;
  }
  .tile-title {
    font-family: var(--font-display);
    font-size: 22px;
    font-weight: 600;
  }
  .tile-link {
    font-size: 13px;
    opacity: 0.7;
    font-family: var(--font-mono);
  }
  .tile:hover .tile-link {
    opacity: 1;
    color: var(--color-accent);
  }
  .tile-blurb {
    opacity: 0.8;
    font-size: 15px;
    line-height: 1.5;
    max-width: 44ch;
  }
  .muted {
    opacity: 0.5;
  }
  .stats {
    margin: auto 0 0;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px 12px;
  }
  .stats dt {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    opacity: 0.65;
  }
  .stats dd {
    margin: 2px 0 0;
    font-size: clamp(26px, 3vw, 36px);
    font-weight: 500;
    line-height: 1;
  }
</style>
