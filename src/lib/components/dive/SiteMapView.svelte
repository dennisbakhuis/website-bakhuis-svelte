<script lang="ts">
  import MapGlyph from './MapGlyph.svelte';
  import {
    depthLabel,
    edgeEndpoints,
    edgeKey,
    edgeLength,
    depthFill,
    mapBounds,
    maxDepth,
    orderedAreas,
    type DiveMapPin,
    type MapArea,
    type MapEdge,
    type MapNode,
    type MapPoint,
    type SiteMap,
  } from '$lib/dive/sitemap';

  type Selection = {
    node?: string;
    edge?: { from: string; to: string };
    area?: string;
    pin?: string;
  } | null;

  let {
    map,
    title = 'Site map',
    selection = null,
    editable = false,
    draft = [],
    route = null,
    turn = null,
    pins = [],
    onCanvasClick,
    onNodeClick,
    onEdgeClick,
    onAreaClick,
    onPinClick,
    onNodeMove,
  }: {
    map: SiteMap;
    title?: string;
    selection?: Selection;
    editable?: boolean;
    draft?: MapPoint[];
    /** Edge keys of the legs a dive covered; when set, everything else is dimmed. */
    route?: Set<string> | null;
    turn?: string | null;
    pins?: DiveMapPin[];
    onCanvasClick?: (x: number, y: number) => void;
    onNodeClick?: (id: string, shift: boolean) => void;
    onEdgeClick?: (edge: MapEdge) => void;
    onAreaClick?: (area: MapArea) => void;
    onPinClick?: (pin: DiveMapPin) => void;
    onNodeMove?: (id: string, x: number, y: number, done: boolean) => void;
  } = $props();

  let clientWidth = $state(0);
  const extent = $derived(mapBounds(map, 0));
  const box = $derived(
    mapBounds(map, Math.max(10, Math.min(30, (extent.maxX - extent.minX) * 0.12))),
  );
  const width = $derived(box.maxX - box.minX);
  const height = $derived(box.maxY - box.minY);
  // One CSS pixel in map units, so glyphs and text keep a fixed on-screen size
  // however large the site is.
  const k = $derived(clientWidth > 0 ? width / clientWidth : width / 800);
  const aspect = $derived(Math.min(2.2, Math.max(1.1, width / height)));
  const gridStep = $derived(width > 400 ? 50 : width > 150 ? 20 : width > 60 ? 10 : 5);
  const gridLines = $derived.by(() => {
    const xs: number[] = [];
    const ys: number[] = [];
    for (let x = Math.ceil(box.minX / gridStep) * gridStep; x <= box.maxX; x += gridStep)
      xs.push(x);
    for (let y = Math.ceil(box.minY / gridStep) * gridStep; y <= box.maxY; y += gridStep)
      ys.push(y);
    return { xs, ys };
  });

  let svg = $state<SVGSVGElement>();
  let drag: { id: string; moved: boolean; pointerId: number } | null = null;

  function toMap(e: PointerEvent | MouseEvent): { x: number; y: number } {
    if (!svg) return { x: 0, y: 0 };
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  }

  function nodeDown(e: PointerEvent, node: MapNode) {
    if (!editable) return;
    e.stopPropagation();
    drag = { id: node.id, moved: false, pointerId: e.pointerId };
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  }

  function nodeMove(e: PointerEvent) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const { x, y } = toMap(e);
    drag.moved = true;
    onNodeMove?.(drag.id, x, y, false);
  }

  function nodeUp(e: PointerEvent, node: MapNode) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const current = drag;
    drag = null;
    if (current.moved) {
      const { x, y } = toMap(e);
      onNodeMove?.(node.id, x, y, true);
    } else {
      onNodeClick?.(node.id, e.shiftKey);
    }
  }

  function canvasClick(e: MouseEvent) {
    if (!editable || !onCanvasClick) return;
    const { x, y } = toMap(e);
    onCanvasClick(x, y);
  }

  function isSelectedEdge(edge: MapEdge): boolean {
    const s = selection?.edge;
    return (
      !!s &&
      ((s.from === edge.from && s.to === edge.to) || (s.from === edge.to && s.to === edge.from))
    );
  }

  function midpoint(edge: MapEdge): { x: number; y: number; angle: number } | null {
    const ends = edgeEndpoints(map, edge);
    if (!ends) return null;
    const dx = ends.b.x - ends.a.x;
    const dy = ends.b.y - ends.a.y;
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (angle > 90 || angle < -90) angle += 180;
    return { x: (ends.a.x + ends.b.x) / 2, y: (ends.a.y + ends.b.y) / 2, angle };
  }

  function polygon(points: MapPoint[]): string {
    return points.map((p) => `${p.x},${p.y}`).join(' ');
  }

  function centroid(points: MapPoint[]): MapPoint {
    const n = points.length || 1;
    return {
      x: points.reduce((s, p) => s + p.x, 0) / n,
      y: points.reduce((s, p) => s + p.y, 0) / n,
    };
  }

  const scaleBar = $derived(gridStep);
  const areas = $derived(orderedAreas(map));
  const deepest = $derived(maxDepth(map) ?? 0);

  function areaFill(area: MapArea): string | undefined {
    return area.kind === 'depth' ? depthFill(area.depth, deepest) : undefined;
  }

  // A depth band is drawn contour first, so its opening corner sits on the
  // contour itself — the one spot a nested band is never covered by a deeper one.
  function bandLabelAt(area: MapArea): MapPoint {
    return area.points[0];
  }

  function onRoute(edge: MapEdge): boolean {
    return !!route && route.has(edgeKey(edge.from, edge.to));
  }

  function nodeOnRoute(id: string): boolean {
    if (!route) return true;
    for (const key of route) if (key.split('|').includes(id)) return true;
    return false;
  }
