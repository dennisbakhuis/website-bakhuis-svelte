<script lang="ts">
  import { onMount } from 'svelte';
  import type { ProfileSample } from '$lib/dive/types';
  import { reducedMotion } from '$lib/anim/motion';

  let { samples, maxDepth }: { samples: ProfileSample[]; maxDepth: number } = $props();

  const W = 800;
  const H = 260;
  const PAD = { l: 40, r: 44, t: 12, b: 28 };

  const tMax = $derived(Math.max(...samples.map((s) => s.t), 1));
  const dMax = $derived(Math.max(maxDepth, ...samples.map((s) => s.d)) * 1.08);
  const temps = $derived(
    samples.filter((s) => typeof s.temp === 'number') as (ProfileSample & { temp: number })[],
  );
  const tempRange = $derived(
    temps.length
      ? [Math.min(...temps.map((s) => s.temp)) - 1, Math.max(...temps.map((s) => s.temp)) + 1]
      : [0, 1],
  );

  const x = (t: number) => PAD.l + (t / tMax) * (W - PAD.l - PAD.r);
  const y = (d: number) => PAD.t + (d / dMax) * (H - PAD.t - PAD.b);
  const yTemp = (temp: number) =>
    PAD.t + (1 - (temp - tempRange[0]) / (tempRange[1] - tempRange[0] || 1)) * (H - PAD.t - PAD.b);

  const depthPath = $derived(
    samples.map((s, i) => `${i ? 'L' : 'M'}${x(s.t).toFixed(1)} ${y(s.d).toFixed(1)}`).join(' '),
  );
  const areaPath = $derived(
    `${depthPath} L${x(samples[samples.length - 1].t).toFixed(1)} ${y(0)} L${x(samples[0].t).toFixed(1)} ${y(0)} Z`,
  );
  const tempPath = $derived(
    temps
      .map((s, i) => `${i ? 'L' : 'M'}${x(s.t).toFixed(1)} ${yTemp(s.temp).toFixed(1)}`)
      .join(' '),
  );

  const depthTicks = $derived([0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * dMax)));
  const timeTicks = $derived(Array.from({ length: 6 }, (_, i) => Math.round((i / 5) * tMax)));

  let pathEl = $state<SVGPathElement>();
  let areaEl = $state<SVGPathElement>();

  onMount(() => {
    if (reducedMotion() || !pathEl || !areaEl) return;
    const length = pathEl.getTotalLength();
    pathEl.style.strokeDasharray = `${length}`;
    pathEl.style.strokeDashoffset = `${length}`;
    areaEl.style.opacity = '0';
    void import('animejs').then(({ animate }) => {
      animate(pathEl!, { strokeDashoffset: [length, 0], duration: 1800, ease: 'inOutSine' });
      animate(areaEl!, { opacity: [0, 1], duration: 900, delay: 1200, ease: 'outQuad' });
    });
  });
</script>

<figure class="profile card">
  <svg
    viewBox="0 0 {W} {H}"
    role="img"
    aria-label="Depth profile: {maxDepth} metres maximum over {Math.round(tMax / 60)} minutes"
  >
    {#each depthTicks as tick (tick)}
      <line x1={PAD.l} x2={W - PAD.r} y1={y(tick)} y2={y(tick)} class="grid" />
      <text x={PAD.l - 6} y={y(tick) + 4} class="axis" text-anchor="end">{tick} m</text>
    {/each}
    {#each timeTicks as tick (tick)}
      <text x={x(tick)} y={H - 8} class="axis" text-anchor="middle">{Math.round(tick / 60)}′</text>
    {/each}
    <path d={areaPath} class="area" bind:this={areaEl} />
    <path d={depthPath} class="line" bind:this={pathEl} />
    {#if temps.length > 1}
      <path d={tempPath} class="temp" />
      <text x={W - PAD.r + 6} y={yTemp(tempRange[1] - 1) + 4} class="axis temp-label"
        >{Math.round(tempRange[1] - 1)} °C</text
      >
      <text x={W - PAD.r + 6} y={yTemp(tempRange[0] + 1) + 4} class="axis temp-label"
        >{Math.round(tempRange[0] + 1)} °C</text
      >
    {/if}
  </svg>
  <figcaption>
    <span><i class="sw depth"></i> depth</span>
    {#if temps.length > 1}<span><i class="sw temp"></i> water temperature</span>{/if}
  </figcaption>
</figure>

<style>
  .profile {
    margin: 0;
    padding: 16px 12px 8px;
    background: var(--color-bg-elevated);
  }
  svg {
    width: 100%;
    height: auto;
    display: block;
  }
  .grid {
    stroke: var(--color-border);
    stroke-dasharray: 2 4;
  }
  .axis {
    fill: var(--color-text-faint);
    font-family: var(--font-mono);
    font-size: 11px;
  }
  .area {
    fill: color-mix(in srgb, var(--color-accent) 18%, transparent);
  }
  .line {
    fill: none;
    stroke: var(--color-accent);
    stroke-width: 2.2;
    stroke-linejoin: round;
    stroke-linecap: round;
  }
  .temp {
    fill: none;
    stroke: var(--color-warm);
    stroke-width: 1.4;
    stroke-dasharray: 4 3;
    opacity: 0.85;
  }
  .temp-label {
    fill: var(--color-warm);
  }
  figcaption {
    display: flex;
    gap: 16px;
    padding: 8px 6px 0;
    font-size: 12px;
    color: var(--color-text-muted);
    font-family: var(--font-mono);
  }
  .sw {
    display: inline-block;
    width: 14px;
    height: 2px;
    vertical-align: middle;
    margin-right: 6px;
  }
  .sw.depth {
    background: var(--color-accent);
  }
  .sw.temp {
    background: var(--color-warm);
  }
</style>
