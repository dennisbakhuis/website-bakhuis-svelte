<script lang="ts">
  import SiteMapView from '$lib/components/dive/SiteMapView.svelte';
  import {
    addArea,
    addNode,
    AREA_KINDS,
    defaultTitle,
    edgeStylesFor,
    findNode,
    MAP_KINDS,
    mapSummary,
    moveNode,
    NODE_TYPES,
    nodeTypesFor,
    normalizeSiteMap,
    removeArea,
    removeNode,
    snap,
    toggleEdge,
    updateArea,
    updateEdge,
    updateNode,
    type AreaKind,
    type MapArea,
    type MapEdge,
    type MapKind,
    type MapPoint,
    type NodeType,
    type SiteMap,
  } from '$lib/dive/sitemap';

  let { value, onChange }: { value: SiteMap; onChange: (map: SiteMap) => void } = $props();

  type Tool = 'add' | 'connect' | 'move' | 'area';

  // The parent re-keys this component when it opens another map, so the
  // initial value is all we need here.
  // svelte-ignore state_referenced_locally
  let map = $state<SiteMap>(normalizeSiteMap(value));
  let tool = $state<Tool>('add');
  let grid = $state(1);
  // svelte-ignore state_referenced_locally
  let selectedNode = $state<string | null>(map.nodes.at(-1)?.id ?? null);
  let selectedEdge = $state<{ from: string; to: string } | null>(null);
  let selectedArea = $state<string | null>(null);
  let connectFrom = $state<string | null>(null);
  let draft = $state<MapPoint[]>([]);
  let draftKind = $state<AreaKind>('outline');
  let history = $state<SiteMap[]>([]);
  let showJson = $state(false);
  let jsonText = $state('');
  let jsonError = $state('');

  const node = $derived(selectedNode ? findNode(map, selectedNode) : undefined);
  const edge = $derived(
    selectedEdge
      ? map.edges.find(
          (e) =>
            (e.from === selectedEdge!.from && e.to === selectedEdge!.to) ||
            (e.from === selectedEdge!.to && e.to === selectedEdge!.from),
        )
      : undefined,
  );
  const area = $derived(selectedArea ? map.areas.find((a) => a.id === selectedArea) : undefined);
  const selection = $derived({
    node: selectedNode ?? undefined,
    edge: selectedEdge ?? undefined,
    area: selectedArea ?? undefined,
  });
  const nodeTypes = $derived.by(() => {
    const list = nodeTypesFor(map.kind);
    if (node && !list.some((t) => t.type === node.type)) {
      const extra = NODE_TYPES.find((t) => t.type === node.type);
      return extra ? [...list, extra] : list;
    }
    return list;
  });

  function commit(next: SiteMap) {
    history = [...history.slice(-49), map];
    map = next;
    onChange(next);
  }

  function undo() {
    const prev = history.pop();
    if (!prev) return;
    map = prev;
    onChange(prev);
    selectedNode = prev.nodes.some((n) => n.id === selectedNode) ? selectedNode : null;
    selectedEdge = null;
    selectedArea = null;
  }

  function clearSelection() {
    selectedNode = null;
    selectedEdge = null;
    selectedArea = null;
    connectFrom = null;
  }

  function onCanvasClick(x: number, y: number) {
    const sx = snap(x, grid);
    const sy = snap(y, grid);
    if (tool === 'area') {
      const first = draft[0];
      if (first && draft.length >= 3 && Math.hypot(first.x - sx, first.y - sy) <= grid * 2) {
        finishArea();
        return;
      }
      draft = [...draft, { x: sx, y: sy }];
      return;
    }
    selectedEdge = null;
    selectedArea = null;
    if (tool === 'add') {
      const { map: next, id } = addNode(map, sx, sy, selectedNode);
      commit(next);
      selectedNode = id;
    } else {
      clearSelection();
    }
  }

  function finishArea() {
    if (draft.length < 3) return;
    const { map: next, id } = addArea(map, draftKind, draft);
    draft = [];
    commit(next);
    clearSelection();
    selectedArea = id;
    tool = 'move';
  }

  function onNodeClick(id: string, shift: boolean) {
    if (tool === 'area') return;
    selectedEdge = null;
    selectedArea = null;
    if (tool === 'connect' || shift) {
      if (connectFrom && connectFrom !== id) {
        commit(toggleEdge(map, connectFrom, id));
        connectFrom = null;
        selectedNode = id;
      } else {
        connectFrom = id;
        selectedNode = id;
      }
      return;
    }
    selectedNode = id;
  }

  function onEdgeClick(e: MapEdge) {
    if (tool === 'area') return;
    clearSelection();
    selectedEdge = { from: e.from, to: e.to };
  }

  function onAreaClick(a: MapArea) {
    if (tool === 'area') return;
    clearSelection();
    selectedArea = a.id;
  }

  let dragStart: SiteMap | null = null;
  function onNodeMove(id: string, x: number, y: number, done: boolean) {
    if (!dragStart) dragStart = map;
    const moved = moveNode(map, id, snap(x, grid), snap(y, grid));
    if (done) {
      const start = dragStart;
      dragStart = null;
      history = [...history.slice(-49), start];
      map = moved;
      onChange(moved);
      selectedNode = id;
    } else {
      map = moved;
    }
  }

  function deleteSelection() {
    if (selectedNode) {
      commit(removeNode(map, selectedNode));
      selectedNode = null;
    } else if (selectedEdge) {
      commit(toggleEdge(map, selectedEdge.from, selectedEdge.to));
      selectedEdge = null;
    } else if (selectedArea) {
      commit(removeArea(map, selectedArea));
      selectedArea = null;
    }
  }

  function patchNode(patch: Partial<(typeof map.nodes)[number]>) {
    if (!selectedNode) return;
    commit(updateNode(map, selectedNode, patch));
  }

  function patchEdge(patch: Partial<MapEdge>) {
    if (!selectedEdge) return;
    commit(updateEdge(map, selectedEdge.from, selectedEdge.to, patch));
  }

  function patchArea(patch: Partial<MapArea>) {
    if (!selectedArea) return;
    commit(updateArea(map, selectedArea, patch));
  }

  function numberOrNull(value: string): number | null {
    return value.trim() === '' ? null : Number(value);
  }

  function onKey(e: KeyboardEvent) {
    const target = e.target as HTMLElement | null;
    if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      if (draft.length) draft = draft.slice(0, -1);
      else deleteSelection();
    } else if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
      e.preventDefault();
      undo();
    } else if (e.key === 'Enter' && draft.length) {
      e.preventDefault();
      finishArea();
    } else if (e.key === 'Escape') {
      draft = [];
      clearSelection();
    } else if (e.key === 'a') tool = 'add';
    else if (e.key === 'c') tool = 'connect';
    else if (e.key === 'm') tool = 'move';
    else if (e.key === 'r') tool = 'area';
  }

  function openJson() {
    jsonText = JSON.stringify(map, null, 2);
    jsonError = '';
    showJson = true;
  }

  function applyJson() {
    try {
      commit(normalizeSiteMap(JSON.parse(jsonText)));
      clearSelection();
      jsonError = '';
      showJson = false;
    } catch (err) {
      jsonError = err instanceof Error ? err.message : 'Invalid JSON';
    }
  }

  function clear() {
    if (!confirm('Remove everything on this map?')) return;
    commit({ ...map, nodes: [], edges: [], areas: [] });
    draft = [];
    clearSelection();
  }

  const tools: { tool: Tool; label: string; title: string }[] = [
    {
      tool: 'add',
      label: 'Add',
      title: 'Click the canvas to add a station linked to the selected one (A)',
    },
    {
      tool: 'connect',
      label: 'Connect',
      title: 'Click two stations to add or remove the line between them (C)',
    },
    { tool: 'move', label: 'Move', title: 'Drag stations, click things to edit them (M)' },
    {
      tool: 'area',
      label: 'Area',
      title:
        'Click corners of a shore, wreck or shallows; click the first point or press Enter to close (R)',
    },
  ];
