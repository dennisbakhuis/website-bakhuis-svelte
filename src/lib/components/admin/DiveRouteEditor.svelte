<script lang="ts">
  import SiteMapView from '$lib/components/dive/SiteMapView.svelte';
  import {
    addPin,
    annotationSummary,
    defaultTitle,
    emptyAnnotation,
    fitAnnotation,
    removePin,
    routeKeys,
    toggleRouteLeg,
    updatePin,
    type DiveMapAnnotation,
    type DiveMapPin,
    type MapEdge,
    type SiteMapOut,
  } from '$lib/dive/sitemap';

  let {
    maps,
    value,
    drawnOn = null,
    onChange,
  }: {
    /** The site's current maps. */
    maps: SiteMapOut[];
    value: DiveMapAnnotation | null;
    /** The revision the existing annotation was drawn on, when it is not current. */
    drawnOn?: SiteMapOut | null;
    onChange: (annotation: DiveMapAnnotation | null) => void;
  } = $props();

  type Tool = 'route' | 'turn' | 'pin';
  let tool = $state<Tool>('route');
  let selectedPin = $state<string | null>(null);

  const chosen = $derived(value ? maps.find((m) => m.id === value.map_id) : undefined);
  // Draw on the revision the annotation was made on until the owner moves it forward.
  const map = $derived(
    value && drawnOn && drawnOn.id === value.map_id && drawnOn.revision === value.revision
      ? drawnOn
      : chosen,
  );
  const behind = $derived(!!value && !!chosen && chosen.revision !== value.revision);
  const route = $derived(value ? routeKeys(value) : new Set<string>());
  const pin = $derived(
    value && selectedPin ? value.pins.find((p) => p.id === selectedPin) : undefined,
  );

  function choose(id: string) {
    const target = maps.find((m) => m.id === id);
    onChange(target ? emptyAnnotation(target) : null);
    selectedPin = null;
  }

  function onEdgeClick(edge: MapEdge) {
    if (!value) return;
    onChange(toggleRouteLeg(value, edge.from, edge.to));
  }

  function onNodeClick(id: string) {
    if (!value) return;
    if (tool === 'turn' || tool === 'route') {
      if (tool === 'turn') onChange({ ...value, turn: value.turn === id ? null : id });
    }
  }

  function onCanvasClick(x: number, y: number) {
    if (!value) return;
    if (tool === 'pin') {
      const added = addPin(value, Math.round(x * 2) / 2, Math.round(y * 2) / 2);
      onChange(added.annotation);
      selectedPin = added.id;
      return;
    }
    selectedPin = null;
  }

  function onPinClick(p: DiveMapPin) {
    selectedPin = selectedPin === p.id ? null : p.id;
  }

  function moveToCurrent() {
    if (!value || !chosen) return;
    onChange({ ...fitAnnotation(chosen, value), revision: chosen.revision });
  }
</script>

<div class="route-editor">
  <div class="pick">
    <label>
      Map
      <select value={value?.map_id ?? ''} onchange={(e) => choose(e.currentTarget.value)}>
        <option value="">— none —</option>
        {#each maps as m (m.id)}
          <option value={m.id}>{m.title || defaultTitle(m.kind)} · rev {m.revision}</option>
        {/each}
      </select>
    </label>
    {#if value && map}
      <div class="tools" role="radiogroup" aria-label="Annotation tool">
        <button
          type="button"
          class="btn btn-sm"
          class:btn-solid={tool === 'route'}
          class:btn-ghost={tool !== 'route'}
          role="radio"
          aria-checked={tool === 'route'}
          onclick={() => (tool = 'route')}
          title="Click the lines you swam">Route</button
        >
        <button
          type="button"
          class="btn btn-sm"
          class:btn-solid={tool === 'turn'}
          class:btn-ghost={tool !== 'turn'}
          role="radio"
          aria-checked={tool === 'turn'}
          onclick={() => (tool = 'turn')}
          title="Click the station where you turned">Turn point</button
        >
        <button
          type="button"
          class="btn btn-sm"
          class:btn-solid={tool === 'pin'}
          class:btn-ghost={tool !== 'pin'}
          role="radio"
          aria-checked={tool === 'pin'}
          onclick={() => (tool = 'pin')}
          title="Click anywhere to drop a numbered note">Note pin</button
        >
      </div>
      <button type="button" class="btn btn-ghost btn-sm" onclick={() => choose('')}>Remove</button>
    {/if}
  </div>

  {#if value && map}
    {#if behind}
      <p class="behind">
        Drawn on revision {value.revision}; the map is now at revision {chosen?.revision}.
        <button type="button" class="link" onclick={moveToCurrent}>Move to the current map</button>
        (legs that no longer exist are dropped).
      </p>
    {/if}
    <SiteMapView
      {map}
      editable
      {route}
      turn={value.turn}
      pins={value.pins}
      selection={{ pin: selectedPin ?? undefined }}
      {onEdgeClick}
      {onNodeClick}
      {onCanvasClick}
      {onPinClick}
    />
    <p class="hint">
      {#if tool === 'route'}
        Click lines to mark what you swam. {annotationSummary(map, value) || 'Nothing marked yet.'}
      {:else if tool === 'turn'}
        Click the station where you turned the dive.
      {:else}
        Click the map to drop a note, then write it below.
      {/if}
    </p>
    {#if pin}
      <div class="pin-row">
        <label class="grow">
          Note {value.pins.findIndex((p) => p.id === pin.id) + 1}
          <input
            type="text"
            value={pin.note}
            maxlength="200"
            placeholder="e.g. silt-out drill here, found the jump"
            onchange={(e) => onChange(updatePin(value!, pin.id, { note: e.currentTarget.value }))}
          />
        </label>
        <button
          type="button"
          class="btn btn-ghost btn-sm danger"
          onclick={() => {
            onChange(removePin(value!, pin.id));
            selectedPin = null;
          }}>Delete note</button
        >
      </div>
    {/if}
    <label>
      What happened
      <input
        type="text"
        value={value.note}
        maxlength="500"
        placeholder="e.g. turned on thirds at the T, 42 m"
        onchange={(e) => onChange({ ...value!, note: e.currentTarget.value })}
      />
    </label>
  {:else if maps.length === 0}
    <p class="muted">This site has no drawn maps yet. Add one under Sites first.</p>
  {/if}
</div>

<style>
  .route-editor {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .pick {
    display: flex;
    gap: 12px;
    align-items: flex-end;
    flex-wrap: wrap;
  }
  .pick label {
    min-width: 220px;
  }
  .tools {
    display: flex;
    gap: 4px;
  }
  .hint,
  .muted {
    font-size: 13px;
    color: var(--color-text-muted);
    margin: 0;
  }
  .behind {
    font-size: 13px;
    color: var(--color-warm);
    margin: 0;
  }
  .link {
    background: none;
    border: 0;
    padding: 0;
    color: var(--color-accent);
    text-decoration: underline;
    cursor: pointer;
    font: inherit;
  }
  .pin-row {
    display: flex;
    gap: 8px;
    align-items: flex-end;
  }
  .grow {
    flex: 1;
  }
  .danger:hover {
    border-color: var(--color-error);
    color: var(--color-error);
  }
</style>
