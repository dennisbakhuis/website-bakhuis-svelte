<script lang="ts">
  import { page } from '$app/state';
</script>

<svelte:head>
  <title>{page.status} — Dennis Bakhuis</title>
</svelte:head>

<section class="error container narrow">
  <p class="status num">{page.status}</p>
  {#if page.status === 404}
    <h1>Nothing at this depth</h1>
    <p class="lede">The page you were looking for has moved, or never existed.</p>
  {:else}
    <h1>Something went wrong</h1>
    <p class="lede">{page.error?.message}</p>
  {/if}
  <div class="cta-row">
    <a class="btn btn-solid" href="/">Back to the surface</a>
    <a class="btn btn-ghost" href="/dive">Dive log</a>
  </div>
</section>

<style>
  .error {
    padding: 120px 0 140px;
    text-align: center;
  }
  .status {
    font-size: clamp(48px, 12vw, 96px);
    font-weight: 500;
    line-height: 1;
    color: var(--color-accent);
    margin: 0 0 8px;
  }
  .lede {
    color: var(--color-text-muted);
    font-size: 18px;
    margin: 0 auto 28px;
  }
  .cta-row {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
  }
</style>
