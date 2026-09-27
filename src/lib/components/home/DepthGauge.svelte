<script lang="ts">
  let { depth, progress, maxDepth }: { depth: number; progress: number; maxDepth: number } =
    $props();

  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const label = $derived(progress < 0.02 ? 'surface' : progress > 0.97 ? 'bottom' : 'descending');
</script>

<aside class="gauge" aria-label="Depth gauge: {depth} metres" style="--p: {progress}">
  <div class="rail">
    {#each ticks as t (t)}
      <span class="tick" style="top: {t * 100}%">
        <span class="tick-label num">{Math.round(t * maxDepth)}</span>
      </span>
    {/each}
    <span class="marker"></span>
  </div>
  <div class="readout">
    <span class="depth num">{depth.toFixed(1)}<small> m</small></span>
    <span class="state">{label}</span>
  </div>
</aside>

<style>
  .gauge {
    position: fixed;
    right: clamp(10px, 2vw, 28px);
    top: 50%;
    transform: translateY(-50%);
    z-index: 15;
    display: flex;
    gap: 14px;
    align-items: stretch;
    height: 42vh;
    color: var(--descent-ink, var(--color-text));
    pointer-events: none;
    opacity: 0.85;
  }
  .rail {
    position: relative;
    width: 2px;
    background: color-mix(in srgb, currentColor 25%, transparent);
    border-radius: 2px;
  }
  .tick {
    position: absolute;
    left: -5px;
    width: 12px;
    height: 1px;
    background: currentColor;
    opacity: 0.6;
  }
  .tick-label {
    position: absolute;
    right: 18px;
    top: -8px;
    font-size: 10px;
    opacity: 0.7;
  }
  .marker {
    position: absolute;
    left: -5px;
    top: calc(var(--p) * 100%);
    width: 12px;
    height: 12px;
    margin-top: -6px;
    border-radius: 50%;
    background: var(--color-warm);
    box-shadow: 0 0 0 4px var(--color-warm-soft);
    transition: top 0.08s linear;
  }
  .readout {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2px;
    min-width: 64px;
  }
  .depth {
    font-size: 22px;
    font-weight: 500;
    line-height: 1;
  }
  .depth small {
    font-size: 12px;
    opacity: 0.7;
  }
  .state {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    opacity: 0.6;
  }
  @media (max-width: 720px) {
    .gauge {
      top: auto;
      bottom: 14px;
      right: 14px;
      transform: none;
      height: auto;
    }
    .rail {
      display: none;
    }
    .readout {
      padding: 8px 12px;
      border-radius: 999px;
      background: color-mix(in srgb, var(--descent-bg, #071426) 80%, transparent);
      backdrop-filter: blur(8px);
      border: 1px solid color-mix(in srgb, currentColor 20%, transparent);
      flex-direction: row;
      align-items: baseline;
      gap: 8px;
    }
    .depth {
      font-size: 16px;
    }
  }
</style>
