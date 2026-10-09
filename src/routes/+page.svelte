<script lang="ts">
  import { onMount } from 'svelte';
  import { site, skills, work, likes } from '$lib/site';
  import { goHref } from '$lib/go-targets';
  import { startDescent, type DescentState } from '$lib/anim/descent';
  import { reveal } from '$lib/anim/reveal';
  import Hero from '$lib/components/home/Hero.svelte';
  import DepthGauge from '$lib/components/home/DepthGauge.svelte';
  import Bubbles from '$lib/components/home/Bubbles.svelte';
  import Fish from '$lib/components/home/Fish.svelte';
  import DiveTile from '$lib/components/home/DiveTile.svelte';
  import DivelogProvider from '$lib/components/dive/DivelogProvider.svelte';
  import { divelogConfig, urls } from '$lib/divelog-config';
  import WritingTile from '$lib/components/home/WritingTile.svelte';
  import { formatDate } from '$lib/dive/format';
  import { latestMatches } from '$lib/dive/sparkline';

  let { data } = $props();

  const maxDepth = $derived(data.summary?.max_depth_m ?? 40);
  const lastDiveText = $derived(
    data.summary?.last_dive
      ? `${formatDate(data.summary.last_dive)}${data.summary.last_dive_site ? ` · ${data.summary.last_dive_site}` : ''}`
      : '',
  );
  const lastDiveHref = $derived(
    data.timeline?.latest && latestMatches(data.timeline, data.summary?.last_dive ?? null)
      ? urls.dive(data.timeline.latest.number)
      : null,
  );
  let descent = $state<DescentState>({
    progress: 0,
    depth: 0,
    background: '#eaf4fb',
    ink: '#0b2a4a',
  });
  let root = $state<HTMLElement>();

  // The header lives outside this page, so the palette also goes on <html>
  // for it to pick up; cleared again when navigating away.
  onMount(() => {
    if (!root) return;
    const html = document.documentElement;
    const stop = startDescent(root, maxDepth, (s) => {
      descent = s;
      html.style.setProperty('--descent-bg', s.background);
      html.style.setProperty('--descent-ink', s.ink);
    });
    return () => {
      stop();
      html.style.removeProperty('--descent-bg');
      html.style.removeProperty('--descent-ink');
    };
  });
</script>

<div
  class="descent"
  bind:this={root}
  style="--descent-bg: {descent.background}; --descent-ink: {descent.ink}; --descent-progress: {descent.progress}"
