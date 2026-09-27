<script lang="ts">
  import '$lib/styles/theme.css';
  import { page } from '$app/state';
  import { site } from '$lib/site';
  import { metaFor, canonicalUrl, personLD, jsonLdScript, SITE_URL } from '$lib/seo';
  import { goHref } from '$lib/go-targets';
  import Toast from '$lib/components/Toast.svelte';
  import { version } from '$app/environment';
  import { onMount } from 'svelte';
  import { reducedMotion } from '$lib/anim/motion';

  let { children, data } = $props();

  // Warm the anime.js chunk once so the first scroll reveal is not delayed by
  // a network round trip; the reveal/counter actions import it lazily.
  onMount(() => {
    if (!reducedMotion()) void import('animejs');
  });

  let scrollY = $state(0);
  const isHome = $derived(page.url.pathname === '/');
  const isAdmin = $derived(page.url.pathname.startsWith('/admin'));
  const overHero = $derived(isHome && scrollY < 80);
  const meta = $derived(
    page.status === 200 ? metaFor(page.url.pathname, page.data.meta) : undefined,
  );
  const canonical = $derived(canonicalUrl(page.url.pathname));
  const ogImage = `${SITE_URL}/og-image.png`;
  const jsonLd = jsonLdScript(personLD());

  const nav = [
    { href: '/dive', label: 'Dive log' },
    { href: '/blog', label: 'Blog' },
    { href: '/contact', label: 'Contact' },
  ];

  function isActive(href: string): boolean {
    return page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
  }
</script>

<svelte:head>
  {#if meta}
    <title>{meta.title}</title>
    <meta name="description" content={meta.description} />
    <link rel="canonical" href={canonical} />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content={site.name} />
    <meta property="og:locale" content="en_GB" />
    <meta property="og:title" content={meta.title} />
    <meta property="og:description" content={meta.description} />
    <meta property="og:url" content={canonical} />
    <meta property="og:image" content={ogImage} />
    <meta name="twitter:card" content="summary_large_image" />
    <link
      rel="alternate"
      type="application/rss+xml"
      title="{site.name} — writing"
      href="/feed.xml"
    />
    {#if isHome}
      <!-- eslint-disable-next-line svelte/no-at-html-tags -- JSON.stringify output with `<` escaped -->
      {@html jsonLd}
    {/if}
  {/if}
</svelte:head>

<svelte:window bind:scrollY />

{#if !isAdmin}
  <header class="site-header" class:on-hero={overHero} class:descending={isHome && !overHero}>
    <div class="header-inner container">
      <a class="brand" href="/" aria-label="{site.name} — home">
        <span class="brand-mark" aria-hidden="true"></span>
        <span class="brand-name">{site.name}</span>
      </a>
      <nav class="primary-nav" aria-label="Main">
        {#each nav as item (item.href)}
          <a href={item.href} aria-current={isActive(item.href) ? 'page' : undefined}
            >{item.label}</a
          >
        {/each}
      </nav>
    </div>
  </header>
{/if}

<main class:below-header={!isHome && !isAdmin}>
  {@render children()}
</main>

{#if !isAdmin}
  <footer class="site-footer">
    <div class="footer-inner container">
      <div class="footer-col">
        <p class="footer-name">{site.name}</p>
        <p class="footer-tagline">{site.tagline}</p>
        <p class="footer-meta num">
          v{version}
          {#if data.owner}
            · <a href="/admin">admin</a>
          {/if}
        </p>
      </div>
      <div class="footer-col">
        <h3>Site</h3>
        <a href="/dive">Dive log</a>
        <a href="/dive/gear">Dive gear</a>
        <a href="/blog">Blog</a>
        <a href="/blog?kind=til">Today I learned</a>
        <a href="/feed.xml">RSS</a>
      </div>
      <div class="footer-col">
        <h3>Elsewhere</h3>
        <a href={goHref('github', 'footer')} data-sveltekit-reload rel="me">GitHub</a>
        <a href={goHref('linkedin', 'footer')} data-sveltekit-reload rel="me">LinkedIn</a>
        <a href={goHref('medium', 'footer')} data-sveltekit-reload rel="me">Medium</a>
        <a href={goHref('email', 'footer')} data-sveltekit-reload>{site.email}</a>
        <p class="footer-copyright">
          © {new Date().getFullYear()}
          {site.name} · <a href="/privacy">Privacy</a>
        </p>
      </div>
    </div>
  </footer>
{/if}

<Toast />

<style>
  .site-header {
    position: fixed;
    inset: 0 0 auto;
    z-index: 20;
    background: color-mix(in srgb, var(--color-bg) 82%, transparent);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--color-border);
    transition:
      background-color 0.4s ease,
      border-color 0.4s ease;
  }
  .site-header.on-hero {
    background: transparent;
    border-color: transparent;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
  .site-header.descending {
    background: color-mix(in srgb, var(--descent-bg, var(--color-bg)) 78%, transparent);
    border-color: color-mix(in srgb, var(--descent-ink, var(--color-text)) 12%, transparent);
  }
  .header-inner {
    min-height: var(--header-h);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
  .brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    color: var(--descent-ink, var(--color-text));
    font-family: var(--font-display);
    font-weight: 600;
    letter-spacing: -0.01em;
  }
  .brand-mark {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--color-accent);
    box-shadow: 0 0 0 4px var(--color-accent-soft);
  }
  .primary-nav {
    display: flex;
    gap: 6px;
    align-items: center;
    font-family: var(--font-display);
    font-size: 14.5px;
    font-weight: 500;
  }
  .primary-nav a {
    color: var(--descent-ink, var(--color-text));
    text-decoration: none;
    padding: 6px 12px;
    border-radius: 999px;
    opacity: 0.85;
    transition:
      opacity 0.15s ease,
      background-color 0.15s ease;
  }
  .primary-nav a:hover,
  .primary-nav a[aria-current='page'] {
    opacity: 1;
    background: color-mix(in srgb, currentColor 10%, transparent);
  }

  main {
    flex: 1 0 auto;
  }
  main.below-header {
    padding-top: var(--header-h);
  }

  .site-footer {
    background: var(--c-abyss);
    border-top: 1px solid var(--color-border);
    color: var(--color-text-muted);
    font-size: 14.5px;
  }
  .footer-inner {
    padding-top: 56px;
    padding-bottom: 48px;
    display: grid;
    gap: 40px;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
  .footer-col {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  .footer-col h3 {
    color: var(--color-text);
    font-size: 12px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    margin: 0 0 14px;
    font-family: var(--font-mono);
    font-weight: 500;
  }
  .footer-col a {
    color: var(--color-text);
    text-decoration: none;
    margin-bottom: 8px;
  }
  .footer-col a:hover {
    color: var(--color-accent);
  }
  .footer-name {
    font-family: var(--font-display);
    font-weight: 600;
    color: var(--color-text);
    margin: 0 0 4px;
    font-size: 18px;
  }
  .footer-tagline {
    max-width: 30ch;
  }
  .footer-meta {
    font-size: 12.5px;
    color: var(--color-text-faint);
  }
  .footer-meta a {
    color: inherit;
    margin: 0;
  }
  .footer-copyright {
    margin-top: 12px;
    font-size: 13px;
    color: var(--color-text-faint);
  }
  .footer-copyright a {
    color: inherit;
    margin: 0;
    text-decoration: underline;
  }

  @media (max-width: 640px) {
    .brand-name {
      font-size: 15px;
    }
    .primary-nav {
      gap: 0;
      font-size: 13.5px;
    }
    .primary-nav a {
      padding: 6px 8px;
    }
  }
</style>
