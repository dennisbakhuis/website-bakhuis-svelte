<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { adminUpload, AdminApiError } from '$lib/admin/client';

  let { data } = $props();
  let busy = $state(false);
  let result = $state<{
    created: number[];
    updated: number[];
    skipped: number;
    sites_created: number;
  } | null>(null);
  let error = $state('');

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    busy = true;
    error = '';
    result = null;
    try {
      result = await adminUpload('/admin/import/subsurface', files[0]);
      await invalidateAll();
    } catch (err) {
      error = err instanceof AdminApiError ? err.message : 'Import failed';
    } finally {
      busy = false;
    }
  }
</script>

<h1>Import from a dive computer</h1>
<p class="muted">
  Upload a Subsurface XML export. Dives that match an existing one by date and time get their depth
  profile attached; new ones are created as <strong>drafts</strong> for you to enrich and publish. Sites
  come in with coordinates but without a country — fix those under Sites.
</p>

<label class="drop card">
  <input
    type="file"
    accept=".xml,.ssrf,application/xml,text/xml"
    onchange={(e) => upload(e.currentTarget.files)}
    disabled={busy}
  />
  <span>{busy ? 'Importing…' : 'Choose a Subsurface .xml / .ssrf file'}</span>
</label>

{#if error}<p class="error">{error}</p>{/if}
{#if result}
  <div class="card summary">
    <p>
      <strong>{result.created.length}</strong> drafts created{result.created.length
        ? `: #${result.created.join(', #')}`
        : ''}
    </p>
    <p>
      <strong>{result.updated.length}</strong> existing dives got a profile{result.updated.length
        ? `: #${result.updated.join(', #')}`
        : ''}
    </p>
    <p>
      <strong>{result.skipped}</strong> skipped (already imported) ·
      <strong>{result.sites_created}</strong> sites created
    </p>
    <a class="btn btn-solid btn-sm" href="/admin">Review drafts</a>
  </div>
{/if}

{#if data.imports.length}
  <h2>Previous imports</h2>
  <table>
    <thead><tr><th>When</th><th>File</th><th>Created</th><th>Updated</th><th></th></tr></thead>
    <tbody>
      {#each data.imports as row (row.id)}
        <tr>
          <td class="num">{row.created_at.slice(0, 16).replace('T', ' ')}</td>
          <td>{row.original_name}</td>
          <td class="num">{row.created.length}</td>
          <td class="num">{row.updated.length}</td>
          <td><a href={row.url}>download</a></td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}

<style>
  .muted {
    color: var(--color-text-muted);
    max-width: 64ch;
  }
  .drop {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 36px;
    border-style: dashed;
    cursor: pointer;
    margin: 20px 0;
    background: var(--color-bg-elevated);
  }
  .drop input {
    display: none;
  }
  .summary {
    padding: 16px;
    margin-bottom: 28px;
  }
  .summary p {
    margin: 0 0 6px;
  }
  h2 {
    font-size: 18px;
  }
</style>
