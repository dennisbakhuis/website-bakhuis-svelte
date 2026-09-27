import { describe, expect, it } from 'vitest';
import {
  addArea,
  addNode,
  addPin,
  annotationSummary,
  depthFill,
  depthLabel,
  edgeKey,
  edgeLength,
  edgeStylesFor,
  emptyAnnotation,
  emptySiteMap,
  fitAnnotation,
  legendFor,
  mapBounds,
  mapSummary,
  maxDepth,
  moveNode,
  nodeTypesFor,
  normalizeSiteMap,
  orderedAreas,
  removeArea,
  removeNode,
  removePin,
  routeLength,
  snap,
  toggleEdge,
  toggleRouteLeg,
  totalLine,
  updateArea,
  updateEdge,
  updateNode,
  updatePin,
} from './sitemap';

describe('site map editing', () => {
  it('starts a stick map with an entrance and a site map with an entry', () => {
    const cave = addNode(emptySiteMap('stickmap'), 0, 0);
    expect(cave.map.nodes[0].type).toBe('entrance');
    const lake = addNode(emptySiteMap('sitemap'), 0, 0);
    expect(lake.map.nodes[0].type).toBe('entry');
    const second = addNode(cave.map, 30, 10, cave.id);
    expect(second.map.edges).toEqual([
      { from: cave.id, to: second.id, distance: null, note: '', style: 'line' },
    ]);
    expect(second.map.nodes[1].type).toBe('station');
  });

  it('offers markers and line styles per kind', () => {
    const cave = nodeTypesFor('stickmap').map((t) => t.type);
    const lake = nodeTypesFor('sitemap').map((t) => t.type);
    expect(cave).toContain('t');
    expect(cave).not.toContain('wreck');
    expect(lake).toContain('wreck');
    expect(lake).not.toContain('restriction');
    expect(lake).toContain('station');
    expect(edgeStylesFor('sitemap').map((s) => s.style)).toEqual(['line', 'unsurveyed', 'route']);
  });

  it('removes a node together with its lines', () => {
    const a = addNode(emptySiteMap(), 0, 0);
    const b = addNode(a.map, 10, 0, a.id);
    const c = addNode(b.map, 20, 0, b.id);
    const without = removeNode(c.map, b.id);
    expect(without.nodes.map((n) => n.id)).toEqual([a.id, c.id]);
    expect(without.edges).toEqual([]);
  });

  it('toggles a connection in either direction', () => {
    const a = addNode(emptySiteMap(), 0, 0);
    const b = addNode(a.map, 10, 0);
    const linked = toggleEdge(b.map, a.id, b.id);
    expect(linked.edges).toHaveLength(1);
    expect(toggleEdge(linked, b.id, a.id).edges).toHaveLength(0);
    expect(toggleEdge(b.map, a.id, a.id)).toBe(b.map);
    expect(toggleEdge(b.map, a.id, 'missing')).toBe(b.map);
  });

  it('uses the measured distance when present and the drawn length otherwise', () => {
    const a = addNode(emptySiteMap(), 0, 0);
    const b = addNode(a.map, 30, 40, a.id);
    expect(edgeLength(b.map, b.map.edges[0])).toBe(50);
    const measured = updateEdge(b.map, a.id, b.id, { distance: 62 });
    expect(edgeLength(measured, measured.edges[0])).toBe(62);
    expect(totalLine(measured)).toBe(62);
    expect(totalLine(updateEdge(measured, b.id, a.id, { style: 'route' }))).toBe(0);
  });

  it('updates and moves nodes without changing ids', () => {
    const a = addNode(emptySiteMap(), 0, 0);
    const renamed = updateNode(a.map, a.id, { label: 'In', id: 'hacked', depth: 3.5 });
    expect(renamed.nodes[0].id).toBe(a.id);
    expect(maxDepth(renamed)).toBe(3.5);
    expect(moveNode(renamed, a.id, 5, -5).nodes[0]).toMatchObject({ x: 5, y: -5 });
    expect(maxDepth(emptySiteMap())).toBeNull();
  });

  it('manages areas and includes them in the bounds', () => {
    const base = emptySiteMap('sitemap');
    expect(addArea(base, 'outline', [{ x: 0, y: 0 }]).map).toBe(base);
    const { map, id } = addArea(base, 'outline', [
      { x: -50, y: 0 },
      { x: 0, y: -20 },
      { x: 10, y: 10 },
    ]);
    expect(map.areas[0]).toMatchObject({ id, kind: 'outline', label: '' });
    expect(mapBounds(map, 0)).toEqual({ minX: -50, minY: -20, maxX: 10, maxY: 10 });
    const labelled = updateArea(map, id, { label: 'Shore', kind: 'shallows' });
    expect(labelled.areas[0].kind).toBe('shallows');
    expect(removeArea(labelled, id).areas).toEqual([]);
  });

  it('summarises by kind and builds a legend from what is used', () => {
    const cave = addNode(emptySiteMap('stickmap'), 0, 0);
    const cave2 = addNode(cave.map, 40, 0, cave.id);
    const withDepth = updateNode(cave2.map, cave2.id, { depth: 20, type: 'end' });
    expect(mapSummary(withDepth)).toBe('2 stations · 40 m of line · max 20 m');
    expect(legendFor(withDepth).map((l) => l.label)).toEqual(['Entrance', 'End of line']);

    const lake = addNode(emptySiteMap('sitemap'), 0, 0);
    const wreck = updateNode(addNode(lake.map, 30, 0).map, 'n2', { type: 'wreck', depth: 18 });
    const routed = toggleEdge(wreck, 'n1', 'n2');
    const summary = mapSummary(updateEdge(routed, 'n1', 'n2', { style: 'route' }));
    expect(summary).toBe('1 object · max 18 m');
    expect(legendFor(routed).map((l) => l.label)).toEqual(['Entry / exit', 'Wreck']);
  });

  it('computes bounds with padding and snaps to the grid', () => {
    expect(mapBounds(emptySiteMap(), 10)).toEqual({ minX: -10, minY: -10, maxX: 10, maxY: 10 });
    expect(snap(13.4, 5)).toBe(15);
    expect(snap(-2.6, 1)).toBe(-3);
    expect(depthLabel(null)).toBe('');
    expect(depthLabel(12)).toBe('12 m');
    expect(depthLabel(12.25)).toBe('12.3 m');
  });
});