</script>

<svelte:window onkeydown={onKey} />

<div class="editor">
  <div class="meta">
    <label>
      Kind
      <select
        value={map.kind}
        onchange={(e) => commit({ ...map, kind: e.currentTarget.value as MapKind })}
      >
        {#each MAP_KINDS as k (k.kind)}<option value={k.kind} title={k.hint}>{k.label}</option
          >{/each}
      </select>
    </label>
    <label class="grow">
      Title
      <input
        type="text"
        value={map.title}
        maxlength="120"
        placeholder={defaultTitle(map.kind)}
        onchange={(e) => commit({ ...map, title: e.currentTarget.value })}
      />
    </label>
  </div>

  <div class="toolbar">
    <div class="tools" role="radiogroup" aria-label="Tool">
      {#each tools as t (t.tool)}
        <button
          type="button"
          class="btn btn-sm"
          class:btn-solid={tool === t.tool}
          class:btn-ghost={tool !== t.tool}
          role="radio"
          aria-checked={tool === t.tool}
          onclick={() => {
            tool = t.tool;
            if (t.tool !== 'area') draft = [];
          }}
          title={t.title}>{t.label}</button
        >
      {/each}
    </div>
    {#if tool === 'area'}
      <label class="inline">
        as
        <select bind:value={draftKind}>
          {#each AREA_KINDS as a (a.kind)}<option value={a.kind}>{a.label}</option>{/each}
        </select>
      </label>
    {/if}
    <label class="inline">
      Snap
      <select bind:value={grid}>
        <option value={0.5}>0.5 m</option>
        <option value={1}>1 m</option>
        <option value={5}>5 m</option>
      </select>
    </label>
    <span class="spacer"></span>
    <button type="button" class="btn btn-ghost btn-sm" onclick={undo} disabled={!history.length}
      >Undo</button
    >
    <button
      type="button"
      class="btn btn-ghost btn-sm"
      onclick={deleteSelection}
      disabled={!selectedNode && !selectedEdge && !selectedArea}>Delete</button
    >
    <button type="button" class="btn btn-ghost btn-sm" onclick={openJson}>JSON</button>
    <button type="button" class="btn btn-ghost btn-sm danger" onclick={clear}>Clear</button>
  </div>

  <div class="canvas-row">
    <div class="canvas">
      <SiteMapView
        {map}
        editable
        {selection}
        {draft}
        {onCanvasClick}
        {onNodeClick}
        {onEdgeClick}
        {onAreaClick}
        {onNodeMove}
      />
      <p class="hint">
        {#if tool === 'area'}
          {draft.length
            ? `${draft.length} corners. Click the first point or press Enter to close, Backspace removes the last corner.`
            : 'Click the corners of the area. Areas sit under everything else.'}
        {:else if map.nodes.length === 0}
          Click anywhere to place the {map.kind === 'sitemap' ? 'entry point' : 'entrance'}, then
          keep clicking to lay the line. Drag to move, shift-click two stations to connect them.
        {:else if tool === 'add'}
          Adding after <strong>{node?.label || node?.id || 'nothing'}</strong>. Click a station
          first to branch from it.
        {:else if tool === 'connect'}
          {connectFrom ? `Now click the other end for ${connectFrom}.` : 'Click the first station.'}
        {:else}
          Drag stations. Click a line or an area to edit it.
        {/if}
      </p>
    </div>

    <aside class="panel">
      {#if node}
        <h3>Station <span class="num">{node.id}</span></h3>
        <label>
          Type
          <select
            value={node.type}
            onchange={(e) => patchNode({ type: e.currentTarget.value as NodeType })}
          >
            {#each nodeTypes as t (t.type)}
              <option value={t.type} title={t.hint}>{t.label}</option>
            {/each}
          </select>
        </label>
        <label>
          Label
          <input
            type="text"
            value={node.label}
            maxlength="80"
            onchange={(e) => patchNode({ label: e.currentTarget.value })}
          />
        </label>
        <label>
          Depth (m)
          <input
            type="number"
            step="0.1"
            value={node.depth ?? ''}
            onchange={(e) => patchNode({ depth: numberOrNull(e.currentTarget.value) })}
          />
        </label>
        <div class="xy">
          <label>
            East (m)
            <input
              type="number"
              step="0.5"
              value={node.x}
              onchange={(e) => patchNode({ x: Number(e.currentTarget.value) })}
            />
          </label>
          <label>
            South (m)
            <input
              type="number"
              step="0.5"
              value={node.y}
              onchange={(e) => patchNode({ y: Number(e.currentTarget.value) })}
            />
          </label>
        </div>
      {:else if edge}
        <h3>Line <span class="num">{edge.from} → {edge.to}</span></h3>
        <label>
          Measured distance (m)
          <input
            type="number"
            step="0.1"
            value={edge.distance ?? ''}
            placeholder="drawn length"
            onchange={(e) => patchEdge({ distance: numberOrNull(e.currentTarget.value) })}
          />
        </label>
        <label>
          Style
          <select
            value={edge.style}
            onchange={(e) => patchEdge({ style: e.currentTarget.value as MapEdge['style'] })}
          >
            {#each edgeStylesFor(map.kind) as s (s.style)}<option value={s.style}>{s.label}</option
              >{/each}
          </select>
        </label>
        <label>
          Note
          <input
            type="text"
            value={edge.note}
            maxlength="120"
            placeholder="e.g. silty, low, arrows point out"
            onchange={(e) => patchEdge({ note: e.currentTarget.value })}
          />
        </label>
      {:else if area}
        <h3>Area <span class="num">{area.id}</span></h3>
        <label>
          Kind
          <select
            value={area.kind}
            onchange={(e) => patchArea({ kind: e.currentTarget.value as AreaKind })}
          >
            {#each AREA_KINDS as a (a.kind)}<option value={a.kind}>{a.label}</option>{/each}
          </select>
        </label>
        <label>
          Label
          <input
            type="text"
            value={area.label}
            maxlength="80"
            onchange={(e) => patchArea({ label: e.currentTarget.value })}
          />
        </label>
        <label>
          Depth (m)
          <input
            type="number"
            step="0.1"
            value={area.depth ?? ''}
            placeholder={area.kind === 'depth' ? 'shallow edge of the band' : 'optional'}
            onchange={(e) => patchArea({ depth: numberOrNull(e.currentTarget.value) })}
          />
        </label>
        {#if area.kind === 'depth'}
          <p class="muted">
            Bands are drawn shallow to deep and coloured by this depth, so draw the whole area each
            band covers and let the deeper ones sit on top.
          </p>
        {/if}
        <p class="muted">{area.points.length} corners. Delete and redraw to change the shape.</p>
      {:else}
        <h3>{map.title || defaultTitle(map.kind)}</h3>
        <p class="muted">{mapSummary(map)}</p>
        <p class="muted">
          Select a station, a line or an area to edit it. Coordinates are metres in plan view; the
          compass follows the north bearing below.
        </p>
      {/if}
      <label>
        North (&deg;)
        <input
          type="number"
          step="1"
          min="0"
          max="359"
          value={map.north}
          onchange={(e) => commit({ ...map, north: numberOrNull(e.currentTarget.value) ?? 0 })}
        />
      </label>
      <p class="muted">
        The bearing the top of the drawing points to. Leave at 0 for a north-up plan, or set it when
        you draw a shore or a passage along the page.
      </p>
      <label>
        Notes
        <textarea
          rows="3"
          value={map.notes}
          maxlength="2000"
          onchange={(e) => commit({ ...map, notes: e.currentTarget.value })}
        ></textarea>
      </label>
    </aside>
  </div>

  {#if showJson}
    <div class="json">
      <textarea rows="10" bind:value={jsonText} spellcheck="false"></textarea>
      {#if jsonError}<p class="error">{jsonError}</p>{/if}
      <div class="json-actions">
        <button type="button" class="btn btn-solid btn-sm" onclick={applyJson}>Apply JSON</button>
        <button type="button" class="btn btn-ghost btn-sm" onclick={() => (showJson = false)}
          >Close</button
        >
        <span class="muted">Paste a map exported from survey software, or copy this one out.</span>
      </div>
    </div>
  {/if}
</div>

<style>
  .editor {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .meta {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
  .meta label {
    min-width: 160px;
  }
  .meta .grow {
    flex: 1;
  }
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  .tools {
    display: flex;
    gap: 4px;
  }
  .inline {
    flex-direction: row;
    align-items: center;
    gap: 6px;
    font-size: 13px;
  }
  .inline select {
    width: auto;
    padding: 4px 8px;
  }
  .spacer {
    flex: 1;
  }
  .canvas-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 260px;
    gap: 16px;
    align-items: start;
  }
  .hint {
    font-size: 13px;
    color: var(--color-text-muted);
    margin: 8px 0 0;
  }
  .panel {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    background: var(--color-surface);
  }
  .panel h3 {
    font-size: 15px;
    margin: 0;
  }
  .xy {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .muted {
    color: var(--color-text-faint);
    font-size: 13px;
    margin: 0;
  }
  .danger:hover {
    border-color: var(--color-error);
    color: var(--color-error);
  }
  .json textarea {
    font-family: var(--font-mono);
    font-size: 12.5px;
    width: 100%;
  }
  .json-actions {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
    margin-top: 8px;
  }
  .error {
    color: var(--color-error);
    font-size: 13px;
  }
  @media (max-width: 760px) {
    .canvas-row {
      grid-template-columns: 1fr;
    }
  }
</style>
