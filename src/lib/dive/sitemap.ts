/**
 * Site maps: hand-drawn plans stored with a dive site. A map is stations and
 * objects (nodes), the lines between them (edges) and optional areas such as
 * a shoreline or a wreck footprint. Coordinates are metres in plan view
 * (x east, y south), so an edge without a measured distance falls back to
 * its drawn length.
 *
 * Two kinds share the format: a cave "stickmap" (line survey) and a lake or
 * wreck "sitemap". The kind only changes which markers are offered and how
 * the map is summarised.
 */

export type MapKind = 'stickmap' | 'sitemap';

export type NodeType =
  | 'entrance'
  | 'station'
  | 't'
  | 'jump'
  | 'restriction'
  | 'end'
  | 'air'
  | 'marker'
  | 'entry'
  | 'platform'
  | 'wreck'
  | 'object'
  | 'buoy'
  | 'hazard'
  | 'poi';

export type EdgeStyle = 'line' | 'jump' | 'unsurveyed' | 'route';

export type AreaKind =
  'outline' | 'depth' | 'shallows' | 'coral' | 'sand' | 'wall' | 'wreck' | 'reeds' | 'other';

export type MapNode = {
  id: string;
  x: number;
  y: number;
  type: NodeType;
  label: string;
  depth: number | null;
};

export type MapEdge = {
  from: string;
  to: string;
  distance: number | null;
  note: string;
  style: EdgeStyle;
};

export type MapPoint = { x: number; y: number };

export type MapArea = {
  id: string;
  kind: AreaKind;
  label: string;
  /** Depth of the feature, or of the shallow edge of a depth band. */
  depth: number | null;
  points: MapPoint[];
};

export type SiteMap = {
  version: number;
  kind: MapKind;
  title: string;
  /**
   * Compass bearing that "up" on the drawing points to, in degrees. 0 is a
   * north-up plan; a shore or a cave passage is usually easier to read drawn
   * along the page, and the compass needle swings to match.
   */
  north: number;
  nodes: MapNode[];
  edges: MapEdge[];
  areas: MapArea[];
  notes: string;
};

/** A stored map as the API returns it: the drawing plus its revision bookkeeping. */
export type SiteMapOut = SiteMap & {
  id: string;
  revision: number;
  revisions: number;
  updated_at: string;
};

export type MapEdgeRef = { from: string; to: string };

export type DiveMapPin = { id: string; x: number; y: number; note: string };

/** What one dive did on a site map, pinned to the revision it was drawn on. */
export type DiveMapAnnotation = {
  map_id: string;
  revision: number;
  route: MapEdgeRef[];
  turn: string | null;
  pins: DiveMapPin[];
  note: string;
};

export const MAP_KINDS: { kind: MapKind; label: string; hint: string }[] = [
  {
    kind: 'stickmap',
    label: 'Stick map',
    hint: 'Cave line survey: stations, T’s, jumps and where the line ends',
  },
  {
    kind: 'sitemap',
    label: 'Site map',
    hint: 'Lake, quarry or wreck: entry, platforms, objects, routes and the shore',
  },
];

export const NODE_TYPES: { type: NodeType; label: string; hint: string; kinds: MapKind[] }[] = [
  { type: 'entrance', label: 'Entrance', hint: 'Where the cave starts', kinds: ['stickmap'] },
  { type: 'entry', label: 'Entry / exit', hint: 'Where you get in the water', kinds: ['sitemap'] },
  {
    type: 'station',
    label: 'Station',
    hint: 'Survey station, tie-off or waypoint',
    kinds: ['stickmap', 'sitemap'],
  },
  { type: 't', label: 'T', hint: 'Permanent T in the line', kinds: ['stickmap'] },
  {
    type: 'jump',
    label: 'Jump',
    hint: 'Gap to another line, needs a jump reel',
    kinds: ['stickmap'],
  },
  { type: 'restriction', label: 'Restriction', hint: 'Tight spot', kinds: ['stickmap'] },
  { type: 'end', label: 'End of line', hint: 'Line ends here', kinds: ['stickmap'] },
  { type: 'air', label: 'Air', hint: 'Air bell or sump surface', kinds: ['stickmap'] },
  { type: 'platform', label: 'Platform', hint: 'Training platform', kinds: ['sitemap'] },
  { type: 'wreck', label: 'Wreck', hint: 'Boat, plane or other wreck', kinds: ['sitemap'] },
  {
    type: 'object',
    label: 'Object',
    hint: 'Car, statue, cage, anything sunk on purpose',
    kinds: ['sitemap'],
  },
  { type: 'buoy', label: 'Buoy', hint: 'Surface marker or descent line', kinds: ['sitemap'] },
  { type: 'hazard', label: 'Hazard', hint: 'Drop-off, current, entanglement', kinds: ['sitemap'] },
  { type: 'poi', label: 'Point of interest', hint: 'Worth a look', kinds: ['sitemap'] },
  {
    type: 'marker',
    label: 'Marker',
    hint: 'Cookie, arrow or other reference',
    kinds: ['stickmap', 'sitemap'],
  },
];

