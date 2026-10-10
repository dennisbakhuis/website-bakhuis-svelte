<script lang="ts">
  import { onMount } from 'svelte';
  import { reducedMotion } from '@divelog/kit';
  import { createSchool, headingDeg, stepSchool, type Predator } from '$lib/anim/fish';

  let { progress }: { progress: number } = $props();

  type Visitor = 'diver' | 'grouper';
  type Event = 'shark' | Visitor;

  const COUNT = 16;
  const SHARK_WIDTH = 240;
  const FIRST_EVENT_MS = [7000, 13000];
  const NEXT_EVENT_MS = [18000, 34000];
  const EVENT_WEIGHTS: [Event, number][] = [
    ['shark', 0.45],
    ['diver', 0.3],
    ['grouper', 0.25],
  ];
  const CAVE_REACH = 760;
  const CAVE_BASE = 0.12;

  const bounds = { width: 1200, height: 800 };
  const school = createSchool(COUNT, bounds, 7);
  const shark: Predator & { dir: 1 | -1 } = { x: -SHARK_WIDTH, y: 0, active: false, dir: 1 };
  const visitor: Predator & { kind: Visitor; fade: number } = {
    x: -200,
    y: 0,
    active: false,
    radius: 170,
    strength: 2.4,
    kind: 'diver',
    fade: 1,
  };
  const mouth = { x: 0, y: 0 };
  let prominence = 0;

  let layer = $state<HTMLElement>();
  let sharkEl = $state<SVGSVGElement>();
  let caveEl = $state<SVGSVGElement>();
  let diverEl = $state<SVGSVGElement>();
  let grouperEl = $state<SVGSVGElement>();
  let fishEls: SVGSVGElement[] = $state([]);

  const opacity = $derived(Math.max(0, Math.min(1, 1 - progress * 3)));
  let visible = $derived(opacity > 0);

  function between(range: number[]): number {
    return range[0] + Math.random() * (range[1] - range[0]);
  }

  function pickEvent(): Event {
    let roll = Math.random();
    for (const [kind, weight] of EVENT_WEIGHTS) {
      roll -= weight;
      if (roll <= 0) return kind;
    }
    return 'shark';
  }

  function measure() {
    bounds.width = window.innerWidth;
    bounds.height = window.innerHeight;
    if (caveEl) {
      const rect = caveEl.getBoundingClientRect();
      mouth.x = rect.left + rect.width * 0.44;
      mouth.y = rect.top + rect.height * 0.72;
    }
  }

  function render(time: number, dt: number) {
    school.forEach((fish, i) => {
      const el = fishEls[i];
      if (!el) return;
      const { angle, flip } = headingDeg(fish.vel);
      el.style.transform = `translate(${fish.pos.x}px, ${fish.pos.y}px) scale(${fish.size}) scaleX(${flip ? -1 : 1}) rotate(${angle}deg)`;
      el.classList.toggle('panic', fish.panic > 0.25);
    });
    if (sharkEl) {
      const bob = Math.sin(time * 0.9) * 10;
      sharkEl.style.transform = `translate(${shark.x}px, ${shark.y + bob}px) scaleX(${shark.dir})`;
      sharkEl.style.visibility = shark.active ? 'visible' : 'hidden';
    }
    const visitorEl = visitor.kind === 'diver' ? diverEl : grouperEl;
    for (const el of [diverEl, grouperEl]) {
      if (!el) continue;
      if (el !== visitorEl || !visitor.active) {
        el.style.visibility = 'hidden';
        continue;
      }
      const bob = Math.sin(time * (visitor.kind === 'diver' ? 0.6 : 1.1)) * 6;
      el.style.transform = `translate(${visitor.x}px, ${visitor.y + bob}px)`;
      el.style.opacity = String(visitor.fade);
      el.style.visibility = 'visible';
    }
    const distance = visitor.active
      ? Math.hypot(visitor.x - mouth.x, visitor.y - mouth.y)
      : Infinity;
    const reach = Math.min(CAVE_REACH, bounds.width * 0.7);
    const target = Math.max(0, Math.min(1, 1 - distance / reach));
    prominence += (target - prominence) * Math.min(1, dt * (target > prominence ? 2.5 : 0.7));
    if (caveEl) caveEl.style.opacity = String(CAVE_BASE + (1 - CAVE_BASE) * prominence);
  }

  onMount(() => {
    if (!layer) return;
    measure();
    render(0, 0);
    if (reducedMotion()) return;

    let frame = 0;
    let last = 0;
    let running = false;
    let cancelled = false;
    let eventTimer: ReturnType<typeof setTimeout> | undefined;
    let tween: { cancel(): void } | undefined;

    const loop = (now: number) => {
      if (!running) return;
      const dt = last ? (now - last) / 1000 : 1 / 60;
      last = now;
      stepSchool(school, [shark, visitor], bounds, dt, now / 1000);
      render(now / 1000, Math.min(dt, 0.1));
      frame = requestAnimationFrame(loop);
    };
    const start = () => {
      if (running || cancelled || document.hidden || !visible) return;
      running = true;
      last = 0;
      frame = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };

    const scheduleEvent = (range: number[]) => {
      clearTimeout(eventTimer);
      eventTimer = setTimeout(runEvent, between(range));
    };
    const runEvent = () => {
      if (cancelled || shark.active || visitor.active) return;
      if (document.hidden || !visible) {
        scheduleEvent([4000, 8000]);
        return;
      }
      void import('animejs').then(({ animate }) => {
        if (cancelled) return;
        const kind = pickEvent();
        if (kind === 'shark') {
          shark.dir = Math.random() < 0.5 ? 1 : -1;
          const from = shark.dir === 1 ? -SHARK_WIDTH : bounds.width + SHARK_WIDTH;
          const to = shark.dir === 1 ? bounds.width + SHARK_WIDTH : -SHARK_WIDTH;
          shark.x = from;
          shark.y = bounds.height * (0.2 + Math.random() * 0.5);
          shark.active = true;
          tween = animate(shark, {
            x: [from, to],
            y: [shark.y, shark.y + (Math.random() - 0.5) * 120],
            duration: 11000 + Math.random() * 4000,
            ease: 'linear',
            onComplete: () => {
              shark.active = false;
              scheduleEvent(NEXT_EVENT_MS);
            },
          });
          return;
        }
        measure();
        visitor.kind = kind;
        visitor.x = -220;
        visitor.y = Math.max(150, mouth.y - 160 - Math.random() * 140);
        visitor.fade = 1;
        visitor.active = true;
        const settle = { x: mouth.x - 150, y: mouth.y - 120 };
        tween = animate(visitor, {
          x: [
            { to: settle.x, duration: 13000 },
            { to: mouth.x + 20, duration: 3200 },
          ],
          y: [
            { to: settle.y, duration: 13000 },
            { to: mouth.y - 10, duration: 3200 },
          ],
          fade: [
            { to: 1, duration: 14600 },
            { to: 0, duration: 1600 },
          ],
          ease: 'inOutSine',
          onComplete: () => {
            visitor.active = false;
            scheduleEvent(NEXT_EVENT_MS);
          },
        });
      });
    };

    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('resize', measure);
    start();
    scheduleEvent(FIRST_EVENT_MS);

    const unwatch = $effect.root(() => {
      $effect(() => {
        if (visible) start();
        else stop();
      });
    });

    return () => {
      cancelled = true;
      stop();
      unwatch();
      clearTimeout(eventTimer);
      tween?.cancel();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', measure);
    };
  });
