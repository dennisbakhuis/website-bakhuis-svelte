<script lang="ts">
  import { page } from '$app/state';

  const items = [
    { href: '/dive', label: 'Log', match: (p: string) => p === '/dive' || /^\/dive\/\d+/.test(p) },
    { href: '/dive/sites', label: 'Sites', match: (p: string) => p.startsWith('/dive/sites') },
    { href: '/dive/gear', label: 'Gear', match: (p: string) => p.startsWith('/dive/gear') },
  ];
</script>

<nav class="dive-nav container" aria-label="Dive log sections">
  {#each items as item (item.href)}
    <a
      href={item.href}
      class:active={item.match(page.url.pathname)}
      aria-current={item.match(page.url.pathname) ? 'page' : undefined}>{item.label}</a
    >
  {/each}
</nav>

<style>
  .dive-nav {
    display: flex;
    gap: 4px;
    padding-top: 20px;
    margin-bottom: -28px;
  }
  .dive-nav a {
    padding: 6px 14px;
    border-radius: 999px;
    border: 1px solid var(--color-border);
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text-muted);
    background: var(--color-bg-elevated);
  }
  .dive-nav a:hover {
    color: var(--color-text);
    border-color: var(--color-border-strong);
  }
  .dive-nav a.active {
    background: var(--color-text);
    border-color: var(--color-text);
    color: var(--color-bg);
  }
</style>
