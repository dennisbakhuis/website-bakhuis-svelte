<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { adminJson, AdminApiError } from '$lib/admin/client';
  import type { DiveAdmin, GearSetup, Person, Site, Trip } from '$lib/dive/types';
  import { toast } from '$lib/stores/toast.svelte';
  import DiveRouteEditor from './DiveRouteEditor.svelte';
  import type { DiveMapAnnotation } from '$lib/dive/sitemap';

  let {
    dive,
    nextNumber,
    sites,
    trips,
    people,
    setups,
  }: {
    dive: DiveAdmin | null;
    nextNumber: number;
    sites: Site[];
    trips: Trip[];
    people: Person[];
    setups: GearSetup[];
  } = $props();

  const TAGS = [
    'cave',
    'scooter',
    'wreck',
    'night',
    'deep',
    'drift',
    'ice',
    'sidemount',
    'training',
    'altitude',
  ];

  // svelte-ignore state_referenced_locally
  let form = $state({
    number: dive?.number ?? nextNumber,
    title: dive?.title ?? '',
    date: dive?.date ?? new Date().toISOString().slice(0, 10),
    time_in: dive?.time_in?.slice(0, 5) ?? '',
    duration_min: dive?.duration_min ?? 45,
    max_depth_m: dive?.max_depth_m ?? 18,
    avg_depth_m: dive?.avg_depth_m ?? null,
    water_temp_c: dive?.water_temp_c ?? null,
    air_temp_c: dive?.air_temp_c ?? null,
    visibility_m: dive?.visibility_m ?? null,
    site_id: dive?.site_id ?? '',
    trip_id: dive?.trip_id ?? '',
    tags: [...(dive?.tags ?? [])],
    gas: dive?.gas ?? 'air',
    o2_pct: dive?.o2_pct ?? null,
    he_pct: dive?.he_pct ?? null,
    mode: dive?.mode ?? 'OC',
    suit: dive?.suit ?? '',
    weights_kg: dive?.weights_kg ?? null,
    rating: dive?.rating ?? null,
    gear_setup_id: dive?.gear_setup_id ?? '',
    guide: dive?.guide ?? '',
    body_md: dive?.body_md ?? '',
    visibility: dive?.visibility ?? 'public',
    buddy_ids: [...(dive?.buddy_ids ?? [])],
    map_annotation: (dive?.map_annotation ?? null) as DiveMapAnnotation | null,
  });

  const siteMaps = $derived(sites.find((s) => s.id === form.site_id)?.maps ?? []);

  let newBuddy = $state('');
  let busy = $state(false);
  let error = $state('');

  function payload() {
    const num = (v: number | null | string) => (v === '' || v === null ? null : Number(v));
    return {
      ...form,
      time_in: form.time_in ? `${form.time_in}:00` : null,
      avg_depth_m: num(form.avg_depth_m),
      water_temp_c: num(form.water_temp_c),
      air_temp_c: num(form.air_temp_c),
      visibility_m: num(form.visibility_m),
      o2_pct: num(form.o2_pct),
      he_pct: num(form.he_pct),
      weights_kg: num(form.weights_kg),
      rating: num(form.rating),
      site_id: form.site_id || null,
      trip_id: form.trip_id || null,
      gear_setup_id: form.gear_setup_id || null,
      suit: form.suit || null,
      guide: form.guide || null,
      cover_attachment_id: dive?.cover_attachment_id ?? null,
    };
  }

  async function save(e: SubmitEvent) {
    e.preventDefault();
    busy = true;
    error = '';
    try {
      if (dive) {
        await adminJson(`/admin/dives/${dive.id}`, 'PUT', payload());
        toast.show({ kind: 'success', message: `Dive #${form.number} saved` });
        await invalidateAll();
      } else {
        const created = await adminJson<DiveAdmin>('/admin/dives', 'POST', payload());
        toast.show({
          kind: 'success',
          message: `Dive #${created.number} created — add photos below`,
        });
        await goto(`/admin/dives/${created.id}`);
      }
    } catch (err) {
      error = err instanceof AdminApiError ? err.message : 'Save failed';
    } finally {
      busy = false;
    }
  }

  async function remove() {
    if (!dive || !confirm(`Delete dive #${dive.number} and its attachments?`)) return;
    await adminJson(`/admin/dives/${dive.id}`, 'DELETE');
    toast.show({ kind: 'success', message: 'Dive deleted' });
    await goto('/admin');
  }

  async function addBuddy() {
    const name = newBuddy.trim();
    if (!name) return;
    const person = await adminJson<Person>('/admin/people', 'POST', { name, display: 'first' });
    if (!people.some((p) => p.id === person.id)) people = [...people, person];
    if (!form.buddy_ids.includes(person.id)) form.buddy_ids = [...form.buddy_ids, person.id];
    newBuddy = '';
  }

  function toggle(list: string[], value: string): string[] {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
  }
</script>

