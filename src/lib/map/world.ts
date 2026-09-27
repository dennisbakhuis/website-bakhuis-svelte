import { geoNaturalEarth1, geoPath, type GeoProjection } from 'd3-geo';
import { feature } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import world from 'world-atlas/countries-110m.json';

// Server-side only: the world outline is projected once at module load and
// sent to the browser as SVG path strings, so the map needs no client JS and
// no third-party tiles. ~110m Natural Earth is plenty for dots on a globe.

export const MAP_WIDTH = 960;
export const MAP_HEIGHT = 480;

const topology = world as unknown as Topology<{ countries: GeometryCollection }>;
const countries = feature(topology, topology.objects.countries);

export const projection: GeoProjection = geoNaturalEarth1().fitSize(
  [MAP_WIDTH, MAP_HEIGHT],
  countries,
);

const pathGenerator = geoPath(projection);

export const landPath: string = pathGenerator(countries) ?? '';
export const spherePath: string = pathGenerator({ type: 'Sphere' }) ?? '';

export type Projected = { x: number; y: number };

export function project(lon: number, lat: number): Projected | null {
  const point = projection([lon, lat]);
  if (!point) return null;
  return { x: Math.round(point[0] * 10) / 10, y: Math.round(point[1] * 10) / 10 };
}
