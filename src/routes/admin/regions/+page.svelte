<script lang="ts">
  import { getDivelog } from '$lib/dive/context';

  const { urls } = getDivelog();

  let { data } = $props();
</script>

<nav class="crumbs" aria-label="Breadcrumb">
  <a href={urls.admin.sites()}>Sites</a> › <span>Regions</span>
</nav>
<div class="head">
  <h1>Regions <span class="muted num">{data.regions.length}</span></h1>
  <a class="btn btn-solid btn-sm" href={urls.admin.newRegion()}>+ New region</a>
</div>

<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Id</th>
      <th>Country</th>
      <th>Waters</th>
      <th class="n">Sites</th>
      <th class="n">Dives</th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    {#each data.regions as region (region.id)}
      <tr>
        <td><a href={urls.admin.region(region.id)}>{region.name}</a></td>
        <td class="muted">{region.id}</td>
        <td>{region.country ?? '—'}</td>
        <td>{region.waters.join(', ') || '—'}</td>
        <td class="n num">{region.sites.length}</td>
        <td class="n num">{region.dives}</td>
        <td class="row-actions"
          ><a href={urls.region(region.id)} target="_blank" rel="noopener">view ↗</a></td
        >
      </tr>
    {:else}
      <tr><td colspan="7" class="muted">No regions yet.</td></tr>
    {/each}
  </tbody>
</table>

<style>
  .crumbs {
    font-size: 13.5px;
    color: var(--color-text-faint);
    margin-bottom: 6px;
  }
  .crumbs a {
    color: var(--color-text-muted);
  }
  .head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 14px;
    flex-wrap: wrap;
  }
  .muted {
    color: var(--color-text-faint);
    font-size: 14px;
    font-weight: 400;
  }
  .n {
    text-align: right;
  }
  .row-actions {
    white-space: nowrap;
    text-align: right;
    font-size: 13px;
  }
</style>
