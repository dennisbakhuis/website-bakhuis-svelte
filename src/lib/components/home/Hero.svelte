<script lang="ts">
  import { onMount } from 'svelte';
  import { site } from '$lib/site';
  import { reducedMotion } from '@divelog/kit';
  import { urls } from '$lib/divelog-config';

  const words = site.name.split(' ').map((word) => word.split(''));
  let clock = $state('');
  let heroEl = $state<HTMLElement>();

  function tick() {
    clock = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: site.timezone,
    }).format(new Date());
  }

  onMount(() => {
    tick();
    const interval = setInterval(tick, 15_000);
    if (!reducedMotion() && heroEl && !sessionStorage.getItem('intro-played')) {
      sessionStorage.setItem('intro-played', '1');
      const targets = heroEl.querySelectorAll<HTMLElement>('.letter');
      const rest = heroEl.querySelectorAll<HTMLElement>('[data-hero]');
      targets.forEach((el) => (el.style.opacity = '0'));
      rest.forEach((el) => (el.style.opacity = '0'));
      void import('animejs').then(({ animate, stagger }) => {
        animate(targets, {
          opacity: [0, 1],
          translateY: [28, 0],
          rotate: [4, 0],
          duration: 900,
          delay: stagger(38, { start: 150 }),
          ease: 'outExpo',
        });
        animate(rest, {
          opacity: [0, 1],
          translateY: [12, 0],
          duration: 800,
          delay: stagger(120, { start: 700 }),
          ease: 'outCubic',
        });
      });
    } else {
      heroEl?.classList.add('static');
    }
    return () => clearInterval(interval);
  });
</script>

<section class="hero" bind:this={heroEl}>
  <div class="hero-inner container">
    <div class="hero-top" data-hero>
      <span class="hero-role">{site.role}</span>
      <span class="hero-status"
        ><span class="dot" aria-hidden="true"></span>{site.availability}</span
      >
      <span class="hero-place num">{site.location}{clock ? ` · ${clock}` : ''}</span>
    </div>

    <h1 class="hero-name" aria-label={site.name}>
      {#each words as word, w (w)}
        <span class="word" aria-hidden="true">
          {#each word as letter, i (i)}
            <span class="letter">{letter}</span>
          {/each}
        </span>
      {/each}
    </h1>

    <p class="hero-tagline" data-hero>{site.tagline}</p>

    <div class="hero-bottom" data-hero>
      <a class="btn btn-solid" href="#about">Start the descent ↓</a>
      <a class="btn btn-ghost" href={urls.log()}>See the dive log</a>
    </div>
  </div>

  <svg class="wave" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true">
    <path
      d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z"
      fill="currentColor"
      opacity="0.08"
    />
    <path
      d="M0,50 C240,20 480,80 720,50 C960,20 1200,80 1440,50 L1440,80 L0,80 Z"
      fill="currentColor"
      opacity="0.06"
    />
  </svg>
</section>

<style>
  .hero {
    position: relative;
    min-height: 100svh;
    display: flex;
    align-items: center;
    padding-top: var(--header-h);
    overflow: hidden;
  }
  .hero-inner {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: clamp(20px, 3vw, 36px);
    padding-bottom: 80px;
  }
  .hero-top {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 22px;
    font-family: var(--font-mono);
    font-size: 12.5px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    opacity: 0.8;
  }
  .hero-status {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-success);
    box-shadow: 0 0 0 4px rgba(74, 222, 128, 0.2);
  }
  .hero-name {
    margin: 0;
    font-size: clamp(48px, 10.5vw, 168px);
    font-weight: 700;
    letter-spacing: -0.045em;
    line-height: 0.95;
    display: flex;
    flex-wrap: wrap;
    column-gap: 0.22em;
  }
  .word {
    display: inline-flex;
    white-space: nowrap;
  }
  .letter {
    display: inline-block;
    will-change: transform, opacity;
  }
  .hero-tagline {
    font-size: clamp(18px, 2.4vw, 26px);
    max-width: 30ch;
    margin: 0;
    opacity: 0.85;
  }
  .hero-bottom {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
  .hero .btn-solid {
    background: var(--descent-ink, var(--color-text));
    color: var(--descent-bg, var(--color-bg));
  }
  .hero .btn-solid:hover {
    background: var(--color-accent-strong);
    color: #06101f;
  }
  .hero .btn-ghost {
    border-color: color-mix(in srgb, currentColor 35%, transparent);
    color: inherit;
  }
  .wave {
    position: absolute;
    inset: auto 0 0;
    width: 100%;
    height: 80px;
    color: var(--descent-ink, #0b2a4a);
    /* The seabed belongs to the surface: it is gone after the first 240 px of
       scrolling, before the page colour turns and it would read as a pale bar. */
    opacity: calc(1 - min(1, var(--descent-scroll, 0) / 240));
    pointer-events: none;
    animation: drift 14s ease-in-out infinite alternate;
  }
  @keyframes drift {
    from {
      transform: translateX(-2%) scaleX(1.04);
    }
    to {
      transform: translateX(2%) scaleX(1);
    }
  }
</style>