export const EDGE_STYLES: { style: EdgeStyle; label: string; kinds: MapKind[] }[] = [
  { style: 'line', label: 'Line', kinds: ['stickmap', 'sitemap'] },
  { style: 'jump', label: 'Jump (no line)', kinds: ['stickmap'] },
  { style: 'unsurveyed', label: 'Unsurveyed', kinds: ['stickmap', 'sitemap'] },
  { style: 'route', label: 'Swim route', kinds: ['sitemap'] },
];

export const AREA_KINDS: { kind: AreaKind; label: string }[] = [
  { kind: 'outline', label: 'Shore / outline' },
  { kind: 'depth', label: 'Depth band' },
  { kind: 'shallows', label: 'Shallows' },
  { kind: 'coral', label: 'Coral / reef' },
  { kind: 'sand', label: 'Sand' },
  { kind: 'wall', label: 'Wall / drop-off' },
  { kind: 'wreck', label: 'Wreck footprint' },
  { kind: 'reeds', label: 'Reeds / weed' },
  { kind: 'other', label: 'Other area' },
];

export function nodeTypesFor(kind: MapKind): typeof NODE_TYPES {
  return NODE_TYPES.filter((t) => t.kinds.includes(kind));
}

export function edgeStylesFor(kind: MapKind): typeof EDGE_STYLES {
  return EDGE_STYLES.filter((s) => s.kinds.includes(kind));
}

export function defaultTitle(kind: MapKind): string {
  return MAP_KINDS.find((k) => k.kind === kind)?.label ?? 'Map';
}

export function emptySiteMap(kind: MapKind = 'stickmap'): SiteMap {
  return { version: 2, kind, title: '', north: 0, nodes: [], edges: [], areas: [], notes: '' };
}

/** Bearings wrap, so keep whatever was stored inside a single turn. */
function bearing(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return ((n % 360) + 360) % 360;
}

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function text(value: unknown, max: number): string {
  return typeof value === 'string' ? value.slice(0, max) : '';
}

/** Fill in defaults so partially stored maps (or hand-written JSON) render. */
export function normalizeSiteMap(input: unknown): SiteMap {
  const raw = (input ?? {}) as Record<string, unknown>;
  const kind: MapKind = raw.kind === 'sitemap' ? 'sitemap' : 'stickmap';
  const nodes = Array.isArray(raw.nodes) ? (raw.nodes as Record<string, unknown>[]) : [];
  const edges = Array.isArray(raw.edges) ? (raw.edges as Record<string, unknown>[]) : [];
  const areas = Array.isArray(raw.areas) ? (raw.areas as Record<string, unknown>[]) : [];
  const ids = new Set<string>();
  const cleanNodes: MapNode[] = [];
  for (const n of nodes) {
    if (!n || typeof n.id !== 'string' || !n.id || ids.has(n.id)) continue;
    if (!Number.isFinite(Number(n.x)) || !Number.isFinite(Number(n.y))) continue;
    ids.add(n.id);
    cleanNodes.push({
      id: n.id,
      x: Number(n.x),
      y: Number(n.y),
      type: NODE_TYPES.find((t) => t.type === n.type)?.type ?? 'station',
      label: text(n.label, 80),
      depth: numberOrNull(n.depth),
    });
  }
  const cleanEdges: MapEdge[] = [];
  for (const e of edges) {
    if (!e || typeof e.from !== 'string' || typeof e.to !== 'string') continue;
    if (!ids.has(e.from) || !ids.has(e.to) || e.from === e.to) continue;
    const candidate = { from: e.from, to: e.to };
    if (cleanEdges.some((x) => sameEdge(x, candidate))) continue;
    cleanEdges.push({
      ...candidate,
      distance: numberOrNull(e.distance),
      note: text(e.note, 120),
      style: EDGE_STYLES.find((s) => s.style === e.style)?.style ?? 'line',
    });
  }
  const areaIds = new Set<string>();
  const cleanAreas: MapArea[] = [];
  for (const a of areas) {
    if (!a || typeof a.id !== 'string' || !a.id || areaIds.has(a.id)) continue;
    const points = (Array.isArray(a.points) ? (a.points as Record<string, unknown>[]) : [])
      .filter((p) => p && Number.isFinite(Number(p.x)) && Number.isFinite(Number(p.y)))
      .map((p) => ({ x: Number(p.x), y: Number(p.y) }));
    if (points.length < 3) continue;
    areaIds.add(a.id);
    cleanAreas.push({
      id: a.id,
      kind: AREA_KINDS.find((k) => k.kind === a.kind)?.kind ?? 'outline',
      label: text(a.label, 80),
      depth: numberOrNull(a.depth),
      points,
    });
  }
  return {
    version: 2,
    kind,
    title: text(raw.title, 120),
    north: bearing(raw.north),
    nodes: cleanNodes,
    edges: cleanEdges,
    areas: cleanAreas,
    notes: text(raw.notes, 2000),
  };
}

