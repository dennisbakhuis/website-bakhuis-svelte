<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { adminJson, adminUpload, AdminApiError } from '$lib/admin/client';
  import SiteMapEditor from '$lib/components/admin/SiteMapEditor.svelte';
  import type { Attachment, Site, SiteMapRevision } from '$lib/dive/types';
  import {
    defaultTitle,
    emptySiteMap,
    mapSummary,
    type MapKind,
    type SiteMap,
    type SiteMapOut,
  } from '$lib/dive/sitemap';
  import { formatDate } from '$lib/dive/format';
  import { toast } from '$lib/stores/toast.svelte';

  let { data } = $props();

  const empty = () => ({
    id: '',
    slug: '',
    name: '',
    country_code: 'NL',
    country_name: 'Netherlands',
    region: '',
    lat: '' as string | number,
    lon: '' as string | number,
    site_type: 'sea',
    description_md: '',
    max_depth_m: '' as string | number,
    location_visibility: 'exact',
  });
  let form = $state(empty());
  let error = $state('');
  let mapKind = $state<'map' | 'photo'>('map');
  let uploading = $state(0);

  // Map editing is its own little workflow: one map open at a time, saved as
  // a revision independently of the site form.
  let openMapId = $state<string | null>(null);
  let editorKey = $state(0);
  let draft = $state<SiteMap | null>(null);
  let dirty = $state(false);
  let revisionNote = $state('');
  let revisions = $state<SiteMapRevision[] | null>(null);
  let savingMap = $state(false);

  const current = $derived(data.sites.find((s) => s.id === form.id));
  const media = $derived(current?.attachments ?? []);
  const maps = $derived(current?.maps ?? []);
  const openMap = $derived(maps.find((m) => m.id === openMapId));

  function edit(site: Site) {
    form = {
      ...empty(),
      ...site,
      region: site.region ?? '',
      lat: site.lat ?? '',
      lon: site.lon ?? '',
      max_depth_m: site.max_depth_m ?? '',
    };
    closeMap();
    document.getElementById('site-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function slugify(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function body() {
    return {
      slug: form.slug || slugify(form.name),
      name: form.name,
      country_code: form.country_code,
      country_name: form.country_name,
      region: form.region || null,
      lat: form.lat === '' ? null : Number(form.lat),
      lon: form.lon === '' ? null : Number(form.lon),
      site_type: form.site_type,
      description_md: form.description_md,
      max_depth_m: form.max_depth_m === '' ? null : Number(form.max_depth_m),
      location_visibility: form.location_visibility,
    };
  }

  async function save(e: SubmitEvent) {
    e.preventDefault();
    error = '';
    try {
      if (form.id) {
        await adminJson(`/admin/sites/${form.id}`, 'PUT', body());
        toast.show({ kind: 'success', message: `${form.name} saved` });
      } else {
        const created = await adminJson<Site>('/admin/sites', 'POST', body());
        toast.show({ kind: 'success', message: `${form.name} created — add maps below` });
        form.id = created.id;
        form.slug = created.slug;
      }
      await invalidateAll();
    } catch (err) {
      error = err instanceof AdminApiError ? err.message : 'Save failed';
    }
  }

  async function remove(site: Site) {
    if (!confirm(`Delete ${site.name}? Dives keep existing without a site.`)) return;
    await adminJson(`/admin/sites/${site.id}`, 'DELETE');
    if (form.id === site.id) form = empty();
    await invalidateAll();
  }

  function pasteCoords(e: ClipboardEvent) {
    const text = e.clipboardData?.getData('text') ?? '';
    const m = /(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/.exec(text);
    if (m) {
      e.preventDefault();
      form.lat = Number(m[1]);
      form.lon = Number(m[2]);
    }
  }

  async function upload(files: FileList | File[]) {
    if (!form.id) return;
    const list = Array.from(files);
    uploading = list.length;
    for (const file of list) {
      try {
        await adminUpload(`/admin/sites/${form.id}/attachments`, file, { kind: mapKind });
      } catch (err) {
        toast.show({
          kind: 'error',
          message: `${file.name}: ${err instanceof AdminApiError ? err.message : 'upload failed'}`,
        });
      }
      uploading -= 1;
    }
    await invalidateAll();
  }

  async function patchMedia(a: Attachment, patch: Partial<Pick<Attachment, 'caption' | 'kind'>>) {
    await adminJson(`/admin/attachments/${a.id}`, 'PATCH', patch);
    await invalidateAll();
  }

  async function removeMedia(a: Attachment) {
    if (!confirm(`Delete ${a.original_name || a.kind}?`)) return;
    await adminJson(`/admin/attachments/${a.id}`, 'DELETE');
    await invalidateAll();
  }

  function closeMap() {
    openMapId = null;
    draft = null;
    dirty = false;
    revisions = null;
    revisionNote = '';
  }

  function open(map: SiteMapOut) {
    if (dirty && !confirm('Discard unsaved changes to the open map?')) return;
    closeMap();
    openMapId = map.id;
    draft = map;
    editorKey += 1;
  }

  async function addMap(kind: MapKind) {
    if (!form.id) return;
    const created = await adminJson<SiteMapOut>(`/admin/sites/${form.id}/maps`, 'POST', {
      data: emptySiteMap(kind),
      note: 'Created',
    });
    await invalidateAll();
    open(created);
  }

  async function saveMap() {
    if (!openMap || !draft) return;
    savingMap = true;
    try {
      const saved = await adminJson<SiteMapOut>(`/admin/maps/${openMap.id}`, 'PUT', {
        data: draft,
        note: revisionNote,
      });
      toast.show({
        kind: 'success',
        message:
          saved.revision === openMap.revision
            ? 'No changes to save'
            : `Saved as revision ${saved.revision}`,
      });
      dirty = false;
      revisionNote = '';
      revisions = null;
      await invalidateAll();
    } catch (err) {
      toast.show({
        kind: 'error',
        message: err instanceof AdminApiError ? err.message : 'Could not save the map',
      });
    } finally {
      savingMap = false;
    }
  }

  async function removeMap(map: SiteMapOut) {
    const name = map.title || defaultTitle(map.kind);
    if (
      !confirm(
        `Delete “${name}” and all ${map.revisions} revisions? Dives annotated on it lose their route.`,
      )
    )
      return;
    await adminJson(`/admin/maps/${map.id}`, 'DELETE');
    if (openMapId === map.id) closeMap();
    await invalidateAll();
  }

  async function moveMap(i: number, delta: number) {
    const j = i + delta;
    if (!form.id || j < 0 || j >= maps.length) return;
    const order = maps.map((m) => m.id);
    [order[i], order[j]] = [order[j], order[i]];
    await adminJson(`/admin/sites/${form.id}/maps/order`, 'PUT', order);
    await invalidateAll();
  }

  async function loadRevisions() {
    if (!openMap) return;
    revisions = await adminJson<SiteMapRevision[]>(`/admin/maps/${openMap.id}/revisions`);
  }

  function preview(rev: SiteMapRevision) {
    if (!openMap) return;
    draft = rev.data;
    dirty = rev.number !== openMap.revision;
    revisionNote = dirty ? `Restored revision ${rev.number}` : '';
    editorKey += 1;
  }

  async function restore(rev: SiteMapRevision) {
    if (!openMap) return;
    const restored = await adminJson<SiteMapOut>(
      `/admin/maps/${openMap.id}/restore/${rev.number}`,
      'POST',
      { note: '' },
    );
    toast.show({
      kind: 'success',
      message: `Revision ${rev.number} restored as ${restored.revision}`,
    });
    await invalidateAll();
    draft = restored;
    dirty = false;
    revisions = null;
    editorKey += 1;
  }
</script>

<h1>Dive sites <span class="muted num">{data.sites.length}</span></h1>

<form class="card form" id="site-form" onsubmit={save}>
  <h2>{form.id ? `Edit ${form.name}` : 'New site'}</h2>
  <div class="field-row">
    <label>Name<input type="text" bind:value={form.name} required /></label>
    <label>Slug<input type="text" bind:value={form.slug} placeholder="auto from name" /></label>
    <label>
      Type
      <select bind:value={form.site_type}>
        {#each ['sea', 'lake', 'quarry', 'cave', 'river', 'pool'] as t (t)}<option value={t}
            >{t}</option
          >{/each}
      </select>
    </label>
  </div>
  <div class="field-row">
    <label
      >Country code<input
        type="text"
        maxlength="2"
        bind:value={form.country_code}
        required
      /></label
    >
    <label>Country<input type="text" bind:value={form.country_name} required /></label>
    <label>Region<input type="text" bind:value={form.region} /></label>
    <label>Max depth (m)<input type="number" step="1" bind:value={form.max_depth_m} /></label>
  </div>
  <div class="field-row">
    <label
      >Latitude<input
        type="number"
        step="any"
        bind:value={form.lat}
        onpaste={pasteCoords}
        placeholder="paste “lat, lon” from a map"
      /></label
    >
    <label>Longitude<input type="number" step="any" bind:value={form.lon} /></label>
    <label>
      Show location
      <select bind:value={form.location_visibility}>
        <option value="exact">exact pin</option>
        <option value="region_only">region only (hide coordinates)</option>
      </select>
    </label>
  </div>
  <label
    >Description (markdown)<textarea rows="4" bind:value={form.description_md}></textarea></label
  >
  {#if error}<p class="error">{error}</p>{/if}
  <div class="actions">
    <button type="submit" class="btn btn-solid btn-sm">{form.id ? 'Save' : 'Create'}</button>
    {#if form.id}<button
        type="button"
        class="btn btn-ghost btn-sm"
        onclick={() => {
          form = empty();
          closeMap();
        }}>Cancel</button
      >{/if}
    {#if form.lat !== '' && form.lon !== ''}
      <a
        class="btn btn-ghost btn-sm"
        href="https://www.openstreetmap.org/?mlat={form.lat}&mlon={form.lon}#map=14/{form.lat}/{form.lon}"
        target="_blank"
        rel="noopener">Check on OSM ↗</a
      >
    {/if}
    {#if form.id}
      <a class="btn btn-ghost btn-sm" href="/dive/sites/{form.slug}" target="_blank" rel="noopener"
        >View page ↗</a
      >
    {/if}
  </div>
</form>

{#if form.id}
  <section class="card panel">
    <h3>Map images</h3>
    <div class="dropzone">
      <label class="kind">
        Upload as
        <select bind:value={mapKind}>
          <option value="map">map (scan, drawing, screenshot)</option>
          <option value="photo">site photo</option>
        </select>
      </label>
      <label class="file">
        <span class="btn btn-ghost btn-sm"
          >{uploading ? `Uploading ${uploading}…` : 'Choose images'}</span
        >
        <input
          type="file"
          multiple
          accept="image/*"
          onchange={(e) => {
            const f = e.currentTarget.files;
            if (f?.length) void upload(f);
            e.currentTarget.value = '';
          }}
        />
      </label>
      <span class="muted">Uploads land immediately.</span>
    </div>
    {#if media.length}
      <ul class="media">
        {#each media as a (a.id)}
          <li class="media-row">
            <img src={a.variants.thumb ?? a.url} alt="" />
            <div class="media-fields">
              <input
                type="text"
                placeholder="Caption"
                value={a.caption}
                onchange={(e) => patchMedia(a, { caption: e.currentTarget.value })}
              />
              <div class="media-meta">
                <select
                  value={a.kind}
                  onchange={(e) =>
                    patchMedia(a, { kind: e.currentTarget.value as Attachment['kind'] })}
                >
                  <option value="map">map</option>
                  <option value="photo">photo</option>
                </select>
                <a href={a.url} target="_blank" rel="noopener" class="muted">open</a>
                <button
                  type="button"
                  class="btn btn-ghost btn-sm danger"
                  onclick={() => removeMedia(a)}>Delete</button
                >
              </div>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <section class="card panel">
    <div class="maps-head">
      <h3>Drawn maps</h3>
      <div class="actions">
        <button type="button" class="btn btn-ghost btn-sm" onclick={() => addMap('stickmap')}
          >+ Stick map</button
        >
        <button type="button" class="btn btn-ghost btn-sm" onclick={() => addMap('sitemap')}
          >+ Site map</button
        >
      </div>
    </div>
    <p class="muted">
      A stick map is a cave line survey; a site map is a lake, quarry or wreck with entry,
      platforms, objects and the shore. Every save is kept as a revision, and dives remember which
      revision they were drawn on.
    </p>
    {#if maps.length}
      <ul class="map-list">
        {#each maps as m, i (m.id)}
          <li class="map-row" class:open={openMapId === m.id}>
            <span class="badge">{defaultTitle(m.kind)}</span>
            <span class="map-title">{m.title || defaultTitle(m.kind)}</span>
            <span class="muted">{mapSummary(m)} · rev {m.revision}</span>
            <span class="row-actions">
              <button
                type="button"
                class="btn btn-ghost btn-sm"
                onclick={() => moveMap(i, -1)}
                aria-label="Move up">↑</button
              >
              <button
                type="button"
                class="btn btn-ghost btn-sm"
                onclick={() => moveMap(i, 1)}
                aria-label="Move down">↓</button
              >
              <button
                type="button"
                class="btn btn-ghost btn-sm"
                onclick={() => (openMapId === m.id ? closeMap() : open(m))}
                >{openMapId === m.id ? 'Close' : 'Edit'}</button
              >
              <button type="button" class="btn btn-ghost btn-sm danger" onclick={() => removeMap(m)}
                >Delete</button
              >
            </span>
          </li>
        {/each}
      </ul>
    {/if}

    {#if openMap && draft}
      <div class="map-editor">
        {#key editorKey}
          <SiteMapEditor
            value={draft}
            onChange={(m) => {
              draft = m;
              dirty = true;
            }}
          />
        {/key}
        <div class="save-row">
          <label class="grow">
            Revision note
            <input
              type="text"
              bind:value={revisionNote}
              maxlength="200"
              placeholder="e.g. added the left branch after dive 212"
            />
          </label>
          <button
            type="button"
            class="btn btn-solid btn-sm"
            disabled={!dirty || savingMap}
            onclick={saveMap}
            >{savingMap ? 'Saving…' : `Save as revision ${openMap.revision + 1}`}</button
          >
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            onclick={() => (revisions ? (revisions = null) : loadRevisions())}
            >{revisions ? 'Hide revisions' : `Revisions (${openMap.revisions})`}</button
          >
        </div>
        {#if revisions}
          <table class="revisions">
            <thead><tr><th>Rev</th><th>When</th><th>Note</th><th></th></tr></thead>
            <tbody>
              {#each revisions as rev (rev.id)}
                <tr class:current={rev.number === openMap.revision}>
                  <td class="num">{rev.number}</td>
                  <td class="num">{formatDate(rev.created_at.slice(0, 10))}</td>
                  <td>{rev.note || '—'}</td>
                  <td class="row-actions">
                    <button type="button" class="btn btn-ghost btn-sm" onclick={() => preview(rev)}
                      >Open</button
                    >
                    {#if rev.number !== openMap.revision}
                      <button
                        type="button"
                        class="btn btn-ghost btn-sm"
                        onclick={() => restore(rev)}>Restore</button
                      >
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}
      </div>
    {/if}
  </section>
{/if}

<table>
  <thead
    ><tr><th>Name</th><th>Country</th><th>Type</th><th>Maps</th><th>Position</th><th></th></tr
    ></thead
  >
  <tbody>
    {#each data.sites as site (site.id)}
      <tr>
        <td
          ><a href="/dive/sites/{site.slug}" target="_blank" rel="noopener">{site.name}</a
          >{#if site.region}<span class="muted"> · {site.region}</span>{/if}</td
        >
        <td>{site.country_code}</td>
        <td>{site.site_type}</td>
        <td class="muted"
          >{[
            ...site.maps.map((m) => m.title || defaultTitle(m.kind)),
            site.attachments.filter((a) => a.kind === 'map').length
              ? `${site.attachments.filter((a) => a.kind === 'map').length} image`
              : '',
          ]
            .filter(Boolean)
            .join(', ') || '—'}</td
        >
        <td class="num"
          >{site.lat !== null ? `${site.lat}, ${site.lon}` : '—'}{site.location_visibility ===
          'region_only'
            ? ' (hidden)'
            : ''}</td
        >
        <td class="row-actions">
          <button type="button" class="btn btn-ghost btn-sm" onclick={() => edit(site)}>Edit</button
          >
          <button type="button" class="btn btn-ghost btn-sm" onclick={() => remove(site)}
            >Delete</button
          >
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .muted {
    color: var(--color-text-faint);
    font-size: 14px;
    font-weight: 400;
  }
  .form,
  .panel {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 24px;
    background: var(--color-bg-elevated);
  }
  .form h2 {
    font-size: 16px;
    margin: 0;
  }
  .panel h3 {
    font-size: 15px;
    margin: 0;
  }
  .panel .muted {
    margin: 0;
  }
  .maps-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .dropzone {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 14px;
    padding: 12px;
    border: 1px dashed var(--color-border-strong);
    border-radius: var(--radius);
    background: var(--color-surface);
  }
  .kind {
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }
  .kind select {
    width: auto;
  }
  .file input {
    display: none;
  }
  .media {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .media-row {
    display: grid;
    grid-template-columns: 96px 1fr;
    gap: 12px;
    align-items: center;
    padding: 8px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    background: var(--color-surface);
  }
  .media-row img {
    width: 96px;
    height: 72px;
    object-fit: cover;
    border-radius: var(--radius-sm);
    background: var(--color-surface-2);
  }
  .media-fields {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .media-meta {
    display: flex;
    gap: 10px;
    align-items: center;
  }
  .media-meta select {
    width: auto;
    padding: 4px 8px;
  }
  .map-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .map-row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    padding: 8px 10px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    background: var(--color-surface);
  }
  .map-row.open {
    border-color: var(--color-accent);
  }
  .map-title {
    font-weight: 500;
  }
  .map-row .row-actions {
    margin-left: auto;
  }
  .badge {
    font-family: var(--font-mono);
    font-size: 10.5px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--color-accent-soft);
    color: var(--color-accent);
  }
  .map-editor {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--color-border);
  }
  .save-row {
    display: flex;
    gap: 8px;
    align-items: flex-end;
    flex-wrap: wrap;
  }
  .grow {
    flex: 1;
    min-width: 220px;
  }
  .revisions {
    font-size: 14px;
  }
  .revisions tr.current td {
    color: var(--color-accent);
  }
  .danger:hover {
    border-color: var(--color-error);
    color: var(--color-error);
  }
  .actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .row-actions {
    white-space: nowrap;
    text-align: right;
  }
</style>