</script>

<div
  class="fish-layer"
  bind:this={layer}
  style="opacity: {opacity}"
  hidden={!visible}
  aria-hidden="true"
>
  {#each school as fish, i (fish.id)}
    <svg
      bind:this={fishEls[i]}
      class="fish"
      viewBox="0 0 44 22"
      style="opacity: {0.35 + fish.layer * 0.4}; --wag: {0.55 + fish.layer * 0.35}s"
    >
      <path class="tail" d="M13 11 L1 3 L4 11 L1 19 Z" />
      <path d="M42 11 C35 3 22 2 12 11 C22 20 35 19 42 11 Z" />
      <path d="M18 5.5 C22 1 28 1 32 4.5 Z" />
      <circle class="eye" cx="36" cy="9.5" r="1.3" />
    </svg>
  {/each}

  <svg bind:this={sharkEl} class="shark" viewBox="0 0 220 90">
    <path class="tail" d="M46 44 L6 6 L24 44 L18 76 Z" />
    <path
      d="M218 48 C200 34 160 24 120 26 C95 27 70 34 44 44 C70 52 95 60 120 62 C160 64 200 60 218 48 Z"
    />
    <path d="M98 27 L116 2 L134 27 Z" />
    <path d="M170 29 L178 20 L186 30 Z" />
    <path d="M112 60 L98 86 L140 66 Z" />
    <circle class="eye" cx="200" cy="44" r="2" />
  </svg>

  <svg bind:this={grouperEl} class="grouper" viewBox="0 0 120 60">
    <path class="tail" d="M32 30 L4 12 L12 30 L4 48 Z" />
    <path d="M112 30 C100 10 60 6 30 22 C20 27 22 34 30 38 C60 54 100 50 112 30 Z" />
    <path d="M45 16 C60 2 85 4 98 15 Z" />
    <path d="M60 40 L50 56 L76 46 Z" />
    <circle class="eye" cx="100" cy="26" r="2.5" />
  </svg>

  <svg bind:this={diverEl} class="diver" viewBox="0 0 160 70">
    <path class="beam" d="M150 41 L268 18 L268 64 Z" />
    <path class="fin" d="M52 36 L22 40 L10 33 L0 44 L16 51 L54 45 Z" />
    <rect x="46" y="9" width="54" height="14" rx="7" />
    <rect x="98" y="12" width="9" height="7" rx="2" />
    <path d="M48 26 C70 20 100 22 120 30 C116 44 72 47 48 41 Z" />
    <circle cx="128" cy="33" r="9" />
    <rect class="mask" x="131" y="29" width="8" height="7" rx="2" />
    <path d="M108 34 L140 40 L142 46 L112 45 Z" />
    <rect x="138" y="38" width="13" height="7" rx="2" />
  </svg>

  <svg bind:this={caveEl} class="cave" viewBox="0 0 400 260" preserveAspectRatio="none">
    <path
      class="rock"
      d="M0 260 L0 246 C40 238 82 224 112 196 C134 174 154 148 190 138 C232 126 254 92 300 64 C340 46 372 48 400 44 L400 260 Z"
    />
    <path
      class="rock"
      d="M150 260 C156 236 190 232 214 244 C226 250 236 256 240 260 Z"
      opacity="0.6"
    />
    <path
      class="mouth"
      d="M124 260 C126 214 150 168 188 158 C224 150 248 188 252 216 C254 234 252 250 250 260 Z"
    />
    <path class="rock" d="M168 162 L173 190 L180 166 Z" />
    <path class="rock" d="M192 158 L196 184 L202 158 Z" />
    <path class="rock" d="M214 164 L220 200 L228 170 Z" />
    <path class="crack" d="M270 90 C284 110 280 140 300 160" />
    <path class="crack" d="M60 200 C80 190 96 196 110 180" />
  </svg>
</div>

<style>
  .fish-layer {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
    transition: opacity 0.2s linear;
  }
  .fish,
  .shark,
  .grouper,
  .diver {
    position: absolute;
    top: 0;
    left: 0;
    overflow: visible;
    fill: color-mix(in srgb, var(--descent-ink, #0b2a4a) 75%, transparent);
    will-change: transform;
  }
  .fish {
    width: 44px;
    height: 22px;
    margin: -11px 0 0 -22px;
  }
  .shark {
    width: 240px;
    height: 98px;
    margin: -49px 0 0 -120px;
    visibility: hidden;
    fill: color-mix(in srgb, var(--descent-ink, #0b2a4a) 72%, transparent);
  }
  .grouper {
    width: 150px;
    height: 75px;
    margin: -37px 0 0 -75px;
    visibility: hidden;
    fill: color-mix(in srgb, var(--descent-ink, #0b2a4a) 68%, transparent);
  }
  .diver {
    width: 190px;
    height: 83px;
    margin: -41px 0 0 -95px;
    visibility: hidden;
    fill: color-mix(in srgb, var(--descent-ink, #0b2a4a) 78%, transparent);
  }
  .diver .beam {
    fill: color-mix(in srgb, #fff3c4 28%, transparent);
    mix-blend-mode: soft-light;
  }
  .diver .fin {
    transform-box: fill-box;
    transform-origin: right center;
    animation: kick 1.4s ease-in-out infinite alternate;
  }
  .eye,
  .mask {
    fill: var(--descent-bg, #eaf4fb);
  }
  .cave {
    position: absolute;
    right: 0;
    bottom: 0;
    width: clamp(200px, 34vw, 520px);
    height: auto;
    aspect-ratio: 400 / 260;
    opacity: 0.12;
    will-change: opacity;
  }
  .cave .rock {
    fill: color-mix(in srgb, var(--descent-ink, #0b2a4a) 46%, transparent);
  }
  .cave .mouth {
    fill: color-mix(in srgb, var(--descent-ink, #0b2a4a) 96%, #000);
  }
  .cave .crack {
    fill: none;
    stroke: color-mix(in srgb, var(--descent-bg, #eaf4fb) 60%, transparent);
    stroke-width: 1.5;
  }
  .tail {
    transform-box: fill-box;
    transform-origin: right center;
    animation: wag var(--wag, 0.7s) ease-in-out infinite alternate;
  }
  .fish:global(.panic) .tail {
    animation-duration: 0.18s;
  }
  .shark .tail {
    animation-duration: 1.6s;
  }
  .grouper .tail {
    animation-duration: 1.1s;
  }
  @keyframes wag {
    from {
      transform: rotate(-14deg);
    }
    to {
      transform: rotate(14deg);
    }
  }
  @keyframes kick {
    from {
      transform: rotate(-9deg);
    }
    to {
      transform: rotate(9deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .tail,
    .diver .fin {
      animation: none;
    }
  }
</style>