function sameEdge(a: { from: string; to: string }, b: { from: string; to: string }): boolean {
  return (a.from === b.from && a.to === b.to) || (a.from === b.to && a.to === b.from);
}

export function nextId(existing: { id: string }[], prefix: string): string {
  let n = existing.length + 1;
  while (existing.some((item) => item.id === `${prefix}${n}`)) n++;
  return `${prefix}${n}`;
}

export function findNode(map: SiteMap, id: string): MapNode | undefined {
  return map.nodes.find((n) => n.id === id);
}

export function addNode(
  map: SiteMap,
  x: number,
  y: number,
  connectTo: string | null = null,
): { map: SiteMap; id: string } {
  const id = nextId(map.nodes, 'n');
  const first: NodeType = map.kind === 'sitemap' ? 'entry' : 'entrance';
  const type: NodeType = map.nodes.length === 0 ? first : 'station';
  const node: MapNode = { id, x, y, type, label: '', depth: null };
  const edges = [...map.edges];
  if (connectTo && findNode(map, connectTo)) {
    edges.push({ from: connectTo, to: id, distance: null, note: '', style: 'line' });
  }
  return { map: { ...map, nodes: [...map.nodes, node], edges }, id };
}

export function removeNode(map: SiteMap, id: string): SiteMap {
  return {
    ...map,
    nodes: map.nodes.filter((n) => n.id !== id),
    edges: map.edges.filter((e) => e.from !== id && e.to !== id),
  };
}

export function updateNode(map: SiteMap, id: string, patch: Partial<MapNode>): SiteMap {
  return { ...map, nodes: map.nodes.map((n) => (n.id === id ? { ...n, ...patch, id } : n)) };
}

export function moveNode(map: SiteMap, id: string, x: number, y: number): SiteMap {
  return updateNode(map, id, { x, y });
}

/** Connect two stations, or remove the line between them if it already exists. */
export function toggleEdge(map: SiteMap, a: string, b: string): SiteMap {
  if (a === b || !findNode(map, a) || !findNode(map, b)) return map;
  const existing = map.edges.find((e) => sameEdge(e, { from: a, to: b }));
  if (existing) return { ...map, edges: map.edges.filter((e) => e !== existing) };
  return {
    ...map,
    edges: [...map.edges, { from: a, to: b, distance: null, note: '', style: 'line' }],
  };
}

export function updateEdge(
  map: SiteMap,
  from: string,
  to: string,
  patch: Partial<MapEdge>,
): SiteMap {
  return {
    ...map,
    edges: map.edges.map((e) => (sameEdge(e, { from, to }) ? { ...e, ...patch } : e)),
  };
}

export function addArea(
  map: SiteMap,
  kind: AreaKind,
  points: MapPoint[],
): { map: SiteMap; id: string } {
  const id = nextId(map.areas, 'a');
  if (points.length < 3) return { map, id: '' };
  const area: MapArea = {
    id,
    kind,
    label: '',
    depth: null,
    points: points.map((p) => ({ ...p })),
  };
  return { map: { ...map, areas: [...map.areas, area] }, id };
}