describe('normalizeSiteMap', () => {
  it('drops broken nodes, dangling edges, tiny areas and duplicates', () => {
    const map = normalizeSiteMap({
      kind: 'sitemap',
      title: 'Lake',
      nodes: [
        { id: 'a', x: 0, y: 0, type: 'entry' },
        { id: 'a', x: 1, y: 1 },
        { id: 'b', x: '10', y: 5, type: 'bogus', depth: '' },
        { id: '', x: 1, y: 1 },
        { id: 'c', x: 'nope', y: 1 },
      ],
      edges: [
        { from: 'a', to: 'b', distance: '12', style: 'weird' },
        { from: 'b', to: 'a' },
        { from: 'a', to: 'zzz' },
        { from: 'a', to: 'a' },
      ],
      areas: [
        {
          id: 's',
          kind: 'shallows',
          points: [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 'x', y: 1 },
          ],
        },
        {
          id: 't',
          kind: 'nope',
          points: [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 1, y: 1 },
          ],
        },
      ],
      notes: 42,
    });
    expect(map.kind).toBe('sitemap');
    expect(map.title).toBe('Lake');
    expect(map.nodes).toEqual([
      { id: 'a', x: 0, y: 0, type: 'entry', label: '', depth: null },
      { id: 'b', x: 10, y: 5, type: 'station', label: '', depth: null },
    ]);
    expect(map.edges).toEqual([{ from: 'a', to: 'b', distance: 12, note: '', style: 'line' }]);
    expect(map.areas).toEqual([
      {
        id: 't',
        kind: 'outline',
        label: '',
        depth: null,
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 1, y: 1 },
        ],
      },
    ]);
    expect(map.notes).toBe('');
    expect(normalizeSiteMap(null)).toEqual(emptySiteMap('stickmap'));
    expect(normalizeSiteMap({ kind: 'treasure' }).kind).toBe('stickmap');
  });
});

