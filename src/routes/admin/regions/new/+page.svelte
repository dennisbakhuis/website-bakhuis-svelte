<script lang="ts">
  import { goto } from '$app/navigation';
  import RegionForm from '../RegionForm.svelte';
</script>

<nav class="crumbs" aria-label="Breadcrumb">
  <a href="/admin/sites">Sites</a> › <a href="/admin/regions">Regions</a> › <span>New region</span>
</nav>
<h1>New region</h1>
<RegionForm onSaved={(region) => goto(`/admin/regions/${region.id}`)} />

<style>
  .crumbs {
    font-size: 13.5px;
    color: var(--color-text-faint);
    margin-bottom: 6px;
  }
  .crumbs a {
    color: var(--color-text-muted);
  }
</style>