export function updateArea(map: SiteMap, id: string, patch: Partial<MapArea>): SiteMap {
  return { ...map, areas: map.areas.map((a) => (a.id === id ? { ...a, ...patch, id } : a)) };
}

export function removeArea(map: SiteMap, id: string): SiteMap {
  return { ...map, areas: map.areas.filter((a) => a.id !== id) };
}

export function edgeEndpoints(map: SiteMap, edge: MapEdge): { a: MapNode; b: MapNode } | null {
  const a = findNode(map, edge.from);
  const b = findNode(map, edge.to);
  return a && b ? { a, b } : null;
}

export function drawnLength(map: SiteMap, edge: MapEdge): number {
  const ends = edgeEndpoints(map, edge);
  if (!ends) return 0;
  return Math.hypot(ends.b.x - ends.a.x, ends.b.y - ends.a.y);
}

/** Measured distance when given, otherwise the drawn length rounded to a metre. */
export function edgeLength(map: SiteMap, edge: MapEdge): number {
  return edge.distance ?? Math.round(drawnLength(map, edge));
}

/** Metres of actual line (jumps and swim routes are not line). */
export function totalLine(map: SiteMap): number {
  return map.edges
    .filter((e) => e.style === 'line' || e.style === 'unsurveyed')
    .reduce((sum, e) => sum + edgeLength(map, e), 0);
}

export function maxDepth(map: SiteMap): number | null {
  const depths = [...map.nodes, ...map.areas]
    .map((item) => item.depth)
    .filter((d): d is number => d !== null);
  return depths.length ? Math.max(...depths) : null;
}

/**
 * Areas in paint order: depth bands first, shallow to deep, so nested bands
 * stack correctly; everything else keeps the order it was drawn in.
 */
export function orderedAreas(map: SiteMap): MapArea[] {
  const bands = map.areas
    .filter((a) => a.kind === 'depth')
    .sort((a, b) => (a.depth ?? 0) - (b.depth ?? 0));
  return [...bands, ...map.areas.filter((a) => a.kind !== 'depth')];
}

/** Water colour for a depth band, from the surface down to `deepest`. */
export function depthFill(depth: number | null, deepest: number): string {
  const t = deepest > 0 ? Math.min(1, Math.max(0, (depth ?? 0) / deepest)) : 0;
  const lightness = 62 - 42 * t;
  const saturation = 58 - 20 * t;
  const alpha = 0.3 + 0.32 * t;
  return `hsl(203 ${saturation.toFixed(0)}% ${lightness.toFixed(0)}% / ${alpha.toFixed(2)})`;
}

/** One-line description shown under a map's title. */
export function mapSummary(map: SiteMap): string {
  const parts: string[] = [];
  const depth = maxDepth(map);
  if (map.kind === 'stickmap') {
    parts.push(`${map.nodes.length} stations`, `${Math.round(totalLine(map))} m of line`);
  } else {
    const objects = map.nodes.filter((n) =>
      ['platform', 'wreck', 'object', 'poi'].includes(n.type),
    ).length;
    parts.push(`${objects} ${objects === 1 ? 'object' : 'objects'}`);
    const line = Math.round(totalLine(map));
    if (line) parts.push(`${line} m of line`);
  }
  if (depth !== null) parts.push(`max ${depth} m`);
  return parts.join(' · ');
}

export type Box = { minX: number; minY: number; maxX: number; maxY: number };

export function mapBounds(map: SiteMap, pad = 12): Box {
  const points: MapPoint[] = [...map.nodes, ...map.areas.flatMap((a) => a.points)];
  if (points.length === 0) return { minX: -pad, minY: -pad, maxX: pad, maxY: pad };
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  return {
    minX: Math.min(...xs) - pad,
    minY: Math.min(...ys) - pad,
    maxX: Math.max(...xs) + pad,
    maxY: Math.max(...ys) + pad,
  };
}

export function snap(value: number, grid: number): number {
  return Math.round(value / grid) * grid;
}

/** Depth text as shown next to a station. */
export function depthLabel(depth: number | null): string {
  return depth === null ? '' : `${Number.isInteger(depth) ? depth : depth.toFixed(1)} m`;
}

export type LegendEntry =
  | { kind: 'node'; type: NodeType; label: string }
  | { kind: 'edge'; style: EdgeStyle; label: string }
  | { kind: 'area'; area: AreaKind; label: string };