describe('dive annotations', () => {
  const stored = (map: ReturnType<typeof emptySiteMap>) => ({
    ...map,
    id: 'm1',
    revision: 2,
    revisions: 3,
    updated_at: '2026-09-12T10:00:00Z',
  });

  it('toggles route legs regardless of direction and measures them', () => {
    const a = addNode(emptySiteMap(), 0, 0);
    const b = addNode(a.map, 30, 40, a.id);
    const c = addNode(b.map, 60, 40, b.id);
    const map = stored(updateNode(c.map, c.id, { label: 'Far end', depth: 21 }));
    let ann = emptyAnnotation(map);
    expect(ann).toMatchObject({ map_id: 'm1', revision: 2, route: [], turn: null });
    ann = toggleRouteLeg(ann, b.id, a.id);
    ann = toggleRouteLeg(ann, b.id, c.id);
    expect(routeLength(map, ann)).toBe(80);
    ann = toggleRouteLeg(ann, a.id, b.id);
    expect(ann.route).toEqual([{ from: b.id, to: c.id }]);
    expect(edgeKey('z', 'a')).toBe('a|z');
    const withTurn = { ...ann, turn: c.id };
    expect(annotationSummary(map, withTurn)).toBe('30 m of line · turned at Far end (21 m)');
  });

  it('manages pins and drops legs the map no longer has', () => {
    const a = addNode(emptySiteMap(), 0, 0);
    const b = addNode(a.map, 10, 0, a.id);
    const map = stored(b.map);
    const { annotation, id } = addPin(emptyAnnotation(map), 5, 5, 'silty');
    expect(annotation.pins).toEqual([{ id, x: 5, y: 5, note: 'silty' }]);
    const renamed = updatePin(annotation, id, { note: 'very silty', id: 'nope' });
    expect(renamed.pins[0]).toMatchObject({ id, note: 'very silty' });
    expect(removePin(renamed, id).pins).toEqual([]);
    const routed = { ...toggleRouteLeg(renamed, a.id, b.id), turn: b.id };
    const shrunk = fitAnnotation(removeNode(map, b.id), routed);
    expect(shrunk.route).toEqual([]);
    expect(shrunk.turn).toBeNull();
    expect(shrunk.pins).toHaveLength(1);
    expect(annotationSummary(map, renamed)).toBe('1 note');
  });
});

describe('depth bands', () => {
  it('paints bands shallow to deep, ahead of every other area', () => {
    const map = normalizeSiteMap({
      kind: 'sitemap',
      areas: [
        { id: 'coral', kind: 'coral', points: square(), depth: 8 },
        { id: 'deep', kind: 'depth', points: square(), depth: 25 },
        { id: 'shallow', kind: 'depth', points: square(), depth: 5 },
        { id: 'shore', kind: 'outline', points: square() },
      ],
    });
    expect(orderedAreas(map).map((a) => a.id)).toEqual(['shallow', 'deep', 'coral', 'shore']);
  });

  it('counts area depths towards the deepest point', () => {
    const map = normalizeSiteMap({
      kind: 'sitemap',
      areas: [{ id: 'a1', kind: 'depth', points: square(), depth: 24 }],
    });
    expect(maxDepth(map)).toBe(24);
  });

  it('darkens the water with depth and keeps the ramp in range', () => {
    const surface = depthFill(0, 30);
    const bottom = depthFill(30, 30);
    expect(surface).not.toBe(bottom);
    expect(depthFill(60, 30)).toBe(bottom);
    expect(depthFill(null, 0)).toBe(depthFill(0, 0));
  });
});

function square() {
  return [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
  ];
}

describe('north bearing', () => {
  it('defaults to a north-up plan', () => {
    expect(emptySiteMap('sitemap').north).toBe(0);
    expect(normalizeSiteMap({}).north).toBe(0);
  });

  it('wraps a stored bearing into a single turn and ignores nonsense', () => {
    expect(normalizeSiteMap({ north: 400 }).north).toBe(40);
    expect(normalizeSiteMap({ north: -45 }).north).toBe(315);
    expect(normalizeSiteMap({ north: 'east' }).north).toBe(0);
  });
});
