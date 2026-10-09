<script lang="ts">
  import { onMount } from 'svelte';
  import { reducedMotion } from '$lib/divelog/anim/motion';

  let { progress }: { progress: number } = $props();

  const COUNT = 14;
  const bubbles = Array.from({ length: COUNT }, (_, i) => ({
    id: i,
    x: 4 + ((i * 37) % 92),
    size: 6 + ((i * 7) % 16),
    delay: (i * 530) % 6000,
  }));

  let layer = $state<HTMLElement>();

  // Fewer bubbles the deeper the visitor scrolls: they are a surface thing.
  const visible = $derived(Math.max(0, Math.round(COUNT * (1 - progress * 1.3))));

  onMount(() => {
    if (reducedMotion() || !layer) return;
    let cancelled = false;
    void import('animejs').then(({ animate }) => {
      if (cancelled || !layer) return;
      const nodes = layer.querySelectorAll<HTMLElement>('.bubble');
      nodes.forEach((node, i) => {
        animate(node, {
          translateY: ['110vh', '-10vh'],
          translateX: [0, (i % 2 ? 1 : -1) * (10 + (i % 5) * 6)],
          opacity: [0, 0.85, 0],
          duration: 9000 + (i % 4) * 2200,
          delay: bubbles[i].delay,
          ease: 'linear',
          loop: true,
        });
      });
    });
    return () => {
      cancelled = true;
    };
  });
</script>

<div class="bubbles" bind:this={layer} aria-hidden="true">
  {#each bubbles as b (b.id)}
    <span
      class="bubble"
      class:hidden={b.id >= visible}
      style="left: {b.x}%; width: {b.size}px; height: {b.size}px"
    ></span>
  {/each}
</div>

<style>
  .bubbles {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
  }
  .bubble {
    position: absolute;
    top: 0;
    border-radius: 50%;
    border: 1.5px solid color-mix(in srgb, var(--descent-ink, #fff) 70%, transparent);
    background:
      radial-gradient(
        circle at 35% 35%,
        color-mix(in srgb, #fff 70%, transparent) 0,
        transparent 45%
      ),
      color-mix(in srgb, var(--descent-ink, #fff) 14%, transparent);
    box-shadow: 0 0 6px color-mix(in srgb, var(--descent-ink, #fff) 18%, transparent);
    opacity: 0;
    transform: translateY(110vh);
    transition: visibility 0.3s;
  }
  .bubble.hidden {
    visibility: hidden;
  }
</style>