</script>

<svg
  bind:this={svg}
  bind:clientWidth
  class="sitemap"
  class:editable
  class:routed={route !== null}
  style="aspect-ratio: {aspect}"
  viewBox="{box.minX} {box.minY} {width} {height}"
  role={editable ? 'application' : 'img'}
  aria-label={title}
  onclick={canvasClick}
>
  <g class="grid">
    {#each gridLines.xs as x (x)}
      <line x1={x} y1={box.minY} x2={x} y2={box.maxY} />
    {/each}
    {#each gridLines.ys as y (y)}
      <line x1={box.minX} y1={y} x2={box.maxX} y2={y} />
    {/each}
  </g>

  <g class="areas">
    {#each areas as area (area.id)}
      {@const c = area.kind === 'depth' ? bandLabelAt(area) : centroid(area.points)}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <g
        class="area {area.kind}"
        class:selected={selection?.area === area.id}
        role={editable ? 'button' : undefined}
        tabindex={editable ? 0 : undefined}
        onclick={(e) => {
          if (!editable) return;
          e.stopPropagation();
          onAreaClick?.(area);
        }}
        onkeydown={(e) => {
          if (editable && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onAreaClick?.(area);
          }
        }}
      >
        <polygon points={polygon(area.points)} style:fill={areaFill(area)} />
        {#if area.label || area.depth !== null}
          <text
            class="area-label"
            class:band={area.kind === 'depth'}
            x={c.x}
            y={c.y}
            dy={area.kind === 'depth' ? -4 * k : 0}
            font-size={10.5 * k}
            text-anchor="middle">{area.label || depthLabel(area.depth)}</text
          >
        {/if}
      </g>
    {/each}
    {#if draft.length}
      <polyline class="draft" points={polygon(draft)} />
      {#each draft as p, i (i)}
        <circle class="draft-point" class:first={i === 0} cx={p.x} cy={p.y} r={4 * k} />
      {/each}
    {/if}
  </g>

  <g class="edges">
    {#each map.edges as edge (`${edge.from}-${edge.to}`)}
      {@const ends = edgeEndpoints(map, edge)}
      {#if ends}
        {@const mid = midpoint(edge)}
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <g
          class="edge {edge.style}"
          class:selected={isSelectedEdge(edge)}
          class:on-route={onRoute(edge)}
          role={editable ? 'button' : undefined}
          tabindex={editable ? 0 : undefined}
          onclick={(e) => {
            if (!editable) return;
            e.stopPropagation();
            onEdgeClick?.(edge);
          }}
          onkeydown={(e) => {
            if (editable && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              onEdgeClick?.(edge);
            }
          }}
        >
          <line class="hit" x1={ends.a.x} y1={ends.a.y} x2={ends.b.x} y2={ends.b.y} />
          <line class="line" x1={ends.a.x} y1={ends.a.y} x2={ends.b.x} y2={ends.b.y} />
          {#if mid}
            <text
              class="distance"
              x={mid.x}
              y={mid.y}
              dy={-5 * k}
              font-size={10.5 * k}
              text-anchor="middle"
              transform="rotate({mid.angle} {mid.x} {mid.y})"
              >{edgeLength(map, edge)} m{edge.note ? ` · ${edge.note}` : ''}</text
            >
          {/if}
        </g>
      {/if}
    {/each}
  </g>

  <g class="nodes">
    {#each map.nodes as node, i (node.id)}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <g
        class="node {node.type}"
        class:selected={selection?.node === node.id}
        class:off-route={!nodeOnRoute(node.id)}
        class:turn={turn === node.id}
        transform="translate({node.x} {node.y})"
        role={editable ? 'button' : undefined}
        tabindex={editable ? 0 : undefined}
        aria-label={node.label || node.type}
        onpointerdown={(e) => nodeDown(e, node)}
        onpointermove={nodeMove}
        onpointerup={(e) => nodeUp(e, node)}
        onclick={(e) => e.stopPropagation()}
        onkeydown={(e) => {
          if (editable && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onNodeClick?.(node.id, e.shiftKey);
          }
        }}
      >
        <circle class="hit" r={14 * k} />
        {#if turn === node.id}
          <circle class="turn-ring" r={13 * k} />
        {/if}
        <MapGlyph type={node.type} {k} />
        {#if node.label || node.depth !== null}
          {@const below = i % 2 === 1}
          <text class="label" x={11 * k} y={below ? 14 * k : -6 * k} font-size={11.5 * k}
            >{node.label}</text
          >
          <text class="depth" x={11 * k} y={below ? 25 * k : 5 * k} font-size={9.5 * k}
            >{depthLabel(node.depth)}</text
          >
        {/if}
      </g>
    {/each}
  </g>

  <g class="pins">
    {#each pins as pin, i (pin.id)}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <g
        class="pin"
        class:selected={selection?.pin === pin.id}
        transform="translate({pin.x} {pin.y})"
        role={editable ? 'button' : undefined}
        tabindex={editable ? 0 : undefined}
        aria-label={pin.note || `Note ${i + 1}`}
        onclick={(e) => {
          if (!editable) return;
          e.stopPropagation();
          onPinClick?.(pin);
        }}
        onkeydown={(e) => {
          if (editable && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onPinClick?.(pin);
          }
        }}
      >
        <path
          class="pin-shape"
          d="M0 0 L{-6 * k} {-12 * k} A{7 * k} {7 * k} 0 1 1 {6 * k} {-12 * k} Z"
        />
        <text class="pin-number" y={-11 * k} font-size={8.5 * k} text-anchor="middle">{i + 1}</text>
        {#if pin.note}
          <text class="pin-note" x={10 * k} y={-10 * k} font-size={10 * k}>{pin.note}</text>
        {/if}
      </g>
    {/each}
  </g>

  <g
    class="compass"
    transform="translate({box.maxX - 24 * k} {box.minY + 30 * k})"
    font-size={10 * k}
  >
    <g transform="rotate({-map.north})">
      <line x1="0" y1={12 * k} x2="0" y2={-12 * k} />
      <path d="M0 {-16 * k} L{5 * k} {-4 * k} L{-5 * k} {-4 * k} Z" />
      <text
        y={-20 * k}
        text-anchor="middle"
        transform="rotate({map.north} 0 {-20 * k})"
        dominant-baseline="middle">N</text
      >
    </g>
  </g>
  <g
    class="scale"
    transform="translate({box.minX + 14 * k} {box.maxY - 14 * k})"
    font-size={9.5 * k}
  >
    <line x1="0" y1="0" x2={scaleBar} y2="0" />
    <line x1="0" y1={-4 * k} x2="0" y2={4 * k} />
    <line x1={scaleBar} y1={-4 * k} x2={scaleBar} y2={4 * k} />
    <text x={scaleBar / 2} y={-6 * k} text-anchor="middle">{scaleBar} m</text>
  </g>
</svg>

<style>
  .sitemap {
    --map-bg: var(--color-bg-elevated);
    --map-coral: #2f8f6f;
    --map-sand: #d8c9a3;
    display: block;
    width: 100%;
    height: auto;
    background: var(--map-bg);
    border-radius: var(--radius);
    border: 1px solid var(--color-border);
    color: var(--color-text);
    font-family: var(--font-mono);
    touch-action: none;
    user-select: none;
  }
  .sitemap.editable {
    cursor: crosshair;
  }
  .grid line {
    stroke: color-mix(in srgb, currentColor 8%, transparent);
    stroke-width: 1px;
    vector-effect: non-scaling-stroke;
  }
  .area polygon {
    stroke-width: 2px;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
  }
  .area.outline polygon {
    fill: color-mix(in srgb, currentColor 5%, transparent);
    stroke: currentColor;
    stroke-width: 2.5px;
  }
  .area.depth polygon {
    stroke: color-mix(in srgb, var(--color-accent) 30%, transparent);
    stroke-width: 1.5px;
  }
  .area.coral polygon {
    fill: color-mix(in srgb, var(--map-coral) 42%, transparent);
    stroke: color-mix(in srgb, var(--map-coral) 75%, transparent);
  }
  .area.sand polygon {
    fill: color-mix(in srgb, var(--map-sand) 20%, transparent);
    stroke: color-mix(in srgb, var(--map-sand) 40%, transparent);
  }
  .area.shallows polygon {
    fill: color-mix(in srgb, var(--color-accent) 14%, transparent);
    stroke: color-mix(in srgb, var(--color-accent) 50%, transparent);
  }
  .area.wall polygon {
    fill: color-mix(in srgb, var(--color-warm) 10%, transparent);
    stroke: var(--color-warm);
    stroke-dasharray: 8 4;
  }
  .area.wreck polygon {
    fill: color-mix(in srgb, currentColor 28%, transparent);
    stroke: currentColor;
  }
  .area.reeds polygon {
    fill: color-mix(in srgb, var(--color-success) 18%, transparent);
    stroke: color-mix(in srgb, var(--color-success) 60%, transparent);
  }
  .area.other polygon {
    fill: color-mix(in srgb, currentColor 8%, transparent);
    stroke: color-mix(in srgb, currentColor 40%, transparent);
  }
  .editable .area {
    cursor: pointer;
  }
  .area.selected polygon,
  .editable .area:hover polygon {
    stroke: var(--color-accent);
    stroke-width: 3px;
  }
  .area-label.band {
    fill: color-mix(in srgb, var(--color-accent) 70%, var(--color-text));
    font-family: var(--font-mono);
    stroke-width: 0.35em;
  }
  .area-label {
    fill: var(--color-text-muted);
    font-family: var(--font-sans);
    paint-order: stroke;
    stroke: var(--map-bg);
    stroke-width: 0.5em;
    stroke-linejoin: round;
  }
  .draft {
    fill: none;
    stroke: var(--color-accent);
    stroke-width: 2px;
    stroke-dasharray: 6 4;
    vector-effect: non-scaling-stroke;
  }
  .draft-point {
    fill: var(--color-accent);
  }
  .draft-point.first {
    fill: var(--map-bg);
    stroke: var(--color-accent);
    stroke-width: 2px;
    vector-effect: non-scaling-stroke;
  }
  .edge .line {
    stroke: currentColor;
    stroke-width: 2px;
    stroke-linecap: round;
    vector-effect: non-scaling-stroke;
  }
  .edge.jump .line {
    stroke-dasharray: 6 5;
  }
  .edge.unsurveyed .line {
    stroke-dasharray: 2 4;
    opacity: 0.6;
  }
  .edge.route .line {
    stroke: var(--color-accent);
    stroke-dasharray: 10 6;
  }
  .routed .edge:not(.on-route) .line {
    opacity: 0.25;
  }
  .routed .edge:not(.on-route) .distance {
    opacity: 0.35;
  }
  .edge.on-route .line {
    stroke: var(--color-warm);
    stroke-width: 4px;
  }
  .routed .node.off-route {
    opacity: 0.35;
  }
  .turn-ring {
    fill: none;
    stroke: var(--color-warm);
    stroke-width: 3px;
    stroke-dasharray: 4 3;
    vector-effect: non-scaling-stroke;
  }
  .pin-shape {
    fill: var(--color-warm);
    stroke: var(--map-bg);
    stroke-width: 1.5px;
    vector-effect: non-scaling-stroke;
  }
  .pin-number {
    fill: #06101f;
    font-weight: 700;
  }
  .pin-note {
    fill: var(--color-text);
    font-family: var(--font-sans);
    paint-order: stroke;
    stroke: var(--map-bg);
    stroke-width: 0.6em;
    stroke-linejoin: round;
  }
  .editable .pin {
    cursor: pointer;
  }
  .pin.selected .pin-shape,
  .editable .pin:hover .pin-shape {
    fill: var(--color-accent);
  }
  .edge .hit {
    stroke: transparent;
    stroke-width: 14px;
    vector-effect: non-scaling-stroke;
  }
  .editable .edge {
    cursor: pointer;
  }
  .editable .edge:hover .line,
  .edge.selected .line {
    stroke: var(--color-accent);
    stroke-width: 3px;
  }
  .distance {
    fill: var(--color-text-muted);
    paint-order: stroke;
    stroke: var(--map-bg);
    stroke-width: 0.8em;
    stroke-linejoin: round;
  }
  .node .hit {
    fill: transparent;
  }
  .editable .node {
    cursor: grab;
  }
  .node.selected,
  .editable .node:hover {
    color: var(--color-accent);
    filter: drop-shadow(0 0 3px var(--color-accent));
  }
  .label {
    fill: currentColor;
    font-family: var(--font-sans);
    font-weight: 600;
    paint-order: stroke;
    stroke: var(--map-bg);
    stroke-width: 0.6em;
    stroke-linejoin: round;
  }
  .depth {
    fill: var(--color-text-muted);
    paint-order: stroke;
    stroke: var(--map-bg);
    stroke-width: 0.6em;
    stroke-linejoin: round;
  }
  .compass line,
  .scale line {
    stroke: var(--color-text-muted);
    stroke-width: 1.5px;
    vector-effect: non-scaling-stroke;
  }
  .compass path {
    fill: var(--color-text-muted);
  }
  .compass text,
  .scale text {
    fill: var(--color-text-muted);
  }
</style>
