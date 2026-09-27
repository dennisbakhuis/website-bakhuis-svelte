<script lang="ts">
  import type { NodeType } from '$lib/dive/sitemap';

  /** One marker symbol, drawn around (0,0); `k` is map units per screen pixel. */
  let { type, k = 1 }: { type: NodeType; k?: number } = $props();
</script>

{#if type === 'entrance'}
  <circle class="ring" r={8 * k} />
  <circle class="dot accent" r={3.6 * k} />
{:else if type === 'entry'}
  <line class="glyph" x1={0} y1={8 * k} x2={0} y2={-9 * k} />
  <path class="dot accent" d="M0 {-9 * k} L{9 * k} {-5.5 * k} L0 {-2 * k} Z" />
{:else if type === 't'}
  <line class="glyph" x1={-7 * k} y1={0} x2={7 * k} y2={0} />
  <line class="glyph" x1={0} y1={0} x2={0} y2={9 * k} />
{:else if type === 'jump'}
  <rect class="ring" x={-5.5 * k} y={-5.5 * k} width={11 * k} height={11 * k} />
{:else if type === 'restriction'}
  <line class="glyph warm" x1={-3 * k} y1={-7.5 * k} x2={-3 * k} y2={7.5 * k} />
  <line class="glyph warm" x1={3 * k} y1={-7.5 * k} x2={3 * k} y2={7.5 * k} />
{:else if type === 'end'}
  <line class="glyph warm" x1={0} y1={-8 * k} x2={0} y2={8 * k} />
  <circle class="dot warm" r={2.8 * k} />
{:else if type === 'air'}
  <circle class="ring" r={7.5 * k} />
  <path class="glyph accent" d="M{-5 * k} 0 q{2.5 * k} {-3 * k} {5 * k} 0 t{5 * k} 0" />
{:else if type === 'platform'}
  <rect class="ring" x={-7 * k} y={-7 * k} width={14 * k} height={14 * k} />
  <rect class="dot" x={-3 * k} y={-3 * k} width={6 * k} height={6 * k} />
{:else if type === 'wreck'}
  <path
    class="dot"
    d="M{-10 * k} {-1 * k} L{10 * k} {-1 * k} L{6 * k} {5 * k} L{-6 * k} {5 * k} Z"
  />
  <line class="glyph" x1={-1 * k} y1={-1 * k} x2={-1 * k} y2={-9 * k} />
{:else if type === 'object'}
  <rect class="dot" x={-5 * k} y={-5 * k} width={10 * k} height={10 * k} rx={2 * k} />
{:else if type === 'buoy'}
  <circle class="ring" r={5 * k} />
  <line class="glyph" x1={0} y1={-5 * k} x2={0} y2={-12 * k} />
  <circle class="dot" r={1.8 * k} />
{:else if type === 'hazard'}
  <path class="dot warm" d="M0 {-9 * k} L{9 * k} {7 * k} L{-9 * k} {7 * k} Z" />
  <line class="glyph inverse" x1={0} y1={-3 * k} x2={0} y2={2 * k} />
  <circle class="dot inverse" cy={4.5 * k} r={1 * k} />
{:else if type === 'poi'}
  <circle class="ring" r={6 * k} />
  <circle class="dot accent" r={2.2 * k} />
{:else if type === 'marker'}
  <path class="dot" d="M0 {-7 * k} L{6 * k} 0 L0 {7 * k} L{-6 * k} 0 Z" />
{:else}
  <circle class="dot" r={3.5 * k} />
{/if}

<style>
  .dot {
    fill: currentColor;
  }
  .ring {
    fill: var(--map-bg, var(--color-bg-elevated));
    stroke: currentColor;
    stroke-width: 2px;
    vector-effect: non-scaling-stroke;
  }
  .glyph {
    fill: none;
    stroke: currentColor;
    stroke-width: 2.5px;
    stroke-linecap: round;
    vector-effect: non-scaling-stroke;
  }
  .accent {
    color: var(--color-accent);
  }
  .warm {
    color: var(--color-warm);
  }
  .inverse {
    color: var(--map-bg, var(--color-bg-elevated));
  }
</style>