/** Only the symbols this map actually uses, in a stable order. */
export function legendFor(map: SiteMap): LegendEntry[] {
  const nodeTypes = new Set(map.nodes.map((n) => n.type));
  const edgeStyles = new Set(map.edges.map((e) => e.style));
  const areaKinds = new Set(map.areas.map((a) => a.kind));
  return [
    ...NODE_TYPES.filter((t) => nodeTypes.has(t.type) && t.type !== 'station').map(
      (t): LegendEntry => ({ kind: 'node', type: t.type, label: t.label }),
    ),
    ...EDGE_STYLES.filter((s) => edgeStyles.has(s.style) && s.style !== 'line').map(
      (s): LegendEntry => ({ kind: 'edge', style: s.style, label: s.label }),
    ),
    ...AREA_KINDS.filter((a) => areaKinds.has(a.kind)).map((a): LegendEntry => ({
      kind: 'area',
      area: a.kind,
      label: a.label,
    })),
  ];
}

export function edgeKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function emptyAnnotation(map: SiteMapOut): DiveMapAnnotation {
  return { map_id: map.id, revision: map.revision, route: [], turn: null, pins: [], note: '' };
}

export function routeKeys(annotation: DiveMapAnnotation): Set<string> {
  return new Set(annotation.route.map((leg) => edgeKey(leg.from, leg.to)));
}

/** Add or remove a leg of the route. */
export function toggleRouteLeg(
  annotation: DiveMapAnnotation,
  from: string,
  to: string,
): DiveMapAnnotation {
  const key = edgeKey(from, to);
  const exists = annotation.route.some((leg) => edgeKey(leg.from, leg.to) === key);
  return {
    ...annotation,
    route: exists
      ? annotation.route.filter((leg) => edgeKey(leg.from, leg.to) !== key)
      : [...annotation.route, { from, to }],
  };
}

export function addPin(
  annotation: DiveMapAnnotation,
  x: number,
  y: number,
  note = '',
): { annotation: DiveMapAnnotation; id: string } {
  const id = nextId(annotation.pins, 'p');
  return { annotation: { ...annotation, pins: [...annotation.pins, { id, x, y, note }] }, id };
}

export function updatePin(
  annotation: DiveMapAnnotation,
  id: string,
  patch: Partial<DiveMapPin>,
): DiveMapAnnotation {
  return {
    ...annotation,
    pins: annotation.pins.map((p) => (p.id === id ? { ...p, ...patch, id } : p)),
  };
}

export function removePin(annotation: DiveMapAnnotation, id: string): DiveMapAnnotation {
  return { ...annotation, pins: annotation.pins.filter((p) => p.id !== id) };
}

/** Metres of line covered by the route, counting each leg once. */
export function routeLength(map: SiteMap, annotation: DiveMapAnnotation): number {
  const keys = routeKeys(annotation);
  return map.edges
    .filter((e) => keys.has(edgeKey(e.from, e.to)))
    .reduce((sum, e) => sum + edgeLength(map, e), 0);
}

/** Drop route legs, the turn and nothing else that the given map no longer has. */
export function fitAnnotation(map: SiteMap, annotation: DiveMapAnnotation): DiveMapAnnotation {
  const keys = new Set(map.edges.map((e) => edgeKey(e.from, e.to)));
  const nodes = new Set(map.nodes.map((n) => n.id));
  return {
    ...annotation,
    route: annotation.route.filter((leg) => keys.has(edgeKey(leg.from, leg.to))),
    turn: annotation.turn && nodes.has(annotation.turn) ? annotation.turn : null,
  };
}

export function annotationSummary(map: SiteMap, annotation: DiveMapAnnotation): string {
  const parts: string[] = [];
  const metres = Math.round(routeLength(map, annotation));
  if (metres) parts.push(`${metres} m of line`);
  const turn = annotation.turn ? findNode(map, annotation.turn) : undefined;
  if (turn) {
    parts.push(
      `turned at ${turn.label || turn.id}${turn.depth !== null ? ` (${depthLabel(turn.depth)})` : ''}`,
    );
  }
  if (annotation.pins.length) {
    parts.push(`${annotation.pins.length} ${annotation.pins.length === 1 ? 'note' : 'notes'}`);
  }
  return parts.join(' · ');
}