>
  <Bubbles progress={descent.progress} />
  <Fish progress={descent.progress} />
  <DepthGauge depth={descent.depth} progress={descent.progress} {maxDepth} />

  <Hero />

  <section class="section container" id="about" use:reveal>
    <div class="about-grid">
      <div data-reveal>
        <p class="kicker">About</p>
        <h2>From physics PhD to making data <em>useful</em></h2>
      </div>
      <div class="about-body">
        <p data-reveal>
          I'm a data scientist and engineer at TenneT, the Dutch–German grid operator, with a PhD in
          experimental physics from the University of Twente — turbulence, bubbles, and a lot of
          laser light. That is where the habit of measuring things properly comes from.
        </p>
        <p data-reveal>
          Fifteen-plus years of Python later, I build end-to-end machine-learning systems: the
          model, the pipeline around it, and the boring parts that make it survive contact with
          production. Lately that means LLMs, and Rust when Python is too slow.
        </p>
        <p data-reveal>
          I write about it on the <a href="/blog">blog</a>, long articles and short
          <a href="/blog?kind=til">TIL notes</a> alike, and I spend as much time as I can underwater.
        </p>
        <ul class="skills" data-reveal>
          {#each skills as skill (skill)}
            <li>{skill}</li>
          {/each}
        </ul>
      </div>
    </div>
  </section>

  <section class="section container" id="likes" use:reveal={{ stagger: 90 }}>
    <p class="kicker" data-reveal>Things I like</p>
    <h2 data-reveal>The bit that isn't on LinkedIn</h2>
    <div class="bento">
      <div class="bento-item bento-dive" data-reveal>
        <DivelogProvider config={divelogConfig}>
          <DiveTile summary={data.summary} timeline={data.timeline} />
        </DivelogProvider>
      </div>
      <div class="bento-item" data-reveal>
        <WritingTile posts={data.writing} />
      </div>
      {#each likes.filter((l) => l.id !== 'diving' && l.id !== 'writing') as like (like.id)}
        <a class="bento-item bento-link" href={like.href ?? '#'} data-reveal>
          <span class="bento-title">{like.title}</span>
          <span class="bento-blurb">{like.blurb}</span>
        </a>
      {/each}
    </div>
  </section>

  <section class="section container" id="work" use:reveal={{ stagger: 90 }}>
    <p class="kicker" data-reveal>Work</p>
    <h2 data-reveal>Selected things I've built</h2>
    <div class="work-grid">
      {#each work as item (item.title)}
        <article class="card work-card" data-reveal>
          <p class="work-year num">{item.year}</p>
          <h3>
            {#if item.href}
              <a href={item.href} target="_blank" rel="noopener">{item.title}</a>
            {:else}
              {item.title}
            {/if}
          </h3>
          <p class="work-desc">{item.description}</p>
          <p class="work-tags">
            {#each item.tags as tag (tag)}
              <span class="tag">{tag}</span>
            {/each}
          </p>
        </article>
      {/each}
    </div>
  </section>

  <section class="section container surface-interval" id="contact" use:reveal>
    <div class="interval-card" data-reveal>
      <p class="kicker">Surface interval</p>
      <h2>Get in touch</h2>
      <p class="interval-text">
        Interesting problem, a talk, a dive trip? {site.availability.toLowerCase()} — the fastest way
        is e-mail.
      </p>
      <div class="cta-row">
        <a class="btn btn-warm" href="/contact">Send a message</a>
        <a class="btn btn-ghost" href={goHref('email', 'home-cta')} data-sveltekit-reload
          >{site.email}</a
        >
        <a class="btn btn-ghost" href={goHref('linkedin', 'home-cta')} data-sveltekit-reload
          >LinkedIn</a
        >
      </div>
      {#if data.summary?.last_dive}
        <p class="last-dive num">
          Last dive:
          {#if lastDiveHref}
            <a href={lastDiveHref}>{lastDiveText}</a>
          {:else}
            {lastDiveText}
          {/if}
        </p>
      {/if}
    </div>
  </section>
</div>

<style>
  .descent {
    position: relative;
    background: var(--descent-bg);
    color: var(--descent-ink);
    transition: background-color 0.1s linear;
    overflow: clip;
  }
  .descent :global(a) {
    color: inherit;
  }
  .section {
    position: relative;
    padding-top: var(--space-section);
    padding-bottom: var(--space-section);
  }
  .section h2 {
    font-size: clamp(30px, 4.5vw, 46px);
    max-width: 22ch;
  }
  .section h2 em {
    font-style: normal;
    color: var(--color-warm);
  }
  .about-grid {
    display: grid;
    gap: 40px;
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
    align-items: start;
  }
  .about-body {
    font-size: 1.12rem;
    line-height: 1.7;
    max-width: 60ch;
  }
  .skills {
    list-style: none;
    padding: 0;
    margin: 20px 0 0;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .skills li {
    padding: 4px 12px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, currentColor 30%, transparent);
    font-family: var(--font-mono);
    font-size: 12.5px;
  }

  .bento {
    margin-top: 28px;
    display: grid;
    gap: 16px;
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
  .bento-item {
    grid-column: span 2;
    min-height: 200px;
    border-radius: var(--radius-lg);
    border: 1px solid color-mix(in srgb, currentColor 16%, transparent);
    background: color-mix(in srgb, currentColor 6%, transparent);
    padding: 22px;
    display: flex;
    flex-direction: column;
    text-decoration: none;
    transition:
      transform 0.2s ease,
      border-color 0.2s ease;
  }
  .bento-dive {
    grid-column: span 4;
    grid-row: span 2;
  }
  .bento-link:hover {
    transform: translateY(-2px);
    border-color: var(--color-accent);
  }
  .bento-title {
    font-family: var(--font-display);
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 8px;
  }
  .bento-blurb {
    opacity: 0.8;
    font-size: 15px;
    line-height: 1.5;
  }

  .work-grid {
    margin-top: 28px;
    display: grid;
    gap: 16px;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  }
  .work-card {
    padding: 24px;
    background: color-mix(in srgb, currentColor 6%, transparent);
    border-color: color-mix(in srgb, currentColor 16%, transparent);
  }
  .work-card h3 {
    font-size: 20px;
    margin: 6px 0 10px;
  }
  .work-card h3 a {
    text-decoration: none;
  }
  .work-card h3 a:hover {
    color: var(--color-accent);
  }
  .work-year {
    font-size: 12.5px;
    opacity: 0.7;
    margin: 0;
  }
  .work-desc {
    opacity: 0.85;
    font-size: 15px;
    line-height: 1.6;
  }
  .work-tags {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin: 0;
  }
  .work-card .tag {
    color: inherit;
    background: color-mix(in srgb, currentColor 8%, transparent);
    border-color: color-mix(in srgb, currentColor 20%, transparent);
  }

  .surface-interval {
    padding-bottom: calc(var(--space-section) + 40px);
  }
  .interval-card {
    max-width: 640px;
  }
  .interval-text {
    font-size: 1.12rem;
    opacity: 0.85;
    max-width: 50ch;
  }
  .cta-row {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin: 24px 0;
  }
  .last-dive {
    font-size: 13px;
    opacity: 0.6;
  }
  .last-dive a {
    color: inherit;
    text-underline-offset: 3px;
  }
  .last-dive a:hover {
    color: var(--color-accent);
  }

  @media (max-width: 880px) {
    .about-grid {
      grid-template-columns: 1fr;
      gap: 12px;
    }
    .bento {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .bento-item,
    .bento-dive {
      grid-column: span 2;
      grid-row: auto;
    }
  }
</style>