<form class="dive-form" onsubmit={save}>
  <fieldset>
    <legend>Basics</legend>
    <div class="field-row">
      <label>Number<input type="number" min="1" bind:value={form.number} required /></label>
      <label>Date<input type="date" bind:value={form.date} required /></label>
      <label>Time in<input type="time" bind:value={form.time_in} /></label>
      <label
        >Duration (min)<input
          type="number"
          min="1"
          bind:value={form.duration_min}
          required
        /></label
      >
      <label
        >Max depth (m)<input
          type="number"
          step="0.1"
          min="0"
          bind:value={form.max_depth_m}
          required
        /></label
      >
      <label
        >Avg depth (m)<input
          type="number"
          step="0.1"
          min="0"
          bind:value={form.avg_depth_m}
        /></label
      >
    </div>
    <label class="wide"
      >Title<input
        type="text"
        maxlength="200"
        bind:value={form.title}
        placeholder="Optional — defaults to the site name"
      /></label
    >
    <div class="field-row">
      <label>
        Site
        <select bind:value={form.site_id}>
          <option value="">— none —</option>
          {#each sites as site (site.id)}<option value={site.id}
              >{site.name} ({site.country_code})</option
            >{/each}
        </select>
      </label>
      <label>
        Trip
        <select bind:value={form.trip_id}>
          <option value="">— none —</option>
          {#each trips as trip (trip.id)}<option value={trip.id}>{trip.name}</option>{/each}
        </select>
      </label>
      <label>
        Visibility
        <select bind:value={form.visibility}>
          <option value="public">public</option>
          <option value="private">private (counts in stats, hidden)</option>
          <option value="draft">draft (not counted)</option>
        </select>
      </label>
    </div>
    <p class="hint">
      No site yet? <a href="/admin/sites" target="_blank">Add one</a>, then reload this form.
    </p>
  </fieldset>

  <fieldset>
    <legend>Conditions & gas</legend>
    <div class="field-row">
      <label>Water (°C)<input type="number" step="0.5" bind:value={form.water_temp_c} /></label>
      <label>Air (°C)<input type="number" step="0.5" bind:value={form.air_temp_c} /></label>
      <label>Visibility (m)<input type="number" step="1" bind:value={form.visibility_m} /></label>
      <label>
        Gas
        <select bind:value={form.gas}>
          <option value="air">air</option>
          <option value="nitrox">nitrox</option>
          <option value="trimix">trimix</option>
        </select>
      </label>
      <label>O₂ %<input type="number" min="0" max="100" bind:value={form.o2_pct} /></label>
      <label>He %<input type="number" min="0" max="100" bind:value={form.he_pct} /></label>
      <label>
        Mode
        <select bind:value={form.mode}>
          <option value="OC">open circuit</option>
          <option value="sidemount">sidemount</option>
          <option value="CCR">rebreather</option>
        </select>
      </label>
      <label>Suit<input type="text" bind:value={form.suit} /></label>
      <label>Weights (kg)<input type="number" step="0.5" bind:value={form.weights_kg} /></label>
      <label>Rating (1–5)<input type="number" min="1" max="5" bind:value={form.rating} /></label>
      <label>
        Gear setup
        <select bind:value={form.gear_setup_id}>
          <option value="">— none —</option>
          {#each setups as setup (setup.id)}<option value={setup.id}>{setup.name}</option>{/each}
        </select>
      </label>
      <label>Guide<input type="text" bind:value={form.guide} /></label>
    </div>
  </fieldset>

  <fieldset>
    <legend>Tags</legend>
    <div class="chips">
      {#each TAGS as tag (tag)}
        <button
          type="button"
          class="tag"
          class:active={form.tags.includes(tag)}
          data-tag={tag}
          aria-pressed={form.tags.includes(tag)}
          onclick={() => (form.tags = toggle(form.tags, tag))}>{tag}</button
        >
      {/each}
    </div>
  </fieldset>

  <fieldset>
    <legend>Buddies</legend>
    <div class="chips">
      {#each people as person (person.id)}
        <button
          type="button"
          class="tag"
          class:active={form.buddy_ids.includes(person.id)}
          aria-pressed={form.buddy_ids.includes(person.id)}
          onclick={() => (form.buddy_ids = toggle(form.buddy_ids, person.id))}>{person.name}</button
        >
      {/each}
    </div>
    <div class="add-buddy">
      <input
        type="text"
        placeholder="New buddy name"
        bind:value={newBuddy}
        onkeydown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            void addBuddy();
          }
        }}
      />
      <button type="button" class="btn btn-ghost btn-sm" onclick={addBuddy}>Add</button>
    </div>
  </fieldset>

  <fieldset class="on-map">
    <legend>On the map</legend>
    {#if form.site_id}
      <DiveRouteEditor
        maps={siteMaps}
        value={form.map_annotation}
        drawnOn={dive?.map ?? null}
        onChange={(a) => (form.map_annotation = a)}
      />
    {:else}
      <p class="muted">Pick a site first to mark the route on one of its maps.</p>
    {/if}
  </fieldset>

  <fieldset>
    <legend>Story</legend>
    <label class="wide">Markdown<textarea rows="10" bind:value={form.body_md}></textarea></label>
  </fieldset>

  {#if error}<p class="error">{error}</p>{/if}
  <div class="actions">
    <button type="submit" class="btn btn-solid" disabled={busy}
      >{busy ? 'Saving…' : dive ? 'Save dive' : 'Create dive'}</button
    >
    {#if dive}<button type="button" class="btn btn-ghost" onclick={remove}>Delete</button>{/if}
    <a class="btn btn-ghost" href="/admin">Back</a>
  </div>
</form>

<style>
  .muted {
    color: var(--color-text-faint);
    font-size: 13px;
    margin: 0;
  }
  .dive-form {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  fieldset {
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: var(--color-bg-elevated);
  }
  legend {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--color-text-muted);
    padding: 0 6px;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chips .tag {
    cursor: pointer;
  }
  .tag.active {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }
  .add-buddy {
    display: flex;
    gap: 8px;
    max-width: 360px;
  }
  .hint {
    font-size: 12.5px;
    color: var(--color-text-faint);
    margin: 0;
  }
  .actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    position: sticky;
    bottom: 0;
    padding: 12px 0;
    background: linear-gradient(transparent, var(--c-abyss) 30%);
  }
  textarea {
    font-family: var(--font-mono);
    font-size: 13.5px;
    line-height: 1.5;
  }
</style>
