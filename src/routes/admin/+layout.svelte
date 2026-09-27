<script lang="ts">
  import { page } from '$app/state';
  import { goto, invalidateAll } from '$app/navigation';
  import { adminJson } from '$lib/admin/client';

  let { children, data } = $props();

  const nav = [
    { href: '/admin', label: 'Dives', exact: true },
    { href: '/admin/dives/new', label: '+ New dive' },
    { href: '/admin/sites', label: 'Sites' },
    { href: '/admin/gear', label: 'Gear' },
    { href: '/admin/people', label: 'People' },
    { href: '/admin/import', label: 'Import' },
  ];

  function active(item: { href: string; exact?: boolean }): boolean {
    return item.exact ? page.url.pathname === item.href : page.url.pathname.startsWith(item.href);
  }

  async function logout() {
    await adminJson('/auth/logout', 'POST');
    await invalidateAll();
    await goto('/admin/login');
  }
</script>

<svelte:head>
  <title>Admin — Dennis Bakhuis</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="admin">
  {#if data.owner}
    <header class="bar">
      <a class="brand" href="/admin">dive log admin</a>
      <nav>
        {#each nav as item (item.href)}
          <a href={item.href} aria-current={active(item) ? 'page' : undefined}>{item.label}</a>
        {/each}
      </nav>
      <div class="right">
        <a href="/dive" class="muted">view site</a>
        <button type="button" class="btn btn-ghost btn-sm" onclick={logout}>Sign out</button>
      </div>
    </header>
  {/if}
  <div class="admin-body">
    {@render children()}
  </div>
</div>

<style>
  .admin {
    min-height: 100svh;
    display: flex;
    flex-direction: column;
    background: var(--c-abyss);
  }
  .bar {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 10px var(--space-page-x);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-bg);
    flex-wrap: wrap;
  }
  .brand {
    font-family: var(--font-mono);
    font-size: 13px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    text-decoration: none;
    color: var(--color-accent);
  }
  nav {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }
  nav a {
    text-decoration: none;
    color: var(--color-text-muted);
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 14px;
  }
  nav a:hover,
  nav a[aria-current='page'] {
    color: var(--color-text);
    background: var(--color-surface);
  }
  .right {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .muted {
    color: var(--color-text-faint);
    font-size: 13px;
    text-decoration: none;
  }
  .admin-body {
    flex: 1;
    padding: 24px var(--space-page-x) 80px;
    max-width: 1100px;
    width: 100%;
    margin: 0 auto;
  }
  .admin-body :global(h1) {
    font-size: 26px;
    margin-bottom: 18px;
  }
  .admin-body :global(input),
  .admin-body :global(select),
  .admin-body :global(textarea) {
    font: inherit;
    font-size: 14.5px;
    color: var(--color-text);
    background: var(--color-surface);
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    padding: 8px 10px;
    width: 100%;
  }
  .admin-body :global(label) {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 12.5px;
    color: var(--color-text-muted);
  }
  .admin-body :global(.field-row) {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
  }
  .admin-body :global(.error) {
    color: var(--color-error);
    font-size: 14px;
  }
  .admin-body :global(table) {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }
  .admin-body :global(th),
  .admin-body :global(td) {
    text-align: left;
    padding: 8px 10px;
    border-bottom: 1px solid var(--color-border);
    vertical-align: top;
  }
  .admin-body :global(th) {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-text-muted);
    font-weight: 500;
  }
</style>
