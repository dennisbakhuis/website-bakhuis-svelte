<script lang="ts">
  import { goto } from '$app/navigation';
  import SiteForm from '../SiteForm.svelte';
  import { getDivelog } from '$lib/dive/context';

  const { urls } = getDivelog();

  let { data } = $props();
</script>

<nav class="crumbs" aria-label="Breadcrumb">
  <a href={urls.admin.sites()}>Sites</a> › <span>New site</span>
</nav>
<h1>New site</h1>
<SiteForm regions={data.regions} onSaved={(site) => goto(urls.admin.site(site.id))} />
<p class="muted">Photos, uploaded maps and drawn maps are added after the site is created.</p>

<style>
  .crumbs {
    font-size: 13.5px;
    color: var(--dl-color-text-faint);
    margin-bottom: 6px;
  }
  .crumbs a {
    color: var(--dl-color-text-muted);
  }
  .muted {
    color: var(--dl-color-text-faint);
    font-size: 14px;
  }
</style>
