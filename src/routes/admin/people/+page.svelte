<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { adminJson } from '$lib/admin/client';
  import type { Person } from '$lib/dive/types';

  let { data } = $props();
  let name = $state('');

  async function add(e: SubmitEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await adminJson('/admin/people', 'POST', { name: name.trim(), display: 'first' });
    name = '';
    await invalidateAll();
  }

  async function update(p: Person, patch: Partial<Person>) {
    await adminJson(`/admin/people/${p.id}`, 'PUT', { name: p.name, display: p.display, ...patch });
    await invalidateAll();
  }
</script>

<h1>Dive buddies</h1>
<p class="muted">How each person appears on the public site. Default is first name only.</p>

<form class="add" onsubmit={add}>
  <input type="text" placeholder="Full name" bind:value={name} />
  <button type="submit" class="btn btn-solid btn-sm">Add</button>
</form>

<table>
  <thead><tr><th>Name</th><th>Shown as</th></tr></thead>
  <tbody>
    {#each data.people as p (p.id)}
      <tr>
        <td
          ><input
            type="text"
            value={p.name}
            onchange={(e) => update(p, { name: e.currentTarget.value })}
          /></td
        >
        <td>
          <select value={p.display} onchange={(e) => update(p, { display: e.currentTarget.value })}>
            <option value="first">first name</option>
            <option value="full">full name</option>
            <option value="initials">initials</option>
            <option value="hidden">hidden</option>
          </select>
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .muted {
    color: var(--color-text-muted);
    font-size: 14px;
  }
  .add {
    display: flex;
    gap: 8px;
    max-width: 420px;
    margin-bottom: 20px;
  }
  td select {
    width: auto;
  }
</style>
